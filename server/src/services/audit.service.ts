import { prisma } from "../config/db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { httpError } from "../utils/httpError.js";

export const AUDIT_ACTIONS = [
  "ACCOUNT_CREATED",
  "ACCOUNT_UPDATED",
  "ACCOUNT_DEACTIVATED",
  "ACCOUNT_REACTIVATED",
  "PASSWORD_RESET",
  "LESSON_EDITED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const ACTIVITY_PAGE_SIZE = 10;

/*
 * Runs inside the caller's transaction, so a change and its log entry
 * succeed or fail together. `target` is a display name: never pass
 * passwords or other secrets.
 */
export const recordAudit = (
  tx: Prisma.TransactionClient,
  actorId: string,
  action: AuditAction,
  entityType: "USER" | "CATEGORY",
  entityId: string,
  target: string,
) =>
  tx.auditLog.create({
    data: { userId: actorId, action, entityType, entityId, description: target },
  });

const toActivityEntry = (entry: {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
  user: { username: string; role: string; teacherProfile: { fullName: string } | null };
}) => ({
  id: entry.id,
  action: entry.action,
  target: entry.description ?? "",
  actor: entry.user.teacherProfile?.fullName ?? entry.user.username,
  actorRole: entry.user.role,
  at: entry.createdAt,
});

const activityInclude = {
  user: {
    select: {
      username: true,
      role: true,
      teacherProfile: { select: { fullName: true } },
    },
  },
} as const;

export const recentActivity = async (take: number) => {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: activityInclude,
  });

  return entries.map(toActivityEntry);
};

export const listActivity = async (query: { action?: unknown; page?: unknown }) => {
  const action = query.action === undefined ? undefined : String(query.action);

  if (action !== undefined && !(AUDIT_ACTIONS as readonly string[]).includes(action)) {
    throw httpError(400, "Unknown activity type.");
  }

  const requestedPage = Number(query.page ?? 1);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = action ? { action } : {};

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ACTIVITY_PAGE_SIZE,
      take: ACTIVITY_PAGE_SIZE,
      include: activityInclude,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries: entries.map(toActivityEntry),
    total,
    page,
    pageSize: ACTIVITY_PAGE_SIZE,
  };
};
