// PROTOTYPE, delete me. "Three layouts of the category learn page keeping all 4 steps, switchable via ?variant=, on /student/learn/:categoryId."
// Lesson position lives here so switching layouts keeps you on the same sign and step.
import type { LessonStep } from "@/api/learning-api";
import { CategoryDownload } from "@/features/fsl-recognition/category-download";

import PrototypeSwitcher from "./prototype-switcher";
import { usePrototypeLesson, type LayoutVariant, type PrototypePrompt } from "./use-prototype-lesson";
import VariantComic from "./variant-comic";
import VariantTabs from "./variant-tabs";
import VariantTiles from "./variant-tiles";

export default function PrototypeHost({
  variant,
  title,
  prompts,
  initialGestureIndex,
  initialStep,
  onFinishLesson,
}: {
  variant: LayoutVariant;
  title: string;
  prompts: PrototypePrompt[];
  initialGestureIndex: number;
  initialStep: LessonStep | null;
  onFinishLesson: () => void;
}) {
  const lesson = usePrototypeLesson(prompts, initialGestureIndex, initialStep, onFinishLesson);
  const Variant = { tiles: VariantTiles, comic: VariantComic, tabs: VariantTabs }[variant];

  return (
    <>
      <CategoryDownload category={title.toLowerCase().replace(/\s+/g, "-")} />
      {/* Remount per sign so per-sign state, like Comic Page's camera, starts fresh. */}
      <Variant key={lesson.index} title={title} lesson={lesson} />
      <PrototypeSwitcher current={variant} state={`sign ${lesson.index + 1}/${lesson.total} · ${variant === "comic" ? "all steps" : lesson.step}`} />
    </>
  );
}
