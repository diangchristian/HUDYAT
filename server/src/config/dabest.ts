import type { Prisma } from "../generated/prisma/client.js";

/*
 * DABEST build: the conference version of HUDYAT shows only these
 * categories, in this order. Its own database is seeded with only them
 * (prisma/seeder); on a full HUDYAT database the others stay untouched and
 * are only left out of what the app lists.
 */
export const DABEST_CATEGORIES = ["Alphabet", "Numbers", "Greetings", "Colors"];

/* The DABEST database's one learning area (its seeders create only this). */
export const DABEST_LEARNING_AREA = {
  name: "Basic Filipino Sign Language",
  description:
    "Learn the fundamental Filipino Sign Language signs: the alphabet, numbers, greetings and colors.",
};

/*
 * Signs DABEST shows inside a category, when it shows only some of them.
 * Colors: the six the Colors model recognizes.
 */
export const DABEST_GESTURES: Record<string, string[]> = {
  Colors: ["Red", "Orange", "Yellow", "Green", "Blue", "Violet"],
};

export const isDabestCategory = (name: string) =>
  DABEST_CATEGORIES.some((category) => category.toLowerCase() === name.toLowerCase());

/* Whether DABEST shows this sign of a category (every sign, unless DABEST_GESTURES lists some). */
export const isShownSign = (category: string, label: string) => {
  const only = DABEST_GESTURES[category];
  return !only || only.some((shown) => shown.toLowerCase() === label.toLowerCase());
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
