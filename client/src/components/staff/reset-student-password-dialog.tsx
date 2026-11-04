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
import { useResetLearnerPassword } from "@/hooks/use-reset-learner-password";

const MIN_PASSWORD_LENGTH = 8;

function ResetForm({
  learnerId,
  onCancel,
  onReset,
}: {
  learnerId: string;
  onCancel: () => void;
  onReset: () => void;
}) {
  const resetPassword = useResetLearnerPassword();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }

    resetPassword.mutate(
      { id: learnerId, password },
      {
        onSuccess: onReset,
        onError: (submitError) => setError(submitError.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="student-new-password" className="font-bold">
          New password
        </Label>
        {/* Shown as text: the teacher has to read it out or write it down. */}
        <Input
          id="student-new-password"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10"
        />
      </div>

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
          disabled={resetPassword.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending ? "Saving..." : "Reset password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ResetStudentPasswordDialog({
  learner,
  open,
  onOpenChange,
  onReset,
}: {
  learner: { id: string; fullName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-staff sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Reset password for {learner.fullName}
          </DialogTitle>
          <DialogDescription>
            Their old password stops working right away. Give the new one to the
            student or their parent. At least {MIN_PASSWORD_LENGTH} characters.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ResetForm
            learnerId={learner.id}
            onCancel={() => onOpenChange(false)}
            onReset={() => {
              onOpenChange(false);
              onReset();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
