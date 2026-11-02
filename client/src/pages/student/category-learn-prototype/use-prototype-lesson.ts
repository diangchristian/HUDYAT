// PROTOTYPE, delete me. In-memory lesson navigation for the ?variant= layouts: never saves progress.
import { useState } from "react";
import { Camera, Hand, Lightbulb, MessageCircle } from "lucide-react";

import type { LessonStep } from "@/api/learning-api";
import type { PracticePrompt } from "@/lib/practice";

export type PrototypePrompt = PracticePrompt & {
  modelClass: string;
  meaning?: string | null;
  whenToUse?: string | null;
};

export const PROTOTYPE_VARIANTS = ["sunny", "playful", "tiles", "comic", "tabs", "enhanced", "current"] as const;
export type PrototypeVariant = (typeof PROTOTYPE_VARIANTS)[number];

export const VARIANT_NAMES: Record<PrototypeVariant, string> = {
  sunny: "Sunny Lesson",
  playful: "Sunny Playful",
  tiles: "Step Tiles",
  comic: "Comic Page",
  tabs: "Bottom Tabs",
  enhanced: "Enhanced",
  current: "Current page",
};

export type LayoutVariant = "tiles" | "comic" | "tabs";
export const isLayoutVariant = (variant: string | null): variant is LayoutVariant =>
  variant === "tiles" || variant === "comic" || variant === "tabs";

export const STEPS: LessonStep[] = ["meaning", "context", "how", "try"];

// Each step keeps one colour everywhere, so children can recognise it without reading.
export const STEP_META = {
  meaning: { label: "Meaning", icon: Lightbulb, solid: "bg-amber-400 text-gray-900", soft: "bg-amber-100 border-amber-400" },
  context: { label: "When to Use", icon: MessageCircle, solid: "bg-sky-600 text-white", soft: "bg-sky-100 border-sky-500" },
  how: { label: "How to Sign", icon: Hand, solid: "bg-emerald-600 text-white", soft: "bg-emerald-100 border-emerald-500" },
  try: { label: "Try", icon: Camera, solid: "bg-rose-600 text-white", soft: "bg-rose-100 border-rose-500" },
} satisfies Record<LessonStep, { label: string; icon: typeof Hand; solid: string; soft: string }>;

export const meaningOf = (prompt: PrototypePrompt) =>
  prompt.meaning || `Learn what the sign "${prompt.label}" means.`;

export const whenToUseOf = (prompt: PrototypePrompt) =>
  prompt.whenToUse || `Use "${prompt.label}" when it fits.`;

export function usePrototypeLesson(
  prompts: PrototypePrompt[],
  initialIndex: number,
  initialStep: LessonStep | null,
  onFinish: () => void,
) {
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), prompts.length - 1));
  const [step, setStep] = useState<LessonStep>(initialStep ?? "meaning");
  const isLast = index === prompts.length - 1;

  const nextSign = () => {
    if (isLast) {
      onFinish();
      return;
    }
    setIndex(index + 1);
    setStep("meaning");
  };

  const previousSign = () => {
    if (index === 0) return;
    setIndex(index - 1);
    setStep("meaning");
  };

  const next = () => {
    const following = STEPS[STEPS.indexOf(step) + 1];
    if (following) setStep(following);
    else nextSign();
  };

  const back = () => {
    const previous = STEPS[STEPS.indexOf(step) - 1];
    if (previous) setStep(previous);
    else if (index > 0) {
      setIndex(index - 1);
      setStep("try");
    }
  };

  return {
    prompt: prompts[index],
    total: prompts.length,
    index,
    step,
    isLast,
    isFirst: index === 0 && step === "meaning",
    goToStep: setStep,
    next,
    back,
    nextSign,
    previousSign,
  };
}

export type PrototypeLesson = ReturnType<typeof usePrototypeLesson>;
