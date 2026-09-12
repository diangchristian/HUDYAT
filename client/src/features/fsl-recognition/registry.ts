/** Only releases validated against fslexicon's saved Keras outputs are enabled. */
export const ALPHABET_RELEASE = {
  category: "alphabet",
  sourceHash: "f6b504aa92ecad8e07d77faa8dd0a52a772478308d7321ca13d7c94c1fd24061",
  folder: "models/alphabet",
  inputShape: [21, 3],
  classes: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
} as const;

export function modelForCategory(category?: string) {
  return category === "alphabet" ? ALPHABET_RELEASE : undefined;
}
export function publicAsset(path: string) {
  return (import.meta.env?.BASE_URL ?? "/") + path.replace(/^\//, "");
}
