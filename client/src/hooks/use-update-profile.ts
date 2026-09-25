import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, type ProfileUpdate } from "@/api/auth-api";
import { currentUserKey } from "./use-current-user";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdate) =>
      updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserKey, user);
    },
  });
}
