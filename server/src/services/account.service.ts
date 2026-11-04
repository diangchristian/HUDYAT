import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../config/db.js";
import type { UserRole } from "../generated/prisma/enums.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { recordAudit } from "./audit.service.js";

const BCRYPT_ROUNDS = 10;

const fullName = z
  .string({ error: "Enter a full name." })
  .trim()
  .min(1, "Enter a full name.")
  .max(60, "Full name must be 60 characters or fewer.");

const username = z
  .string({ error: "Enter a username." })
  .trim()
  .regex(
    /^[A-Za-z0-9._-]{3,40}$/,
    "Username must be 3 to 40 letters, numbers, dots, dashes or underscores.",
  );

const password = z
  .string({ error: "Enter a password." })
  .min(8, "Password must be at least 8 characters.")
  // bcrypt ignores everything past 72 bytes.
  .max(72, "Password must be 72 characters or fewer.");

const learnerInput = z.object({ fullName, username, password });

const teacherInput = z.object({
  fullName,
  username,
  email: z.email("Enter a valid email address.").trim(),
  contactNumber: z
    .string()
    .trim()
    .max(20, "Contact number must be 20 characters or fewer.")
    .nullish(),
});

const statusInput = z.object({
  isActive: z.boolean({ error: "Status must be true or false." }),
});

const hash = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);

const newTemporaryPassword = () => randomBytes(9).toString("base64url");

/** Turns a unique-constraint failure into a message a person can act on. */
const rethrowConflict = (error: unknown): never => {
  if ((error as { code?: string })?.code === "P2002") {
    throw httpError(409, "That username or email is already taken.");
  }
  throw error;
};

const findAccount = async (role: UserRole, id: string) => {
  const user = await prisma.user.findFirst({ where: { id, role } });
  if (!user) throw httpError(404, "Account not found.");
  return user;
};

/* ---------- Learners ---------- */

export const createLearner = async (actorId: string, input: unknown) => {
  const values = parseInput(learnerInput, input);
  const hashedPassword = await hash(values.password);

  return prisma
    .$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: values.username,
          password: hashedPassword,
          role: "LEARNER",
          learnerProfile: { create: { fullName: values.fullName } },
        },
      });

      await recordAudit(tx, actorId, "ACCOUNT_CREATED", "USER", user.id, user.username);

      return { id: user.id, username: user.username, fullName: values.fullName };
    })
    .catch(rethrowConflict);
};

export const resetLearnerPassword = async (
  actorId: string,
  learnerId: string,
  input: unknown,
) => {
  const values = parseInput(z.object({ password }), input);
  const learner = await findAccount("LEARNER", learnerId);
  const hashedPassword = await hash(values.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: learner.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });
    await recordAudit(tx, actorId, "PASSWORD_RESET", "USER", learner.id, learner.username);
  });

  return { id: learner.id };
};

export const listLearnerAccounts = async () => {
  const learners = await prisma.learnerProfile.findMany({
    orderBy: { fullName: "asc" },
    select: {
      userId: true,
      fullName: true,
      dateJoined: true,
      avatarKey: true,
      user: { select: { username: true, isActive: true } },
    },
  });

  return learners.map((learner) => ({
    id: learner.userId,
    fullName: learner.fullName,
    username: learner.user.username,
    avatarKey: learner.avatarKey,
    isActive: learner.user.isActive,
    dateJoined: learner.dateJoined,
  }));
};

/* ---------- Teachers ---------- */

type TeacherRow = {
  id: string;
  username: string;
  isActive: boolean;
  teacherProfile: {
    fullName: string;
    email: string;
    contactNumber: string | null;
    dateJoined: Date;
  } | null;
};

const toTeacherAccount = (user: TeacherRow) => ({
  id: user.id,
  username: user.username,
  isActive: user.isActive,
  fullName: user.teacherProfile?.fullName ?? user.username,
  email: user.teacherProfile?.email ?? null,
  contactNumber: user.teacherProfile?.contactNumber ?? null,
  dateJoined: user.teacherProfile?.dateJoined ?? null,
});

export const listTeachers = async () => {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { teacherProfile: { fullName: "asc" } },
    include: { teacherProfile: true },
  });

  return teachers.map(toTeacherAccount);
};

export const createTeacher = async (actorId: string, input: unknown) => {
  const values = parseInput(teacherInput, input);
  const temporaryPassword = newTemporaryPassword();
  const hashedPassword = await hash(temporaryPassword);

  const teacher = await prisma
    .$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: values.username,
          email: values.email,
          password: hashedPassword,
          role: "TEACHER",
          mustChangePassword: true,
          teacherProfile: {
            create: {
              fullName: values.fullName,
              email: values.email,
              contactNumber: values.contactNumber || null,
            },
          },
        },
        include: { teacherProfile: true },
      });

      await recordAudit(tx, actorId, "ACCOUNT_CREATED", "USER", user.id, user.username);

      return user;
    })
    .catch(rethrowConflict);

  return { teacher: toTeacherAccount(teacher), temporaryPassword };
};

export const updateTeacher = async (
  actorId: string,
  teacherId: string,
  input: unknown,
) => {
  const values = parseInput(teacherInput, input);
  await findAccount("TEACHER", teacherId);

  const teacher = await prisma
    .$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: teacherId },
        data: {
          username: values.username,
          email: values.email,
          teacherProfile: {
            update: {
              fullName: values.fullName,
              email: values.email,
              contactNumber: values.contactNumber || null,
            },
          },
        },
        include: { teacherProfile: true },
      });

      await recordAudit(tx, actorId, "ACCOUNT_UPDATED", "USER", user.id, user.username);

      return user;
    })
    .catch(rethrowConflict);

  return toTeacherAccount(teacher);
};

export const resetTeacherPassword = async (actorId: string, teacherId: string) => {
  const teacher = await findAccount("TEACHER", teacherId);
  const temporaryPassword = newTemporaryPassword();
  const hashedPassword = await hash(temporaryPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacher.id },
      data: { password: hashedPassword, mustChangePassword: true },
    });
    await recordAudit(tx, actorId, "PASSWORD_RESET", "USER", teacher.id, teacher.username);
  });

  return { temporaryPassword };
};

/* ---------- Either role ---------- */

export const setAccountStatus = async (
  actorId: string,
  role: UserRole,
  id: string,
  input: unknown,
) => {
  const { isActive } = parseInput(statusInput, input);
  const account = await findAccount(role, id);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: account.id }, data: { isActive } });
    await recordAudit(
      tx,
      actorId,
      isActive ? "ACCOUNT_REACTIVATED" : "ACCOUNT_DEACTIVATED",
      "USER",
      account.id,
      account.username,
    );
  });

  return { id: account.id, isActive };
};
