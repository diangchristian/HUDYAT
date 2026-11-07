/*
 * The category lesson, mobile/tablet first:
 *  - top: a trail through the lesson's world; the lesson character walks sign to sign
 *  - middle: "Step N · label", the step's question, then that step's card
 *  - bottom (fixed, thumb reach): the 4 step bubbles and a big NEXT
 * Phone (<640px): 5 trail stops, bottom bar on 2 rows. Tablet: 7 stops, 1 row.
 * Every move saves the lesson checkpoint, as before.
 */
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Hand, House, Lightbulb, MessageCircle, Star } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import type { LessonStep } from "@/api/learning-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import ElevatedButton from "@/components/ui/elavated-button";
import { usePreloadRecognition } from "@/features/fsl-recognition/preload";
import { useSaveLessonCheckpoint } from "@/hooks/use-save-lesson-checkpoint";
import { categorySlug, type PracticePrompt } from "@/lib/practice";
import { cn } from "@/lib/utils";

import Celebration from "./celebration";
import StepCard from "./step-cards";
// PROTOTYPE, delete me: ?variant=when-* compares When to Use designs (dev only).
import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import { isWhenVariant, videoFrameUrl, WHEN_VARIANTS } from "./when-to-use-prototype";
import "./learn-session.css";

export type LessonPrompt = PracticePrompt & {
  modelClass: string;
  meaning?: string | null;
  whenToUse?: string | null;
};

const STEPS: LessonStep[] = ["meaning", "context", "how", "try"];

// Each step keeps one colour and icon everywhere, so children recognise it without reading.
const STEP_META = {
  meaning: { label: "Meaning", icon: Lightbulb, solid: "bg-amber-400 text-gray-900", ring: "#FBBF24", question: ["What is the meaning of", "?"] },
  context: { label: "When to Use", icon: MessageCircle, solid: "bg-sky-600 text-white", ring: "#0284C7", question: ["When do we use", "?"] },
  how: { label: "How to Sign", icon: Hand, solid: "bg-emerald-600 text-white", ring: "#059669", question: ["How do we sign", "?"] },
  try: { label: "Try", icon: Camera, solid: "bg-rose-600 text-white", ring: "#E11D48", question: ["Now you try", "!"] },
} satisfies Record<LessonStep, { label: string; icon: typeof Hand; solid: string; ring: string; question: [string, string] }>;

// The character reads along on text steps and stays still for the video and camera.
const MOOD: Record<LessonStep, "talk" | "watch"> = { meaning: "talk", context: "talk", how: "watch", try: "watch" };

const CHEER_MS = 2200;

