import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateTeacherLesson,
  type LessonContentInput,
} from "@/api/teacher-api";

export function useUpdateTeacherLesson(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LessonContentInput) =>
      updateTeacherLesson(categoryId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher"] }),
  });
}
