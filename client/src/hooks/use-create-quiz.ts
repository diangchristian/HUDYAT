import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAssessment, type AssessmentInput } from "@/api/teacher-api";
import { applyAuthoringResult } from "@/lib/teacher-query-cache";

/** Creates a lesson's quiz, where the lesson is picked at submit time. */
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: AssessmentInput;
    }) => saveAssessment(categoryId, data),
    onSuccess: (assessment) => applyAuthoringResult(queryClient, assessment),
  });
}
