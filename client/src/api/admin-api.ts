import { api, unwrap } from "./http";

export const ACTIVITY_ACTION_LABELS = {
  ACCOUNT_CREATED: "Account created",
  ACCOUNT_UPDATED: "Account updated",
  ACCOUNT_DEACTIVATED: "Account deactivated",
  ACCOUNT_REACTIVATED: "Account reactivated",
  PASSWORD_RESET: "Password reset",
  LESSON_EDITED: "Lesson edited",
} as const;

export type ActivityAction = keyof typeof ACTIVITY_ACTION_LABELS;

export type ActivityEntry = {
  id: string;
  action: ActivityAction;
  target: string;
  actor: string;
  actorRole: "ADMIN" | "TEACHER";
  at: string;
};

export type ActivityPage = {
  entries: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminOverview = {
  teachers: { total: number; active: number };
  learners: { total: number; active: number };
  deactivatedAccounts: number;
  lessons: { total: number; active: number };
  passRates: Array<{
    categoryId: string;
    lesson: string;
    attempts: number;
    passRate: number;
  }>;
  recentActivity: ActivityEntry[];
};

export type AdminTeacher = {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  contactNumber: string | null;
  isActive: boolean;
  dateJoined: string | null;
};

export type TeacherInput = {
  fullName: string;
  username: string;
  email: string;
  contactNumber: string;
};

export type AdminLearner = {
  id: string;
  fullName: string;
  username: string;
  avatarKey: string | null;
  isActive: boolean;
  dateJoined: string;
};

export type AdminLesson = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  signCount: number;
};

export type AdminArea = {
  id: string;
  name: string;
  lessons: AdminLesson[];
};

/** Lesson content belongs to teachers; admin only controls these settings. */
export type LessonInput = {
  displayOrder: number;
  isActive: boolean;
};

export function getAdminOverview(signal?: AbortSignal) {
  return unwrap<AdminOverview>(api.get("/api/admin/overview", { signal }));
}

export function getAdminTeachers(signal?: AbortSignal) {
  return unwrap<AdminTeacher[]>(api.get("/api/admin/teachers", { signal }));
}

export function createTeacher(data: TeacherInput) {
  return unwrap<{ teacher: AdminTeacher; temporaryPassword: string }>(
    api.post("/api/admin/teachers", data),
  );
}

export function updateTeacher(id: string, data: TeacherInput) {
  return unwrap<AdminTeacher>(api.patch(`/api/admin/teachers/${id}`, data));
}

export function resetTeacherPassword(id: string) {
  return unwrap<{ temporaryPassword: string }>(
    api.post(`/api/admin/teachers/${id}/reset-password`),
  );
}

export function setTeacherStatus(id: string, isActive: boolean) {
  return unwrap<{ id: string; isActive: boolean }>(
    api.patch(`/api/admin/teachers/${id}/status`, { isActive }),
  );
}

export function getAdminLearners(signal?: AbortSignal) {
  return unwrap<AdminLearner[]>(api.get("/api/admin/learners", { signal }));
}

export function setAdminLearnerStatus(id: string, isActive: boolean) {
  return unwrap<{ id: string; isActive: boolean }>(
    api.patch(`/api/admin/learners/${id}/status`, { isActive }),
  );
}

export function getAdminLessons(signal?: AbortSignal) {
  return unwrap<AdminArea[]>(api.get("/api/admin/lessons", { signal }));
}

export function updateLesson(id: string, data: LessonInput) {
  return unwrap<{ id: string }>(api.patch(`/api/admin/lessons/${id}`, data));
}

export function getAdminActivity(
  query: { action?: ActivityAction; page: number },
  signal?: AbortSignal,
) {
  return unwrap<ActivityPage>(
    api.get("/api/admin/activity", { params: query, signal }),
  );
}
