import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/use-change-password";

const MIN_PASSWORD_LENGTH = 8;

function PasswordForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError("All fields are required.");
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return setError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update password.",
      );
    }
  };

  const fields: Array<[string, string, string, (value: string) => void]> = [
    ["current-password", "Current password", currentPassword, setCurrentPassword],
    ["new-password", "New password", newPassword, setNewPassword],
    ["confirm-password", "Confirm new password", confirmPassword, setConfirmPassword],
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {fields.map(([id, label, value, onChange]) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id} className="font-bold">
            {label}
          </Label>
          <Input
            id={id}
            type="password"
            autoComplete={id === "current-password" ? "current-password" : "new-password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10"
          />
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={onCancel}
          disabled={changePasswordMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? "Saving..." : "Update password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-staff sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-body text-xl font-bold">
            Change password
          </DialogTitle>
          <DialogDescription>
            Use at least {MIN_PASSWORD_LENGTH} characters.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the fields start empty each time. */}
        {open && (
          <PasswordForm
            onCancel={() => onOpenChange(false)}
            onSuccess={() => {
              onOpenChange(false);
              onChanged();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
