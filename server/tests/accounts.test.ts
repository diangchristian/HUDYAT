import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("accounts");

let adminToken: string;
let teacherToken: string;
let learnerToken: string;

const tokenFor = async (role: keyof typeof LOGIN_PATH) => {
  const user = await ctx.createUser(role);
  const { data } = await ctx.request("POST", LOGIN_PATH[role], {
    body: { identifier: user.username, password: PASSWORD },
  });
  return { user, token: data.token as string };
};

before(async () => {
  await ctx.start();
  adminToken = (await tokenFor("ADMIN")).token;
  teacherToken = (await tokenFor("TEACHER")).token;
  learnerToken = (await tokenFor("LEARNER")).token;
});
after(ctx.stop);

const login = (role: keyof typeof LOGIN_PATH, identifier: string, password: string) =>
  ctx.request("POST", LOGIN_PATH[role], { body: { identifier, password } });

const newLearner = () => ({
  fullName: "Created Learner",
  username: ctx.unique("kid"),
  password: "Learner123",
});

const createLearner = async () => {
  const input = newLearner();
  const { data } = await ctx.request("POST", "/api/teacher/learners", {
    token: teacherToken,
    body: input,
  });
  return { ...input, id: data.id as string };
};

const newTeacher = () => {
  const username = ctx.unique("staff");
  return {
    fullName: "Created Teacher",
    username,
    email: `${username}@example.com`,
    contactNumber: "0900 000 0000",
  };
};

const activityFor = async (action: string, target: string) => {
  const { data } = await ctx.request(
    "GET",
    `/api/admin/activity?action=${action}`,
    { token: adminToken },
  );
  return data.entries.filter(
    (entry: { target: string }) => entry.target === target,
  );
};

/* ---------- Teachers manage learners ---------- */

test("a teacher creates a learner, who logs in with that password and isn't forced to change it", async () => {
  const input = newLearner();
  const created = await ctx.request("POST", "/api/teacher/learners", {
    token: teacherToken,
    body: input,
  });
  assert.equal(created.status, 200);
  assert.equal(JSON.stringify(created.body).includes(input.password), false);

  const loggedIn = await login("LEARNER", input.username, input.password);
  assert.equal(loggedIn.status, 201);
  assert.equal(loggedIn.data.user.fullName, input.fullName);
  assert.equal(loggedIn.data.user.mustChangePassword, false);

  const learners = await ctx.request("GET", "/api/teacher/learners", {
    token: teacherToken,
  });
  assert.ok(
    learners.data.some((row: { username: string }) => row.username === input.username),
  );
});

test("a learner can't be created with a taken username or invalid details", async () => {
  const { username } = await createLearner();

  const cases: Array<[Record<string, string>, number]> = [
    [{ ...newLearner(), username }, 409],
    [{ ...newLearner(), username: "has spaces" }, 400],
    [{ ...newLearner(), password: "short" }, 400],
    [{ ...newLearner(), fullName: "   " }, 400],
  ];

  for (const [body, expected] of cases) {
    const { status, body: response } = await ctx.request(
      "POST",
      "/api/teacher/learners",
      { token: teacherToken, body },
    );
    assert.equal(status, expected, JSON.stringify(body));
    assert.equal(typeof response.message, "string");
  }
});

test("only teachers can create learners", async () => {
  for (const token of [adminToken, learnerToken]) {
    const { status } = await ctx.request("POST", "/api/teacher/learners", {
      token,
      body: newLearner(),
    });
    assert.equal(status, 403);
  }
});

test("a teacher resets a learner's password without forcing a change", async () => {
  const learner = await createLearner();

  const reset = await ctx.request(
    "POST",
    `/api/teacher/learners/${learner.id}/reset-password`,
    { token: teacherToken, body: { password: "NewLearner123" } },
  );
  assert.equal(reset.status, 200);

  assert.equal((await login("LEARNER", learner.username, learner.password)).status, 400);
  const loggedIn = await login("LEARNER", learner.username, "NewLearner123");
  assert.equal(loggedIn.status, 201);
  assert.equal(loggedIn.data.user.mustChangePassword, false);
});

test("a teacher can deactivate and reactivate a learner, but not another teacher", async () => {
  const learner = await createLearner();
  const statusPath = `/api/teacher/learners/${learner.id}/status`;

  await ctx.request("PATCH", statusPath, {
    token: teacherToken,
    body: { isActive: false },
  });
  assert.equal((await login("LEARNER", learner.username, learner.password)).status, 403);

  await ctx.request("PATCH", statusPath, {
    token: teacherToken,
    body: { isActive: true },
  });
  assert.equal((await login("LEARNER", learner.username, learner.password)).status, 201);

  const otherTeacher = await ctx.createUser("TEACHER");
  const { status } = await ctx.request(
    "PATCH",
    `/api/teacher/learners/${otherTeacher.id}/status`,
    { token: teacherToken, body: { isActive: false } },
  );
  assert.equal(status, 404);
});

test("the status endpoint needs a real true or false", async () => {
  const learner = await createLearner();
  const { status } = await ctx.request(
    "PATCH",
    `/api/teacher/learners/${learner.id}/status`,
    { token: teacherToken, body: { isActive: "no" } },
  );
  assert.equal(status, 400);
});

/* ---------- Admin manages teachers ---------- */

