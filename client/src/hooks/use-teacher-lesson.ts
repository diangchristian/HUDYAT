import { useQuery } from "@tanstack/react-query";
import { getTeacherLesson } from "@/api/teacher-api";

export function useTeacherLesson(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["teacher", "lessons", categoryId],
    queryFn: ({ signal }) => getTeacherLesson(categoryId!, signal),
    enabled: Boolean(categoryId),
    // The form saves every sign, so starting it from an old copy would undo newer edits.
    gcTime: 0,
  });
}
