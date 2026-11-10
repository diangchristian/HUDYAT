/*
 * What a learner reads for a sign, including the placeholder when a teacher
 * hasn't written anything yet. The lesson and the teacher's editor preview
 * both use these, so the preview can't drift from what learners see.
 */
export const signMeaningText = (label: string, meaning?: string | null) =>
  meaning?.trim() ||
  `Learn what the Filipino Sign Language sign "${label}" means.`;

export const signWhenToUseText = (label: string, whenToUse?: string | null) =>
  whenToUse?.trim() ||
  `Use "${label}" in a situation where this expression is appropriate.`;

/** A picture's key: the word (or whole sign name) in lower case without punctuation, as the server expects. */
export const pictureKey = (text: string) => {
  const key = text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, "").trim().replace(/\s+/g, " ");
  // The server allows 60 characters; cut by code point so a character is never split in half.
  return [...key].slice(0, 60).join("");
};

export type Pictures = Record<string, string>;

export type ReadingPart = { kind: "word" | "space" | "sign"; text: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * Splits lesson text into tappable words for the reading cards, keeping the
 * sign's name together (even when it's several words) so it can be highlighted. Only whole words
 * match: the sign "A" must not split "Apple".
 */
export const readingParts = (text: string, label: string): ReadingPart[] => {
  const isLabel = (chunk: string) => chunk.toLowerCase() === label.toLowerCase();
  return text
    .split(new RegExp(`(?<![\\p{L}\\p{N}])(${escapeRegExp(label)})(?![\\p{L}\\p{N}])`, "iu"))
    .flatMap((chunk) => (isLabel(chunk) ? [chunk] : chunk.split(/(\s+)/)))
    .filter(Boolean)
    .map((chunk) => ({
      kind: isLabel(chunk) ? "sign" : chunk.trim() ? "word" : "space",
      text: chunk,
    }));
};

/** Drops pictures whose word was edited out of the text: they would never show. */
export const usedPictures = (text: string, label: string, pictures: Pictures): Pictures => {
  const keys = new Set(readingParts(text, label).map((part) => pictureKey(part.text)));
  return Object.fromEntries(Object.entries(pictures).filter(([key]) => keys.has(key)));
};

/** A picture is an uploaded image link or an emoji. */
export const isImagePicture = (picture: string) => picture.startsWith("https://");

// Same rule as the server (teacher-lesson.service.ts): emoji only, with at least one real pictograph.
const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|[0-9#*]\ufe0f?\u20e3|\u200d|\ufe0f|[\u{e0020}-\u{e007f}])+$/u;
const PICTOGRAPH = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u;
export const isEmoji = (text: string) => [...text].length <= 32 && EMOJI.test(text) && PICTOGRAPH.test(text);