test("an admin creates a teacher, whose temporary password must be changed", async () => {
  const input = newTeacher();
  const created = await ctx.request("POST", "/api/admin/teachers", {
    token: adminToken,
    body: input,
  });
  assert.equal(created.status, 200);
  assert.equal(created.data.teacher.email, input.email);

  const { temporaryPassword } = created.data;
  assert.ok(temporaryPassword.length >= 8);

  const loggedIn = await login("TEACHER", input.username, temporaryPassword);
  assert.equal(loggedIn.status, 201);
  assert.equal(loggedIn.data.user.mustChangePassword, true);

  const listed = await ctx.request("GET", "/api/admin/teachers", {
    token: adminToken,
  });
  const row = listed.data.find(
    (teacher: { username: string }) => teacher.username === input.username,
  );
  assert.equal(row.fullName, input.fullName);
  assert.equal(row.contactNumber, input.contactNumber);
  assert.equal(row.isActive, true);
  assert.equal(JSON.stringify(listed.body).includes("password"), false);
});

test("a teacher can't be created with a taken email or invalid details", async () => {
  const first = newTeacher();
  await ctx.request("POST", "/api/admin/teachers", {
    token: adminToken,
    body: first,
  });

  const cases: Array<[Record<string, string>, number]> = [
    [{ ...newTeacher(), email: first.email }, 409],
    [{ ...newTeacher(), username: first.username }, 409],
    [{ ...newTeacher(), email: "not-an-email" }, 400],
  ];

  for (const [body, expected] of cases) {
    const { status } = await ctx.request("POST", "/api/admin/teachers", {
      token: adminToken,
      body,
    });
    assert.equal(status, expected, JSON.stringify(body));
  }
});

test("an admin edits a teacher's details, and login follows the new email", async () => {
  const input = newTeacher();
  const { data } = await ctx.request("POST", "/api/admin/teachers", {
    token: adminToken,
    body: input,
  });
  const email = `${ctx.unique("renamed")}@example.com`;

  const edited = await ctx.request(
    "PATCH",
    `/api/admin/teachers/${data.teacher.id}`,
    {
      token: adminToken,
      body: { ...input, fullName: "Renamed Teacher", email, contactNumber: "" },
    },
  );
  assert.equal(edited.status, 200);
  assert.equal(edited.data.fullName, "Renamed Teacher");
  assert.equal(edited.data.email, email);
  assert.equal(edited.data.contactNumber, null);

  assert.equal((await login("TEACHER", email, data.temporaryPassword)).status, 201);
});

test("an admin resets a teacher's password to a new temporary one", async () => {
  const input = newTeacher();
  const { data } = await ctx.request("POST", "/api/admin/teachers", {
    token: adminToken,
    body: input,
  });

  const reset = await ctx.request(
    "POST",
    `/api/admin/teachers/${data.teacher.id}/reset-password`,
    { token: adminToken },
  );
  assert.equal(reset.status, 200);

  assert.equal((await login("TEACHER", input.username, data.temporaryPassword)).status, 400);
  const loggedIn = await login("TEACHER", input.username, reset.data.temporaryPassword);
  assert.equal(loggedIn.status, 201);
  assert.equal(loggedIn.data.user.mustChangePassword, true);
});

test("an admin deactivates teachers and learners, but has no way to reset a learner's password", async () => {
  const learner = await createLearner();
  const teacher = await ctx.createUser("TEACHER");

  const listed = await ctx.request("GET", "/api/admin/learners", {
    token: adminToken,
  });
  const row = listed.data.find((l: { id: string }) => l.id === learner.id);
  assert.equal(row.username, learner.username);
  assert.equal("progress" in row, false);

  await ctx.request("PATCH", `/api/admin/learners/${learner.id}/status`, {
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal((await login("LEARNER", learner.username, learner.password)).status, 403);

  await ctx.request("PATCH", `/api/admin/teachers/${teacher.id}/status`, {
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal((await login("TEACHER", teacher.username, PASSWORD)).status, 403);

  const reset = await ctx.request(
    "POST",
    `/api/admin/learners/${learner.id}/reset-password`,
    { token: adminToken, body: { password: "Whatever123" } },
  );
  assert.equal(reset.status, 404);
});

test("only admins can use the admin API", async () => {
  for (const token of [teacherToken, learnerToken]) {
    const { status } = await ctx.request("GET", "/api/admin/teachers", { token });
    assert.equal(status, 403);
  }
  assert.equal((await ctx.request("GET", "/api/admin/teachers")).status, 401);
});

/* ---------- Audit ---------- */

test("account actions are logged with who did them, and never include passwords", async () => {
  const learner = await createLearner();
  await ctx.request("POST", `/api/teacher/learners/${learner.id}/reset-password`, {
    token: teacherToken,
    body: { password: "AuditSecret123" },
  });
  await ctx.request("PATCH", `/api/admin/learners/${learner.id}/status`, {
    token: adminToken,
    body: { isActive: false },
  });

  const created = await activityFor("ACCOUNT_CREATED", learner.username);
  assert.equal(created.length, 1);
  assert.equal(created[0].actorRole, "TEACHER");

  assert.equal((await activityFor("PASSWORD_RESET", learner.username)).length, 1);

  const deactivated = await activityFor("ACCOUNT_DEACTIVATED", learner.username);
  assert.equal(deactivated.length, 1);
  assert.equal(deactivated[0].actorRole, "ADMIN");

  const everything = await ctx.request("GET", "/api/admin/activity", {
    token: adminToken,
  });
  assert.equal(JSON.stringify(everything.body).includes("AuditSecret123"), false);
});

test("the activity log is paged newest first", async () => {
  for (let i = 0; i < 2; i += 1) await createLearner();

  const { data } = await ctx.request("GET", "/api/admin/activity?page=1", {
    token: adminToken,
  });
  assert.ok(data.total >= 2);
  assert.ok(data.entries.length <= data.pageSize);

  const times = data.entries.map((entry: { at: string }) => Date.parse(entry.at));
  assert.deepEqual(times, [...times].sort((a, b) => b - a));
});
