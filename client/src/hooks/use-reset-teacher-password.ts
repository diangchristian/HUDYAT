import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetTeacherPassword } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useResetTeacherPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetTeacherPassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
