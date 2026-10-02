import { Loader2 } from "lucide-react";

import { useStaffTheme } from "@/hooks/use-staff-theme";

/*
 * Full-screen loader for the staff portal (shown while auth is being
 * checked). The playful Hudyat LoadingScreen is student-only.
 */
export default function StaffLoadingScreen() {
  useStaffTheme();

  return (
    <div
      role="status"
      className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-background font-staff"
    >
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">Loading...</p>
    </div>
  );
}
