import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { logout } from "@/api/auth-api";

/*
 * Ends the session and goes to `loginPath` (each role has its own
 * login). The whole query cache is cleared so the next person on this
 * device never sees the previous user's data.
 */
export function useLogout(loginPath: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem("token");
    queryClient.clear();
    navigate(loginPath);

    logout().catch(() => {
      // The local session is already cleared; the server-side
      // cookie clear is best-effort.
    });
  };
}
