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
  })),
  // Prompts use the recognition models' sign names, so a correct sign is accepted.
  numbers: ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"].map((label) => ({ label })),
  shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star"].map((label) => ({ label })),
  colors: ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"].map((label) => ({ label })),
  greetings: ["Good morning", "Good afternoon", "Good evening", "Hello", "How are you", "I'm fine", "Nice to meet you", "Thank you", "You're welcome", "See you tomorrow"].map((label) => ({ label })),
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
