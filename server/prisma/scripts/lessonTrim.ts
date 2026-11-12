/*
 * Pure plans for taking signs out of a lesson whose camera model can't check them
 * (trimLessonSigns.ts applies them). Signs themselves are never deleted, only unlinked.
 */
export type LessonLink = { id: string; gestureId: string; label: string };

/** `links` in lesson order. A rerun with nothing left to remove changes nothing. */
export function planSignRemoval<T extends LessonLink>(links: T[], removedLabels: string[]) {
  const isRemoved = (link: T) => removedLabels.includes(link.label);
  const kept = links.filter((link) => !isRemoved(link));
  if (kept.length === 0) throw Error("A lesson can't lose all its signs.");

  /** Where a learner's saved position goes: the same sign, else the next kept one, else the last. */
  const remapCheckpoint = (index: number) => {
    const same = kept.indexOf(links[index]!);
    if (same >= 0) return { index: same, resetStep: false };
    const next = kept.findIndex((link) => links.indexOf(link) > index);
    return { index: next >= 0 ? next : kept.length - 1, resetStep: true };
  };

  return { kept, removed: links.filter(isRemoved), remapCheckpoint };
}

type QuizQuestion = {
  id: string;
  questionNumber: number;
  gestureId: string;
  choices: { id: string; gestureId: string }[];
};

/**
 * A quiz may only use the lesson's signs: questions about a removed sign go, and a removed sign
 * offered as a wrong answer is swapped for a kept sign the question doesn't already offer.
 * Questions are then numbered 1..n again, in their old order.
 */
export function planQuizCleanup(questions: QuizQuestion[], lessonSigns: { gestureId: string; label: string }[]) {
  const inLesson = (gestureId: string) => lessonSigns.some((sign) => sign.gestureId === gestureId);
  const ordered = [...questions].sort((a, b) => a.questionNumber - b.questionNumber);
  const kept = ordered.filter((question) => inLesson(question.gestureId));

  const choiceSwaps = kept.flatMap((question) => {
    const used = new Set(question.choices.map((choice) => choice.gestureId));
    return question.choices
      .filter((choice) => !inLesson(choice.gestureId))
      .map((choice) => {
        const replacement = lessonSigns.find((sign) => !used.has(sign.gestureId));
        if (!replacement) throw Error(`No kept sign left to replace a choice in question ${question.questionNumber}.`);
        used.add(replacement.gestureId);
        return { choiceId: choice.id, gestureId: replacement.gestureId, choiceText: replacement.label };
      });
  });

  return {
    deleteQuestionIds: ordered.filter((question) => !inLesson(question.gestureId)).map((question) => question.id),
    choiceSwaps,
    renumber: kept.map((question, i) => ({ id: question.id, questionNumber: i + 1 })),
  };
}
