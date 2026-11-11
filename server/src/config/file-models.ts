/*
 * Categories whose recognition model is loaded from model-assets/catalog.json
 * (the HUDYAT Trainer releases, as in the DABEST build) instead of the release
 * stored in the database. The database is never changed; remove a category
 * here to go back to its database release.
 */
export const FILE_MODEL_CATEGORIES = ["alphabet", "colors", "greetings", "numbers", "family"];

/** Whether the camera can check this lesson's signs (same slug as the client's categorySlug in lib/practice.ts). */
export const hasCameraModel = (lessonName: string) =>
  FILE_MODEL_CATEGORIES.includes(lessonName.trim().toLowerCase().replace(/\s+/g, "-"));
