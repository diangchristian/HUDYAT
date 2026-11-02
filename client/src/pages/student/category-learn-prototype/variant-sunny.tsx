// PROTOTYPE, delete me. Sunny Lesson: layout from the user's reference image, on real lesson data, with the app's normal background.
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, Hand, Lightbulb, MessageCircle, Camera } from "lucide-react";

import type { LessonStep } from "@/api/learning-api";
import ReferenceMedia from "@/components/common/reference-media";
import ElevatedButton from "@/components/ui/elavated-button";
import { CategoryDownload } from "@/features/fsl-recognition/category-download";
import { categorySlug } from "@/lib/practice";

import PrototypePracticeCamera from "./prototype-practice-camera";
import PrototypeSwitcher from "./prototype-switcher";
import { meaningOf, STEPS, usePrototypeLesson, whenToUseOf, type PrototypePrompt } from "./use-prototype-lesson";

const TAB_LABELS: Record<LessonStep, string> = {
  meaning: "Meaning",
  context: "When to Use",
  how: "How to Sign",
  try: "Try",
};

function PanelBody({ step, prompt, title, onCorrect }: { step: LessonStep; prompt: PrototypePrompt; title: string; onCorrect: () => void }) {
  const heading = {
    meaning: { icon: Lightbulb, text: `What does ${prompt.label} mean?` },
    context: { icon: MessageCircle, text: `When do we use ${prompt.label}?` },
    how: { icon: Hand, text: `How do we sign ${prompt.label}?` },
    try: { icon: Camera, text: `Now you try ${prompt.label}!` },
  }[step];
  const Icon = heading.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/15 text-hudyat-gold sm:size-16`}>
          <Icon aria-hidden="true" className="size-8 sm:size-9" />
        </span>
        <h2 className={`min-w-0 wrap-break-word text-2xl font-semibold sm:text-4xl text-foreground`}>{heading.text}</h2>
      </div>

      {step === "meaning" && <p className={`text-xl leading-relaxed sm:text-2xl text-foreground`}>{meaningOf(prompt)}</p>}

      {step === "context" && (
        <p className={`rounded-2xl bg-accent/20 p-5 text-xl leading-relaxed sm:text-2xl text-foreground`}>{whenToUseOf(prompt)}</p>
      )}

      {step === "how" && (
        <ReferenceMedia key={prompt.label} videoUrl={prompt.referenceVideoUrl} imageUrl={prompt.referenceImageUrl} label={prompt.label} className="max-h-[48dvh]" />
      )}

      {step === "try" && <PrototypePracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={onCorrect} />}
    </div>
  );
}

export default function SunnyLearnPage({
  title,
  prompts,
  initialGestureIndex,
  initialStep,
  onFinishLesson,
}: {
  title: string;
  prompts: PrototypePrompt[];
  initialGestureIndex: number;
  initialStep: LessonStep | null;
  onFinishLesson: () => void;
}) {
  const navigate = useNavigate();
  const lesson = usePrototypeLesson(prompts, initialGestureIndex, initialStep, onFinishLesson);
  const { prompt, step, index, total } = lesson;

  const noun = title.toLowerCase() === "alphabet" ? "letter" : "sign";
  const stepIndex = STEPS.indexOf(step);
  const following = STEPS[stepIndex + 1];
  const nextText = following ? `Next: ${TAB_LABELS[following]}` : lesson.isLast ? "Finish lesson" : `Next ${noun}`;

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-background font-body">
      {/* Top space that shrinks away before the page would need to scroll. */}
      <div aria-hidden="true" className="h-12 shrink" />

      <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pt-5 pb-6 sm:px-8">
        {/* HEADER */}
        <header className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-5">
          <ElevatedButton
            text="BACK TO CATEGORIES"
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            className="min-h-11 w-fit font-semibold!"
            onClick={() => navigate("/student/learn")}
          />

          <div className="order-last col-span-2 flex items-center justify-center gap-3 md:order-none md:col-span-1">
           
            <h1 aria-live="polite" className={`min-w-0 wrap-break-word text-center text-2xl font-bold sm:text-4xl text-foreground`}>
              Let&rsquo;s learn the {noun} {prompt.label}!
            </h1>
           
          </div>

          <div className="ml-auto w-full max-w-56">
            <p className={`mb-1 text-center text-sm font-medium text-foreground`}>{index + 1} of {total} {noun}s</p>
            <div role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} className="h-5 overflow-hidden rounded-full border border-hudyat-gold/20 bg-muted p-0.5">
              <div className="h-full rounded-full bg-hudyat-gold transition-[width] motion-reduce:transition-none" style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
        </header>

        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2.8fr)] md:gap-5">
          {/* SIGN CARD */}
          <aside className="relative rounded-3xl border-4 border-hudyat-gold/30 bg-accent/10 px-4 pt-7 pb-4 text-center shadow-card">
            <span className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-hudyat-gold px-5 py-1.5 text-sm font-semibold whitespace-nowrap text-primary-foreground uppercase`}>
              {noun} {index + 1}
            </span>

            <div className="flex items-center justify-center gap-4 md:flex-col md:gap-3">
              <p className={`max-w-full min-w-0 wrap-break-word font-bold leading-none text-foreground ${prompt.label.length <= 2 ? "text-7xl md:text-9xl" : "text-3xl md:text-4xl"}`}>
                {prompt.label}
              </p>

              {prompt.referenceImageUrl ? (
                <ReferenceMedia imageUrl={prompt.referenceImageUrl} label={prompt.label} className="aspect-auto h-28 w-40 max-w-full shrink-0 rounded-2xl bg-hudyat-gold/15 md:h-40 md:w-full" />
              ) : (
                <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
                  <Hand aria-hidden="true" className="size-12" />
                </span>
              )}
            </div>

            <p className={`mt-3 hidden border-t-2 border-hudyat-gold/30 pt-3 text-lg leading-snug md:block text-foreground`}>
              Learn this sign, then try it!
            </p>
          </aside>

          {/* TABS + PANEL */}
          <div className="min-w-0">
            <nav aria-label="Lesson steps" className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {STEPS.map((item, position) => {
                const current = item === step;
                const done = position < stepIndex;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-current={current ? "step" : undefined}
                    onClick={() => lesson.goToStep(item)}
                    className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-t-2xl px-1 py-2 text-center text-sm leading-tight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:flex-row sm:gap-2 sm:text-base ${
                      current ? "bg-hudyat-gold font-bold text-primary-foreground" : "bg-muted font-medium text-foreground hover:bg-hudyat-gold/15"
                    }`}
                  >
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm ${current ? "bg-background text-foreground" : "bg-hudyat-gold/20 text-foreground"}`}>
                      {done ? <Check aria-label="Done" className="size-4" strokeWidth={3} /> : position + 1}
                    </span>
                    {TAB_LABELS[item]}
                  </button>
                );
              })}
            </nav>

            <section className="min-h-72 rounded-b-3xl border-4 border-t-0 border-hudyat-gold/30 bg-card p-4 shadow-card sm:p-7">
              <PanelBody step={step} prompt={prompt} title={title} onCorrect={lesson.next} />
            </section>

            {/* BACK + NEXT: stays on screen, so the way forward is never hidden */}
            <div className="sticky bottom-0 z-20 mt-3 flex gap-3 bg-background py-3">
              <ElevatedButton text="Back" icon={ArrowLeft} variant="secondary" size="lg" className={`min-h-14 shrink-0 text-lg! font-semibold! text-foreground`} disabled={lesson.isFirst} onClick={lesson.back} />
              <ElevatedButton
                text={nextText}
                icon={following || !lesson.isLast ? ArrowRight : Check}
                iconPosition="right"
                size="lg"
                className="min-h-14 min-w-0 flex-1 text-lg! font-bold! sm:text-xl!"
                onClick={lesson.next}
              />
            </div>

            <CategoryDownload category={title.toLowerCase().replace(/\s+/g, "-")} />
          </div>
        </div>
      </div>

      <PrototypeSwitcher current="sunny" state={`${noun} ${index + 1}/${total} · ${step}`} />
    </div>
  );
}
