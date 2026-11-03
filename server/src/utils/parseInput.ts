import type { z } from "zod";

import { httpError } from "./httpError.js";

/** Validates a request body, responding 400 with the first problem found. */
export const parseInput = <Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> => {
  const result = schema.safeParse(input ?? {});

  if (!result.success) {
    throw httpError(400, result.error.issues[0]?.message ?? "Invalid input.");
  }

  return result.data;
};
