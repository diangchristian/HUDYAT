import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeacher } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
