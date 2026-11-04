import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setTeacherStatus } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useSetTeacherStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setTeacherStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
