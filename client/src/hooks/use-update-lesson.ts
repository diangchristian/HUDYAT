import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLesson, type LessonInput } from "@/api/admin-api";
import { adminKey } from "./use-admin-overview";

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LessonInput }) =>
      updateLesson(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
