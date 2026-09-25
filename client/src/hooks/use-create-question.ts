import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuestion, type QuestionInput } from "@/api/teacher-api";
import { applyAuthoringResult } from "@/lib/teacher-query-cache";

export function useCreateQuestion(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuestionInput) => createQuestion(categoryId, data),
    onSuccess: (assessment) => applyAuthoringResult(queryClient, assessment),
  });
}
