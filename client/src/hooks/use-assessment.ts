import { useQuery } from "@tanstack/react-query";
import { getAssessment } from "@/api/assessment-api";

export const assessmentKey = (categoryId: string | undefined) =>
  ["assessment", categoryId] as const;

export function useAssessment(categoryId: string | undefined) {
  return useQuery({
    queryKey: assessmentKey(categoryId),
    queryFn: () => getAssessment(categoryId!),
    enabled: Boolean(categoryId),
  });
}
