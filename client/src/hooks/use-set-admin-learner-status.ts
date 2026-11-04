import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setAdminLearnerStatus } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useSetAdminLearnerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAdminLearnerStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
