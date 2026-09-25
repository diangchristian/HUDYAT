import { useQuery } from "@tanstack/react-query";
import { getTeacherAssessment } from "@/api/teacher-api";

export const teacherAssessmentKey = (categoryId: string | undefined) =>
  ["teacher", "assessment", categoryId] as const;

export function useTeacherAssessment(categoryId: string | undefined) {
  return useQuery({
    queryKey: teacherAssessmentKey(categoryId),
    queryFn: ({ signal }) => getTeacherAssessment(categoryId!, signal),
    enabled: Boolean(categoryId),
  });
}
