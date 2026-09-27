import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { cn } from "@/lib/utils";

const TONES = [
  "bg-sky-600 text-white",
  "bg-amber-200 text-amber-900",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-700",
];

/** Stable per-name color, so a person keeps the same avatar everywhere. */
function toneFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

type InitialsAvatarProps = {
  name: string;
  /** A learner's chosen avatar emoji key, shown instead of the initial. */
  avatarKey?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export default function InitialsAvatar({
  name,
  avatarKey,
  size = "default",
  className,
}: InitialsAvatarProps) {
  const emoji = getAvatarEmoji(avatarKey);

  return (
    <Avatar size={size} className={cn("after:border-0", className)}>
      <AvatarFallback
        className={cn(
          "font-bold",
          emoji ? "bg-amber-50 text-lg" : toneFor(name),
        )}
      >
        {emoji ?? name.trim().charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
