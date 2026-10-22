export type PracticePrompt = {
  label: string;
  instruction?: string;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
};

export function categorySlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, "-");
}

export function practicePosition(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((Math.min(total, Math.max(0, index + 1)) / total) * 100);
}
