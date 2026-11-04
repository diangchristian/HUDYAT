import { useQueryClient } from "@tanstack/react-query";

import ChangePasswordDialog from "@/components/staff/change-password-dialog";
import { currentUserKey } from "@/hooks/use-current-user";
import { useLogout } from "@/hooks/use-logout";
import { useStaffTheme } from "@/hooks/use-staff-theme";

/*
 * Shown instead of the portal while someone is on a temporary password.
 * The server blocks everything else until it's changed anyway. The only
 * way out besides changing it is logging out.
 */
export default function ForcedPasswordChange({
  loginPath,
}: {
  loginPath: string;
}) {
  useStaffTheme();
  const queryClient = useQueryClient();
  const logout = useLogout(loginPath);

  return (
    <main className="min-h-screen bg-muted/40 font-staff">
      <ChangePasswordDialog
        open
        onOpenChange={(open) => {
          if (!open) logout();
        }}
        onChanged={() =>
          void queryClient.invalidateQueries({ queryKey: currentUserKey })
        }
        description="You're using a temporary password. Choose your own, with at least 8 characters, to continue. Your current password is the temporary one you were given."
        cancelLabel="Log out"
      />
    </main>
  );
}
