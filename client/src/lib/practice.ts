export type PracticePrompt = {
  label: string;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
};

export function categorySlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, "-");
}

/** The next sign without a star after `from` (wrapping around), or null once every sign has one. */
export function nextUnstarred(starred: ReadonlySet<number>, from: number, total: number): number | null {
  for (let step = 1; step <= total; step++) {
    const index = (from + step) % total;
    if (!starred.has(index)) return index;
  }
  return null;
}
