import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ElevatedButton from "@/components/ui/elavated-button";
import { useChangePassword } from "@/hooks/use-change-password";

/** Change-password card on the student settings page. */
export default function PasswordSettingsCard() {
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const handleSave = async () => {
    setFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: "error", message: "All fields are required." });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        message: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "success", message: "Password updated!" });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to update password.",
      });
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Password</h2>
        <p className="text-sm text-muted-foreground">
          Update the password you use to log in.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="currentPassword"
          className="text-sm font-semibold text-foreground"
        >
          Current password
        </label>

        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
          New password
        </label>

        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-foreground"
        >
          Confirm new password
        </label>

        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {feedback && (
        <p
          role="alert"
          className={`text-sm font-bold ${
            feedback.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <ElevatedButton
        text={changePasswordMutation.isPending ? "SAVING..." : "SAVE PASSWORD"}
        disabled={changePasswordMutation.isPending}
        onClick={() => void handleSave()}
      />
    </Card>
  );
}
