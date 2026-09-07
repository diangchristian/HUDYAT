import { useMutation } from "@tanstack/react-query";
import { checkAnswer } from "@/api/assessment-api";

export function useCheckAnswer(categoryId: string | undefined) {
  return useMutation({
    mutationFn: ({
      questionId,
      selectedChoiceId,
    }: {
      questionId: string;
      selectedChoiceId: string;
    }) => checkAnswer(categoryId!, questionId, selectedChoiceId),
  });
}
