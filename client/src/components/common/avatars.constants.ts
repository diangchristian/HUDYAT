export const AVATARS: { key: string; emoji: string; label: string }[] = [
  { key: "fox", emoji: "🦊", label: "Fox" },
  { key: "cat", emoji: "🐱", label: "Cat" },
  { key: "dog", emoji: "🐶", label: "Dog" },
  { key: "lion", emoji: "🦁", label: "Lion" },
  { key: "panda", emoji: "🐼", label: "Panda" },
  { key: "unicorn", emoji: "🦄", label: "Unicorn" },
  { key: "frog", emoji: "🐸", label: "Frog" },
  { key: "koala", emoji: "🐨", label: "Koala" },
];

export function getAvatarEmoji(avatarKey: string | null | undefined) {
  return AVATARS.find((avatar) => avatar.key === avatarKey)?.emoji ?? null;
}
