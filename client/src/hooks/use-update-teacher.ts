import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTeacher, type TeacherInput } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeacherInput }) =>
      updateTeacher(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
