import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("auth");

before(ctx.start);
after(ctx.stop);

const logIn = async (
  role: keyof typeof LOGIN_PATH,
  overrides: { isActive?: boolean; mustChangePassword?: boolean } = {},
) => {
  const user = await ctx.createUser(role, overrides);
  const response = await ctx.request("POST", LOGIN_PATH[role], {
    body: { identifier: user.username, password: PASSWORD },
  });
  return { user, response, token: response.data?.token as string };
};

test("public registration no longer exists", async () => {
  const { status } = await ctx.request("POST", "/api/auth/register", {
    body: {
      username: ctx.unique("selfsignup"),
      email: `${ctx.unique("selfsignup")}@example.com`,
      password: PASSWORD,
    },
  });

  assert.equal(status, 404);
});

test("an admin can log in through the admin portal", async () => {
  const { response, user } = await logIn("ADMIN");

  assert.equal(response.status, 201);
  assert.equal(response.data.user.id, user.id);
  assert.equal(response.data.user.role, "ADMIN");
});

test("each portal only accepts its own role", async () => {
  const roles = ["ADMIN", "TEACHER", "LEARNER"] as const;

  for (const role of roles) {
    const user = await ctx.createUser(role);

    for (const portal of roles.filter((other) => other !== role)) {
      const { status } = await ctx.request("POST", LOGIN_PATH[portal], {
        body: { identifier: user.username, password: PASSWORD },
      });
      assert.equal(status, 403, `${role} through the ${portal} portal`);
    }
  }
});

test("a deactivated account can't log in", async () => {
  const { response } = await logIn("LEARNER", { isActive: false });

  assert.equal(response.status, 403);
});

test("deactivating an account ends its existing session right away", async () => {
  const { token, user } = await logIn("LEARNER");
  assert.equal((await ctx.request("GET", "/api/auth/me", { token })).status, 200);

  const { prisma } = await import("../src/config/db.js");
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

  assert.equal((await ctx.request("GET", "/api/auth/me", { token })).status, 401);
});

test("a temporary password can't be kept by re-entering it as the new one", async () => {
  const { token } = await logIn("TEACHER", { mustChangePassword: true });

  const reused = await ctx.request("POST", "/api/auth/change-password", {
    token,
    body: { currentPassword: PASSWORD, newPassword: PASSWORD },
  });
  assert.equal(reused.status, 400);

  const me = await ctx.request("GET", "/api/auth/me", { token });
  assert.equal(me.data.mustChangePassword, true);
});

test("a new password is limited to what bcrypt actually uses", async () => {
  const { token } = await logIn("LEARNER");

  const { status } = await ctx.request("POST", "/api/auth/change-password", {
    token,
    body: { currentPassword: PASSWORD, newPassword: "x".repeat(73) },
  });

  assert.equal(status, 400);
});

test("a temporary password only allows changing it until it's changed", async () => {
  const { token, response } = await logIn("TEACHER", {
    mustChangePassword: true,
  });
  assert.equal(response.data.user.mustChangePassword, true);

  const blocked = await ctx.request("GET", "/api/teacher/learners", { token });
  assert.equal(blocked.status, 403);

  const me = await ctx.request("GET", "/api/auth/me", { token });
  assert.equal(me.data.mustChangePassword, true);

  const changed = await ctx.request("POST", "/api/auth/change-password", {
    token,
    body: { currentPassword: PASSWORD, newPassword: "Changed1234!" },
  });
  assert.equal(changed.status, 200);

  const after = await ctx.request("GET", "/api/auth/me", { token });
  assert.equal(after.data.mustChangePassword, false);
  assert.equal(
    (await ctx.request("GET", "/api/teacher/learners", { token })).status,
    200,
  );
});
