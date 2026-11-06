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

export type ReadingPart = { kind: "word" | "space" | "sign"; text: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * Splits lesson text into tappable words for the reading cards, keeping the
 * sign's name together (even when it's several words) so it can be highlighted.
 */
export const readingParts = (text: string, label: string): ReadingPart[] => {
  const isLabel = (chunk: string) => chunk.toLowerCase() === label.toLowerCase();
  return text
    .split(new RegExp(`(${escapeRegExp(label)})`, "i"))
    .flatMap((chunk) => (isLabel(chunk) ? [chunk] : chunk.split(/(\s+)/)))
    .filter(Boolean)
    .map((chunk) => ({
      kind: isLabel(chunk) ? "sign" : chunk.trim() ? "word" : "space",
      text: chunk,
    }));
};
