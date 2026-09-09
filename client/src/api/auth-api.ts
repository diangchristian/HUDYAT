import { api, unwrap } from "./http";

export type UserRole = "ADMIN" | "TEACHER" | "LEARNER";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  fullName: string;
  avatarKey: string | null;
};

export function login(email: string, password: string) {
  return unwrap<{ user: AuthUser; token: string }>(
    api.post("/api/auth/login", { email, password }),
  );
}

export function getCurrentUser() {
  return unwrap<AuthUser>(api.get("/api/auth/me"));
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export function updateProfile(data: {
  fullName?: string;
  avatarKey?: string | null;
}) {
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
