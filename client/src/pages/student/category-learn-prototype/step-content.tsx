// PROTOTYPE, delete me. What each of the 4 steps shows; the layouts only differ in how they arrange these.
import type { LessonStep } from "@/api/learning-api";
import ReferenceMedia from "@/components/common/reference-media";
import { categorySlug } from "@/lib/practice";

import PrototypePracticeCamera from "./prototype-practice-camera";
import { meaningOf, whenToUseOf, type PrototypePrompt } from "./use-prototype-lesson";

export default function StepContent({
  step,
  prompt,
  title,
  onCorrect,
}: {
  step: LessonStep;
  prompt: PrototypePrompt;
  title: string;
  onCorrect: () => void;
}) {
  if (step === "meaning") {
    return (
      <div className="space-y-4">
        {prompt.referenceImageUrl && (
          <ReferenceMedia imageUrl={prompt.referenceImageUrl} label={prompt.label} className="mx-auto max-h-[32dvh] bg-background" />
        )}
        <p className="text-xl leading-relaxed font-semibold sm:text-2xl">{meaningOf(prompt)}</p>
      </div>
    );
  }

  if (step === "context") {
    return (
      <div className="relative rounded-3xl border-2 border-sky-300 bg-card px-5 py-6 shadow-card">
        <p className="text-xl leading-relaxed font-semibold sm:text-2xl">{whenToUseOf(prompt)}</p>
        <span aria-hidden="true" className="absolute -bottom-2.5 left-10 size-5 rotate-45 rounded-sm border-r-2 border-b-2 border-sky-300 bg-card" />
      </div>
    );
  }

  if (step === "how") {
    return (
      <ReferenceMedia
        key={prompt.label}
        videoUrl={prompt.referenceVideoUrl}
        imageUrl={prompt.referenceImageUrl}
        label={prompt.label}
        className="max-h-[50dvh] bg-background"
      />
    );
  }

  return <PrototypePracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={onCorrect} />;
}
