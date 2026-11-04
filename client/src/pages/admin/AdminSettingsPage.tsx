import { useState } from "react";
import { KeyRound } from "lucide-react";

import ChangePasswordDialog from "@/components/staff/change-password-dialog";
import { StaffCard } from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function AdminSettingsPage() {
  const { data: user } = useCurrentUser();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  return (
    <div className="space-y-6">
      <StaffPageHeader title="Settings" description="Your admin account." />

      <StaffCard className="max-w-md space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Username</p>
          <p className="font-bold [overflow-wrap:anywhere]">{user?.username}</p>
        </div>
        {user?.email && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Email</p>
            <p className="font-bold [overflow-wrap:anywhere]">{user.email}</p>
          </div>
        )}

        <Button
          variant="secondary"
          className="h-11 w-full rounded-full font-bold text-primary"
          onClick={() => {
            setPasswordChanged(false);
            setPasswordOpen(true);
          }}
        >
          <KeyRound aria-hidden="true" />
          Change password
        </Button>
        {passwordChanged && (
          <p role="status" className="text-center text-sm font-bold text-emerald-700">
            Password updated!
          </p>
        )}
      </StaffCard>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={() => {
          setPasswordOpen(false);
          setPasswordChanged(true);
        }}
      />
    </div>
  );
}
