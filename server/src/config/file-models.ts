/*
 * Categories whose recognition model is loaded from model-assets/catalog.json
 * (the HUDYAT Trainer releases, as in the DABEST build) instead of the release
 * stored in the database. The database is never changed; remove a category
 * here to go back to its database release.
 */
export const FILE_MODEL_CATEGORIES = ["alphabet", "colors", "greetings", "numbers", "family", "shapes", "calendar", "word_concepts", "wh_questions"];

/** Lesson names and URL slugs resolve to the trainer's immutable category IDs. */
export const fileModelId = (name: string) => name.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** Whether the camera can check this lesson's signs (same slug as the client's categorySlug in lib/practice.ts). */
export const hasCameraModel = (lessonName: string) =>
  // Partial models cannot support an all-signs test (Shapes: 8/10; WH Questions: 6/10).
  !["shapes", "wh_questions"].includes(fileModelId(lessonName)) && FILE_MODEL_CATEGORIES.includes(fileModelId(lessonName));
