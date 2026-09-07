import { useQuery } from "@tanstack/react-query";
import { getAssessmentList } from "@/api/assessment-api";

export const assessmentListKey = ["assessment-list"] as const;

export function useAssessmentList() {
  return useQuery({
    queryKey: assessmentListKey,
    queryFn: getAssessmentList,
  });
}
