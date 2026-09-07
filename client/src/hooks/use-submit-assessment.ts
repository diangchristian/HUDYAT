import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAssessment, type AssessmentAnswer } from "@/api/assessment-api";
import { assessmentKey } from "./use-assessment";
import { assessmentListKey } from "./use-assessment-list";
import { learningAreasKey } from "./use-learning-areas";
import { myProgressKey } from "./use-my-progress";

export function useSubmitAssessment(categoryId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: AssessmentAnswer[]) =>
      submitAssessment(categoryId!, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myProgressKey });
      void queryClient.invalidateQueries({ queryKey: learningAreasKey });
      void queryClient.invalidateQueries({ queryKey: assessmentListKey });
      void queryClient.invalidateQueries({
        queryKey: assessmentKey(categoryId),
      });
    },
  });
}
