// PROTOTYPE, delete me. Sunny Playful: Sunny's layout and navigation with more visual delight, using only the current page's palette.
// Motion is entry-only (nothing loops), so nothing competes with the sign for a deaf child's attention.
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Camera, Check, Hand, Lightbulb, MessageCircle, Star } from "lucide-react";

import type { LessonStep } from "@/api/learning-api";
import ReferenceMedia from "@/components/common/reference-media";
import ElevatedButton from "@/components/ui/elavated-button";
import { CategoryDownload } from "@/features/fsl-recognition/category-download";
import { categorySlug } from "@/lib/practice";

import PrototypePracticeCamera from "./prototype-practice-camera";
import PrototypeSwitcher from "./prototype-switcher";
import { meaningOf, STEPS, usePrototypeLesson, whenToUseOf, type PrototypePrompt } from "./use-prototype-lesson";

const STEP_INFO = {
  meaning: { label: "Meaning", icon: Lightbulb },
  context: { label: "When to Use", icon: MessageCircle },
  how: { label: "How to Sign", icon: Hand },
  try: { label: "Try", icon: Camera },
} satisfies Record<LessonStep, { label: string; icon: typeof Hand }>;

const MOTION = `
@keyframes proto-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
@keyframes proto-rise { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`;

function WavyLine() {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 10" preserveAspectRatio="none" className="mt-1 h-2.5 w-40 max-w-full text-hudyat-gold" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <path d="M2 5c13-6 13-6 26 0s13 6 26 0 13-6 26 0 13 6 26 0 13-6 26 0 13 6 26 0" />
    </svg>
  );
}

function PanelBody({ step, prompt, title, onCorrect }: { step: LessonStep; prompt: PrototypePrompt; title: string; onCorrect: () => void }) {
  const Icon = STEP_INFO[step].icon;
  const headingText = {
    meaning: `What does ${prompt.label} mean?`,
    context: `When do we use ${prompt.label}?`,
    how: `How do we sign ${prompt.label}?`,
    try: `Now you try ${prompt.label}!`,
  }[step];

  return (
    <div className="relative space-y-5 motion-safe:animate-[proto-rise_.3s_ease-out]">
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-hudyat-gold text-primary-foreground shadow-[var(--shadow-button)] motion-safe:animate-[proto-pop_.4s_ease-out] sm:size-18">
          <Icon aria-hidden="true" className="size-9 sm:size-10" />
        </span>
        <div className="min-w-0">
          <h2 className="wrap-break-word text-2xl font-semibold text-foreground sm:text-4xl">{headingText}</h2>
          <WavyLine />
        </div>
      </div>

      {step === "meaning" && <p className="text-xl leading-relaxed text-foreground sm:text-2xl">{meaningOf(prompt)}</p>}

      {step === "context" && (
        <div className="flex items-end gap-3 pb-1">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
            <Hand className="size-7" />
          </span>
          <p className="min-w-0 flex-1 rounded-3xl rounded-bl-md border-2 border-hudyat-gold/30 bg-accent/40 p-5 text-xl leading-relaxed text-foreground sm:text-2xl">
            {whenToUseOf(prompt)}
          </p>
        </div>
      )}

      {step === "how" && (
        <div className="rounded-2xl border-4 border-hudyat-gold/30 p-1.5">
          <ReferenceMedia key={prompt.label} videoUrl={prompt.referenceVideoUrl} imageUrl={prompt.referenceImageUrl} label={prompt.label} className="max-h-[44dvh]" />
        </div>
      )}

      {step === "try" && <PrototypePracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={onCorrect} confetti />}
    </div>
  );
}

