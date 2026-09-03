export type PracticePrompt = {
  label: string;
  instruction?: string;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
};

// Starter self-practice prompts, not a validated FSL lesson library.
// Add teacher-approved reference media here when it becomes available.
export const PRACTICE_PROMPTS: Record<string, PracticePrompt[]> = {
  alphabet: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ", (label) => ({
    label,
    ...(label === "A"
      ? { instruction: "Form a fist with your thumb resting against the side of your index finger." }
      : {}),
  })),
  numbers: Array.from({ length: 10 }, (_, index) => ({ label: String(index + 1) })),
  shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star"].map((label) => ({ label })),
  colors: ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"].map((label) => ({ label })),
  greetings: ["Hello", "Good morning", "Good afternoon", "Thank you", "Goodbye"].map((label) => ({ label })),
  calendar: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((label) => ({ label })),
  "wh-questions": ["Who", "What", "Where", "When", "Why"].map((label) => ({ label })),
  "word-concepts": ["Eat", "Drink", "Read", "Big", "Small"].map((label) => ({ label })),
};

export function categorySlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, "-");
}

export function practicePosition(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((Math.min(total, Math.max(0, index + 1)) / total) * 100);
}
