import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth-api";

export const currentUserKey = ["current-user"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: getCurrentUser,
    enabled: Boolean(localStorage.getItem("token")),
    retry: false,
  });
}
