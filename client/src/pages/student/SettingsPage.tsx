import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ElevatedButton from "@/components/ui/elavated-button";
import { AVATARS } from "@/components/common/avatars.constants";
import PasswordSettingsCard from "@/components/common/password-settings-card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useUpdateProfile } from "@/hooks/use-update-profile";

function ProfileSection() {
  const { data: user } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [avatarKey, setAvatarKey] = useState(user?.avatarKey ?? null);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const handleSave = async () => {
    setFeedback(null);

    if (!fullName.trim()) {
      setFeedback({ type: "error", message: "Display name cannot be empty." });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        avatarKey,
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
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Choose an avatar and update your display name.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Avatar</p>

        <div className="flex flex-wrap gap-3">
          {AVATARS.map((avatar) => {
            const isSelected = avatarKey === avatar.key;

            return (
              <button
                key={avatar.key}
                type="button"
                aria-label={avatar.label}
                aria-pressed={isSelected}
                onClick={() => setAvatarKey(avatar.key)}
                className={`flex size-14 items-center justify-center rounded-full border-2 text-2xl transition-all ${
                  isSelected
                    ? "border-hudyat-gold bg-hudyat-gold/15 ring-2 ring-hudyat-gold ring-offset-2"
                    : "border-border bg-muted hover:border-hudyat-gold/50"
                }`}
              >
                {avatar.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
          Display name
        </label>

        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="font-body"
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
        text={updateProfileMutation.isPending ? "SAVING..." : "SAVE PROFILE"}
        disabled={updateProfileMutation.isPending}
        onClick={() => void handleSave()}
      />
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="w-full max-w-2xl font-body">
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          Settings
        </span>

        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          My Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and password.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <ProfileSection />
        <PasswordSettingsCard />
      </div>
    </section>
  );
}
