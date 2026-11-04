import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLearner } from "@/api/teacher-api";

export function useCreateLearner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLearner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher"] }),
  });
}
