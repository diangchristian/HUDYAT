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
