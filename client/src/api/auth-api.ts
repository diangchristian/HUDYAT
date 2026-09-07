import { api, unwrap } from "./http";

export type UserRole = "ADMIN" | "TEACHER" | "LEARNER";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
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
