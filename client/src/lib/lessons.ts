import type { AssessmentListArea } from "@/api/teacher-api";

/** A lesson (category) with the name of its learning area attached. */
export type Lesson = AssessmentListArea["categories"][number] & {
  areaName: string;
};

/** A lesson that has a quiz (assessment). */
export type Quiz = Lesson & { assessment: NonNullable<Lesson["assessment"]> };

export function flattenLessons(areas: AssessmentListArea[]): Lesson[] {
  return areas.flatMap((area) =>
    area.categories.map((category) => ({ ...category, areaName: area.name })),
  );
}

export function quizzesOf(lessons: Lesson[]): Quiz[] {
  return lessons.filter((lesson): lesson is Quiz => Boolean(lesson.assessment));
}

export function lessonsWithoutQuiz(lessons: Lesson[]): Lesson[] {
  return lessons.filter((lesson) => !lesson.assessment);
}
