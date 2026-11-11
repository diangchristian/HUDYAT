import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitSignTest } from "@/api/assessment-api";
import { assessmentListKey } from "./use-assessment-list";

export function useSubmitSignTest(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (missedGestureIds: string[]) => submitSignTest(categoryId, missedGestureIds),
    // The quiz list shows the best Sign test score.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: assessmentListKey }),
  });
}
