import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import bcrypt from "bcryptjs";

import { app } from "../src/app.js";
import { disconnectDB, prisma } from "../src/config/db.js";

export const PASSWORD = "Test1234!";

/*
 * The tests run against the shared dev database. Everything they create
 * is named with a per-file prefix, and cleanup only ever deletes that.
 */
export function testContext(file: string) {
  const prefix = `zztest_${file}_`;
  let server: Server;
  let base = "";
  let counter = 0;

  const cleanup = async () => {
    await prisma.learningArea.deleteMany({
      where: { name: { startsWith: prefix } },
    });
    await prisma.fslGesture.deleteMany({
      where: { label: { startsWith: prefix } },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: prefix } },
    });
  };

  return {
    prefix,
    unique: (name: string) => `${prefix}${name}${++counter}`,

    start: async () => {
      await cleanup();
      server = app.listen(0);
      await new Promise((resolve) => server.once("listening", resolve));
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    },

    stop: async () => {
      await cleanup();
      await new Promise((resolve) => server.close(resolve));
      await disconnectDB();
    },

    request: async (
      method: string,
      path: string,
      options: { token?: string; body?: unknown } = {},
    ) => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(options.token && { Authorization: `Bearer ${options.token}` }),
        },
        ...(options.body !== undefined && {
          body: JSON.stringify(options.body),
        }),
      });
      const text = await response.text();
      const json = text.startsWith("{") ? JSON.parse(text) : {};
      return { status: response.status, body: json, data: json.data };
    },

    /** Arranges an account directly; behaviour is then checked over HTTP. */
    createUser: async (
      role: "ADMIN" | "TEACHER" | "LEARNER",
      overrides: { isActive?: boolean; mustChangePassword?: boolean } = {},
    ) => {
      const username = `${prefix}${role.toLowerCase()}${++counter}`;
      const email = `${username}@example.com`;
      const password = await bcrypt.hash(PASSWORD, 4);
      const fullName = `Test ${role} ${counter}`;

      return prisma.user.create({
        data: {
          username,
          email,
          password,
          role,
          ...overrides,
          ...(role === "TEACHER" && {
            teacherProfile: { create: { fullName, email } },
          }),
          ...(role === "LEARNER" && {
            learnerProfile: { create: { fullName } },
          }),
        },
      });
    },
  };
}

export const LOGIN_PATH = {
  ADMIN: "/api/auth/admin/login",
  TEACHER: "/api/auth/teacher/login",
  LEARNER: "/api/auth/login",
} as const;
