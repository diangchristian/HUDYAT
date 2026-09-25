import { useQuery } from "@tanstack/react-query";
import { getTeacherAssessments } from "@/api/teacher-api";

export const teacherAssessmentsKey = ["teacher", "assessments"] as const;

export function useTeacherAssessments() {
  return useQuery({
    queryKey: teacherAssessmentsKey,
    queryFn: ({ signal }) => getTeacherAssessments(signal),
  });
}
