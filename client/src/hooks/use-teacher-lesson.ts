import { useQuery } from "@tanstack/react-query";
import { getTeacherLesson } from "@/api/teacher-api";

export const teacherLessonKey = (categoryId: string | undefined) =>
  ["teacher", "lessons", categoryId] as const;

export function useTeacherLesson(categoryId: string | undefined) {
  return useQuery({
    queryKey: teacherLessonKey(categoryId),
    queryFn: ({ signal }) => getTeacherLesson(categoryId!, signal),
    enabled: Boolean(categoryId),
  });
}
