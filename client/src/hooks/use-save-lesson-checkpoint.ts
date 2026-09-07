import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saveLessonCheckpoint,
  type CategoryLesson,
  type LessonStep,
} from "@/api/learning-api";
import { categoryLessonKey } from "./use-category-lesson";
import { learningAreasKey } from "./use-learning-areas";

export function useSaveLessonCheckpoint(categoryId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gestureIndex,
      lessonStep,
    }: {
      gestureIndex: number;
      lessonStep: LessonStep;
    }) => saveLessonCheckpoint(categoryId!, gestureIndex, lessonStep),
    onSuccess: (progress) => {
      queryClient.setQueryData(
        categoryLessonKey(categoryId),
        (old: CategoryLesson | undefined) =>
          old ? { ...old, progress } : old,
      );

      void queryClient.invalidateQueries({ queryKey: learningAreasKey });
    },
  });
}
