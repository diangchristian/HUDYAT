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
import { useCreateLearner } from "@/hooks/use-create-learner";

const MIN_PASSWORD_LENGTH = 8;

function StudentForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (name: string, username: string) => void;
}) {
  const createLearner = useCreateLearner();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !username.trim()) {
      return setError("Enter the student's full name and a username.");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }

    createLearner.mutate(
      { fullName, username, password },
      {
        onSuccess: (learner) => onCreated(learner.fullName, learner.username),
        onError: (submitError) => setError(submitError.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="student-name" className="font-bold">
          Full name
        </Label>
        <Input
          id="student-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-username" className="font-bold">
          Username
        </Label>
        <Input
          id="student-username"
          autoComplete="off"
          aria-describedby="student-username-help"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-10"
        />
        <p id="student-username-help" className="text-sm text-muted-foreground">
          Letters, numbers, dots, dashes or underscores.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-password" className="font-bold">
          Password
        </Label>
        {/* Shown as text: the teacher has to read it out or write it down. */}
        <Input
          id="student-password"
          type="text"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="student-password-help"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10"
        />
        <p id="student-password-help" className="text-sm text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters. Give it to the student or
          their parent. They can change it later in their settings.
        </p>
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
          disabled={createLearner.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={createLearner.isPending}
        >
          {createLearner.isPending ? "Adding..." : "Add student"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AddStudentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (name: string, username: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-staff sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add student</DialogTitle>
          <DialogDescription>
            Create a login for a student. No email is needed.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the password isn't left in the form. */}
        {open && (
          <StudentForm
            onCancel={() => onOpenChange(false)}
            onCreated={(name, username) => {
              onOpenChange(false);
              onCreated(name, username);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