export default function PlayfulLearnPage({
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
  const nextText = following ? `Next: ${STEP_INFO[following].label}` : lesson.isLast ? "Finish lesson" : `Next ${noun}`;
  const percent = ((index + 1) / total) * 100;

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-background font-body">
      <style>{MOTION}</style>

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

          <h1 aria-live="polite" className="order-last col-span-2 min-w-0 wrap-break-word text-center text-2xl font-bold text-foreground sm:text-4xl md:order-none md:col-span-1">
            Let&rsquo;s learn the {noun} <span className="text-hudyat-gold">{prompt.label}</span>!
          </h1>

          {/* Progress: a star travels along the path as signs are finished. */}
          <div className="ml-auto w-full max-w-56">
            <p className="mb-1 text-center text-sm font-medium text-foreground">{index + 1} of {total} {noun}s</p>
            <div role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} className="relative h-5 rounded-full border border-hudyat-gold/20 bg-muted p-0.5">
              <div className="h-full rounded-full bg-hudyat-gold transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
              <span aria-hidden="true" className="absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-card transition-[left] duration-500 motion-reduce:transition-none" style={{ left: `${percent}%` }}>
                <Star className="size-5 fill-hudyat-gold text-hudyat-gold" />
              </span>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2.8fr)] md:gap-5">
          {/* SIGN CARD */}
          <aside className="relative overflow-visible rounded-3xl border-4 border-hudyat-gold/30 bg-accent/30 px-4 pt-7 pb-4 text-center shadow-card">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-hudyat-gold px-5 py-1.5 text-sm font-semibold whitespace-nowrap text-foreground uppercase shadow-[var(--shadow-button)]">
              {noun} {index + 1}
            </span>

            <div className="flex items-center justify-center gap-4 md:flex-col md:gap-3">
              {/* Remounts per sign, so each new sign pops in. */}
              <div key={prompt.label} className="relative flex min-w-0 items-center justify-center motion-safe:animate-[proto-pop_.45s_ease-out]">
                <span aria-hidden="true" className="absolute size-24 rounded-[42%_58%_55%_45%/50%_45%_55%_50%] bg-hudyat-gold/30 md:size-36" />
                <p className={`relative max-w-full min-w-0 wrap-break-word leading-none font-bold text-foreground ${prompt.label.length <= 2 ? "text-7xl md:text-9xl" : "text-3xl md:text-4xl"}`}>
                  {prompt.label}
                </p>
              </div>

              {prompt.referenceImageUrl ? (
                <div className="w-40 max-w-full shrink-0 -rotate-2 rounded-2xl border-4 border-background bg-background shadow-card-hover md:w-full">
                  <ReferenceMedia imageUrl={prompt.referenceImageUrl} label={prompt.label} className="aspect-auto h-24 w-full rounded-xl bg-hudyat-gold/15 md:h-32" />
                </div>
              ) : (
                <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
                  <Hand aria-hidden="true" className="size-12" />
                </span>
              )}
            </div>

            {/* One star per finished step: a small reward that needs no reading. */}
            <div role="img" aria-label={`${stepIndex} of ${STEPS.length} steps finished for this ${noun}`} className="mt-3 flex items-center justify-center gap-1.5">
              {STEPS.map((item, position) => (
                <Star
                  key={item}
                  aria-hidden="true"
                  className={`size-7 ${position < stepIndex ? "fill-hudyat-gold text-hudyat-gold motion-safe:animate-[proto-pop_.4s_ease-out]" : "text-hudyat-gold/40"}`}
                />
              ))}
            </div>

            <p className="mt-2 hidden text-lg leading-snug text-foreground md:block">Learn this sign, then try it!</p>
          </aside>

          {/* TABS + PANEL */}
          <div className="min-w-0">
            <nav aria-label="Lesson steps" className="grid grid-cols-4 items-end gap-1 sm:gap-1.5">
              {STEPS.map((item, position) => {
                const current = item === step;
                const done = position < stepIndex;
                const { label, icon: Icon } = STEP_INFO[item];
                return (
                  <button
                    key={item}
                    type="button"
                    aria-current={current ? "step" : undefined}
                    onClick={() => lesson.goToStep(item)}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-t-2xl px-1 py-2 text-center text-sm leading-tight transition-[min-height,background-color] duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:flex-row sm:gap-2 sm:text-base ${
                      current
                        ? "min-h-20 bg-hudyat-gold font-bold text-foreground"
                        : done
                          ? "min-h-16 bg-hudyat-gold/25 font-medium text-foreground hover:bg-hudyat-gold/35"
                          : "min-h-16 bg-muted font-medium text-foreground hover:bg-hudyat-gold/15"
                    }`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${current ? "bg-background text-hudyat-gold" : done ? "bg-hudyat-gold text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                      {done ? <Check aria-label="Done" className="size-5" strokeWidth={3} /> : <Icon aria-hidden="true" className="size-5" />}
                    </span>
                    {label}
                  </button>
                );
              })}
            </nav>

            <section className="relative min-h-72 overflow-hidden rounded-b-3xl border-4 border-t-0 border-hudyat-gold/30 bg-card p-4 shadow-card sm:p-7">
              {/* Soft corner shapes give the panel character without moving or adding anything to read. */}
              <span aria-hidden="true" className="pointer-events-none absolute -top-14 -right-14 size-44 rounded-full bg-accent/70" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 size-32 rounded-full bg-hudyat-gold/10" />
              {/* Remounts per step and sign, so new content rises in. */}
              <PanelBody key={`${index}-${step}`} step={step} prompt={prompt} title={title} onCorrect={lesson.next} />
            </section>

            {/* BACK + NEXT: stays on screen, so the way forward is never hidden */}
            <div className="sticky bottom-0 z-20 mt-3 flex gap-3 bg-background py-3">
              <ElevatedButton text="Back" icon={ArrowLeft} variant="secondary" size="lg" className="min-h-14 shrink-0 text-lg! font-semibold! text-foreground" disabled={lesson.isFirst} onClick={lesson.back} />
              <ElevatedButton
                text={nextText}
                icon={following || !lesson.isLast ? ArrowRight : Check}
                iconPosition="right"
                size="lg"
                className="min-h-14 min-w-0 flex-1 text-lg! font-bold! text-foreground! sm:text-xl!"
                onClick={lesson.next}
              />
            </div>

            <CategoryDownload category={title.toLowerCase().replace(/\s+/g, "-")} />
          </div>
        </div>
      </div>

      <PrototypeSwitcher current="playful" state={`${noun} ${index + 1}/${total} · ${step}`} />
    </div>
  );
}
