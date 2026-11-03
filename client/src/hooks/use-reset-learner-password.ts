import { useMutation } from "@tanstack/react-query";
import { resetLearnerPassword } from "@/api/teacher-api";

export function useResetLearnerPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetLearnerPassword(id, password),
  });
}
