import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAssessment, type AssessmentInput } from "@/api/teacher-api";
import { applyAuthoringResult } from "@/lib/teacher-query-cache";

export function useSaveAssessment(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssessmentInput) => saveAssessment(categoryId, data),
    onSuccess: (assessment) => applyAuthoringResult(queryClient, assessment),
  });
}
