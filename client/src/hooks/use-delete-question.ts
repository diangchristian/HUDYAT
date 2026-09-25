import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteQuestion } from "@/api/teacher-api";
import { applyAuthoringResult } from "@/lib/teacher-query-cache";

export function useDeleteQuestion(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(categoryId, questionId),
    onSuccess: (assessment) => applyAuthoringResult(queryClient, assessment),
  });
}
