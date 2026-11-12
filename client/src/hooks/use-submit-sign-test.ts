import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitSignTest } from "@/api/assessment-api";
import { assessmentListKey } from "./use-assessment-list";
import { learningAreasKey } from "./use-learning-areas";
import { myProgressKey } from "./use-my-progress";

export function useSubmitSignTest(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (missedGestureIds: string[]) => submitSignTest(categoryId, missedGestureIds),
    // The quiz list shows the best Sign test score; a pass can complete the lesson and unlock the next.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assessmentListKey });
      void queryClient.invalidateQueries({ queryKey: learningAreasKey });
      void queryClient.invalidateQueries({ queryKey: myProgressKey });
      // Every cached lesson: the next one may have just unlocked.
      void queryClient.invalidateQueries({ queryKey: ["category-lesson"] });
    },
  });
}
