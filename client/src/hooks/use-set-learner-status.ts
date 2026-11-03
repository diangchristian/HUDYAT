import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setLearnerStatus } from "@/api/teacher-api";

export function useSetLearnerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setLearnerStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher"] }),
  });
}