const TABLET = "(min-width: 640px)";
const subscribeTablet = (onChange: () => void) => {
  const query = matchMedia(TABLET);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useTablet = () => useSyncExternalStore(subscribeTablet, () => matchMedia(TABLET).matches);

const stopY = (i: number) => (i % 2 ? 34 : 66);

type Props = {
  categoryId: string;
  title: string;
  prompts: LessonPrompt[];
  initialGestureIndex: number;
  initialStep: LessonStep | null;
  onFinishLesson: () => void;
};

export default function LearnSession({ categoryId, title, prompts, initialGestureIndex, initialStep, onFinishLesson }: Props) {
  const navigate = useNavigate();
  const tablet = useTablet();
  const checkpoint = useSaveLessonCheckpoint(categoryId);
  usePreloadRecognition(categorySlug(title));

  const [index, setIndex] = useState(() => Math.min(Math.max(initialGestureIndex, 0), prompts.length - 1));
  const [step, setStep] = useState<LessonStep>(initialStep && STEPS.includes(initialStep) ? initialStep : "meaning");
  // The sign just finished, while its celebration plays; `at` lets back-to-back cheers restart.
  const [cheer, setCheer] = useState<{ at: number; label: string } | null>(null);
  const cheering = cheer !== null;

  // PROTOTYPE, delete me: variant + still-frame fallback for signs that only have a video.
  const protoKey = useSearchParams()[0].get("variant");
  const whenVariant = import.meta.env.DEV && isWhenVariant(protoKey) ? protoKey : undefined;
  const rawPrompt = prompts[index];
  const prompt =
    whenVariant && rawPrompt && !rawPrompt.referenceImageUrl
      ? { ...rawPrompt, referenceImageUrl: videoFrameUrl(rawPrompt.referenceVideoUrl) }
      : rawPrompt;
  const stepIndex = STEPS.indexOf(step);
  const isLast = index === prompts.length - 1;
  const following = STEPS[stepIndex + 1];
  const color = CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
  const meta = STEP_META[step];

  const goTo = (nextIndex: number, nextStep: LessonStep) => {
    if (nextIndex > index) {
      const at = Date.now();
      setCheer({ at, label: prompts[index].label });
      setTimeout(() => setCheer((current) => (current?.at === at ? null : current)), CHEER_MS);
    }
    setIndex(nextIndex);
    setStep(nextStep);
    // The lesson continues if saving fails; checkpoint.isError shows the banner below.
    checkpoint.mutate({ gestureIndex: nextIndex, lessonStep: nextStep });
  };

  const next = () => {
    if (following) goTo(index, following);
    else if (isLast) onFinishLesson();
    else goTo(index + 1, "meaning");
  };

  const back = () => {
    const previous = STEPS[stepIndex - 1];
    if (previous) goTo(index, previous);
    else if (index > 0) goTo(index - 1, "try");
  };

  // A window of trail stops around the current sign (Alphabet has 26 signs).
  const size = tablet ? 7 : 5;
  const start = Math.max(0, Math.min(index - Math.floor(size / 2), prompts.length - size));
  const shown = prompts.slice(start, start + size);
  const x = (i: number) => (shown.length === 1 ? 50 : 10 + ((i - start) / (shown.length - 1)) * 80);
  const StepIcon = meta.icon;

  if (!prompt) return null;

  return (
    <div className="min-h-dvh bg-[#FFF8E7] pb-[calc(9.5rem+env(safe-area-inset-bottom))] font-body sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      {cheer && <Celebration key={cheer.at} label={cheer.label} durationMs={CHEER_MS} />}

      {/* SIGN TRAIL */}
      <section aria-label="Your sign trail" className="relative h-44 overflow-hidden rounded-b-[2rem] border-b-4 border-white shadow-[0_6px_0_#0000000d] sm:h-60">
        <div className={cn("absolute inset-0", `ls-mood-${MOOD[step]}`)}>
          <LessonStage title={title} color={color} className="!h-full [&>span.lc-shadow]:hidden [&>svg]:hidden" />
        </div>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <polyline
            points={shown.map((_, o) => `${x(start + o)},${stopY(start + o)}`).join(" ")}
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            strokeDasharray="1 3.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {shown.map((p, o) => {
          const i = start + o;
          return (
            <span
              key={p.label}
              role="img"
              aria-label={`${p.label}${i < index ? ", done" : i === index ? ", now" : ""}`}
              className={cn(
                "absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-sm font-black shadow-[0_4px_0_#0000002a] sm:size-12",
                i < index ? "bg-hudyat-gold text-white" : i === index ? "ls-pulse scale-125 bg-white text-[#4B4B4B]" : "bg-white/70 text-[#AFAFAF]",
              )}
              style={{ left: `${x(i)}%`, top: `${stopY(i)}%`, "--ring": "#ffffffaa" } as CSSProperties}
            >
              {i < index ? <Star className="size-4 fill-white sm:size-5" /> : p.label.length <= 2 ? p.label : i + 1}
            </span>
          );
        })}
        <div
          aria-hidden="true"
          className={cn(
            "absolute z-10 w-16 -translate-x-1/2 transition-[left,top] duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none sm:w-24",
            `ls-mood-${cheering ? "cheer" : MOOD[step]}`,
          )}
          style={{ left: `${x(index)}%`, top: `calc(${stopY(index)}% - ${tablet ? 6.6 : 4.6}rem)` }}
        >
          <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
        </div>
        <button
          type="button"
          aria-label="Back to lessons"
          onClick={() => navigate("/student/learn")}
          className="absolute top-3 left-3 z-20 flex size-12 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-white text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2"
        >
          <House aria-hidden="true" className="size-6" />
        </button>
        <span className="absolute top-3 right-3 z-20 rounded-2xl bg-white/90 px-3 py-2 text-sm font-black text-[#4B4B4B]">
          {index + 1}/{prompts.length}
        </span>
      </section>

      <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-8 sm:pt-6">

        {checkpoint.isError && (
          <div role="status" aria-live="polite" className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <span className="min-w-0 flex-1">Your progress isn't saving right now. You can keep going — we'll keep trying.</span>
            <button type="button" onClick={() => checkpoint.reset()} className="shrink-0 text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* 1) small step label  2) the question, sign name highlighted once  3) the step's card */}
        <div key={`head-${index}-${step}`} className="ls-rise">
          <p className="flex items-center gap-2 text-sm font-extrabold tracking-wider text-[#6B6B6B] uppercase">
            <span aria-hidden="true" className={cn("flex size-8 items-center justify-center rounded-xl", meta.solid)}>
              <StepIcon className="size-4.5" />
            </span>
            Step {stepIndex + 1} · {meta.label}
          </p>
          <h1 className="mt-2 text-2xl leading-snug font-bold text-[#3C3C3C] sm:text-3xl">
            {meta.question[0]}
            <mark className="mx-1 rounded-lg bg-hudyat-gold/30 px-1.5 font-black text-[#3C3C3C] uppercase">{prompt.label}</mark>
            {meta.question[1]}
          </h1>
        </div>

        <div key={`${index}-${step}`} className="ls-rise mt-4">
          <StepCard step={step} prompt={prompt} title={title} color={color} onCorrect={next} whenVariant={whenVariant} />
        </div>
      </main>

      {/* BOTTOM BAR */}
      <nav
        aria-label="Lesson steps"
        className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t-4 border-hudyat-gold/30 bg-white/95 px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
          <ol className="relative flex flex-1 items-center justify-between px-1">
            <span aria-hidden="true" className="absolute inset-x-7 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#E5E5E5]" />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-7 h-1.5 -translate-y-1/2 rounded-full bg-hudyat-gold transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `calc((100% - 3.5rem) * ${stepIndex / (STEPS.length - 1)})` }}
            />
            {STEPS.map((item, position) => {
              const { icon: Icon, label, solid, ring } = STEP_META[item];
              const current = item === step;
              const done = position < stepIndex;
              return (
                <li key={item} className="relative">
                  <button
                    type="button"
                    aria-label={label}
                    aria-current={current ? "step" : undefined}
                    onClick={() => goTo(index, item)}
                    className={cn(
                      "flex size-13 items-center justify-center rounded-full border-4 border-white shadow-[0_4px_0_#0000001a] transition-transform focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none sm:size-15",
                      current ? cn(solid, "ls-pulse scale-110") : done ? "bg-hudyat-gold text-white" : "bg-[#F2F2F2] text-[#6B6B6B]",
                    )}
                    style={{ "--ring": `${ring}66` } as CSSProperties}
                  >
                    {done ? <Check aria-hidden="true" className="size-6" strokeWidth={3} /> : <Icon aria-hidden="true" className="size-6" />}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Back"
              disabled={index === 0 && step === "meaning"}
              onClick={back}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-[#F2F2F2] text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2 disabled:opacity-40"
            >
              <ArrowLeft aria-hidden="true" className="size-7" />
            </button>
            <ElevatedButton
              text={following ? "NEXT" : isLast ? "FINISH" : "NEXT SIGN"}
              icon={following || !isLast ? ArrowRight : Check}
              iconPosition="right"
              size="lg"
              className="min-h-14 flex-1 text-xl! font-black! sm:flex-none sm:px-8"
              onClick={next}
            />
          </div>
        </div>
      </nav>

      {whenVariant && (
        <div className="[&>div]:!bottom-[calc(10rem+env(safe-area-inset-bottom))] sm:[&>div]:!bottom-28">
          <PrototypeSwitcher variants={WHEN_VARIANTS} current={whenVariant} />
        </div>
      )}
    </div>
  );
}
