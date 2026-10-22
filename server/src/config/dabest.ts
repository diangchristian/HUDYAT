import type { Prisma } from "../generated/prisma/client.js";

/*
 * DABEST build: the conference version of HUDYAT shows only these
 * categories. Everything else stays in the database, untouched; it is
 * only left out of what the app lists.
 */
export const DABEST_CATEGORIES = ["Alphabet", "Numbers", "Colors", "Greetings"];

/*
 * Signs DABEST shows inside a category, when it shows only some of them.
 * Colors: the six the Colors model recognizes (Purple is its "violet").
 */
export const DABEST_GESTURES: Record<string, string[]> = {
  Colors: ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"],
};

/* A category DABEST shows (replaces `isActive: true` on category queries). */
export const shownCategory = {
  isActive: true,
  name: { in: DABEST_CATEGORIES },
} satisfies Prisma.CategoryWhereInput;

/* A category's sign DABEST shows. */
export const shownCategoryGesture = {
  AND: Object.entries(DABEST_GESTURES).map(([category, labels]) => ({
    NOT: {
      category: { name: category },
      gesture: { label: { notIn: labels } },
    },
  })),
} satisfies Prisma.CategoryGestureWhereInput;

/* An assessment question DABEST shows: it asks about a shown sign. */
export const shownQuestion = {
  AND: Object.entries(DABEST_GESTURES).map(([category, labels]) => ({
    NOT: {
      assessment: { category: { name: category } },
      gesture: { label: { notIn: labels } },
    },
  })),
} satisfies Prisma.AssessmentQuestionWhereInput;

/*
 * Categories whose recognition model DABEST loads from its own
 * model-assets/catalog.json (the HUDYAT Trainer releases), leaving the
 * release stored in the shared database as it is.
 */
export const DABEST_FILE_MODELS = ["colors", "greetings", "numbers"];
