import { api, unwrap } from "./http";

export type UserRole = "ADMIN" | "TEACHER" | "LEARNER";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  fullName: string;
  avatarKey: string | null;
  contactNumber: string | null;
};

/** `identifier` is a username or an email. */
export function login(identifier: string, password: string) {
  return unwrap<{ user: AuthUser; token: string }>(
    api.post("/api/auth/login", { identifier, password }),
  );
}

/** `identifier` is a username or an email. */
export function teacherLogin(identifier: string, password: string) {
  return unwrap<{ user: AuthUser; token: string }>(
    api.post("/api/auth/teacher/login", { identifier, password }),
  );
}

export function getCurrentUser() {
  return unwrap<AuthUser>(api.get("/api/auth/me"));
}

export async function logout() {
  await api.post("/api/auth/logout");
}

/** Learners edit `avatarKey`; teachers edit `contactNumber`. */
export type ProfileUpdate = {
  fullName?: string;
  avatarKey?: string | null;
  contactNumber?: string | null;
};

export function updateProfile(data: ProfileUpdate) {
  return unwrap<AuthUser>(api.patch("/api/auth/me", data));
}

export function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return unwrap<{ message: string }>(
    api.post("/api/auth/change-password", data),
  );
}
