import { useState } from "react";
import { KeyRound } from "lucide-react";

import ChangePasswordDialog from "@/components/staff/change-password-dialog";
import InitialsAvatar from "@/components/staff/initials-avatar";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthUser } from "@/api/auth-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUpdateProfile } from "@/hooks/use-update-profile";

type Feedback = { type: "success" | "error"; message: string } | null;

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;

  return (
    <p
      role="alert"
      className={
        feedback.type === "success"
          ? "text-sm font-bold text-emerald-700"
          : "text-sm font-bold text-red-600"
      }
    >
      {feedback.message}
    </p>
  );
}

function ProfileForm({ user }: { user: AuthUser }) {
  const updateProfileMutation = useUpdateProfile();

  const [fullName, setFullName] = useState(user.fullName);
  const [contactNumber, setContactNumber] = useState(user.contactNumber ?? "");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!fullName.trim()) {
      setFeedback({ type: "error", message: "Display name cannot be empty." });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim() || null,
      });
      setFeedback({ type: "success", message: "Profile updated!" });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to update profile.",
      });
    }
  };

  return (
    <StaffCard>
      <StaffCardHeader>
        <StaffCardTitle>Profile</StaffCardTitle>
      </StaffCardHeader>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="font-bold">
              Display name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber" className="font-bold">
              Contact number{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <FeedbackMessage feedback={feedback} />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-10 rounded-full px-6"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </form>
    </StaffCard>
  );
}

export default function TeacherSettingsPage() {
  const { data: user } = useCurrentUser();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Settings"
        description="Manage your teacher account."
      />

      {user && (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <StaffCard className="flex flex-col items-center p-6 text-center">
              <InitialsAvatar
                name={user.fullName}
                className="size-20 text-3xl ring-4 ring-accent"
              />
              <h2 className="mt-4 text-lg font-bold text-foreground">
                {user.fullName}
              </h2>
              <Badge className="mt-2 h-6 border-amber-300 bg-amber-100 px-3 font-bold text-amber-900">
                FSL Teacher
              </Badge>
            </StaffCard>

            <StaffCard>
              <StaffCardHeader>
                <StaffCardTitle>Account</StaffCardTitle>
              </StaffCardHeader>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-extrabold text-muted-foreground uppercase">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={user.username}
                    readOnly
                    className="h-10 bg-muted/60"
                  />
                </div>
                {user.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-extrabold text-muted-foreground uppercase">
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={user.email}
                      readOnly
                      className="h-10 bg-muted/60"
                    />
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
              </div>
            </StaffCard>
          </div>

          <div className="space-y-6">
            <ProfileForm user={user} />

            <StaffCard className="flex items-center gap-4 p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-staff-brand font-body text-xl font-black text-white">
                H
              </span>
              <div>
                <p className="text-lg font-bold text-foreground">
                  HUDYAT Teacher Portal
                </p>
                <p className="text-sm text-muted-foreground">
                  Filipino Sign Language learning support. Need help with your
                  account? Contact your administrator.
                </p>
              </div>
            </StaffCard>
          </div>
        </div>
      )}

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={() => setPasswordChanged(true)}
      />
    </div>
  );
}
