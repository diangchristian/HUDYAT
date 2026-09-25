import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuestion, type QuestionInput } from "@/api/teacher-api";
import { applyAuthoringResult } from "@/lib/teacher-query-cache";

export function useUpdateQuestion(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: QuestionInput;
    }) => updateQuestion(categoryId, questionId, data),
    onSuccess: (assessment) => applyAuthoringResult(queryClient, assessment),
  });
}
