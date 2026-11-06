/*
 * One card per lesson step, each with its own look so young deaf readers can
 * tell them apart and enjoy reading:
 *   Meaning     → notebook word card, sign photo taped on, tap-a-word reading aid
 *   When to Use → comic panel, the lesson character says it in a speech bubble
 *   How to Sign → TV frame with big Again / Slow buttons
 *   Try         → practice camera with a "Copy this" photo pinned on
 * The sign's name is highlighted wherever it appears in the text.
 */
import { useRef, useState } from "react";
import { RotateCcw, Snail } from "lucide-react";

import type { LessonStep } from "@/api/learning-api";
import type { CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import PracticeCamera from "@/components/common/practice-camera";
import ReferenceMedia from "@/components/common/reference-media";
import { readingParts, signMeaningText, signWhenToUseText } from "@/lib/lesson-text";
import { categorySlug } from "@/lib/practice";
import { cn } from "@/lib/utils";

import type { LessonPrompt } from "./learn-session";

type CardProps = { prompt: LessonPrompt; title: string; color: CategoryColor; onCorrect: () => void };

// Tapping a word lights it up, like pointing a finger while reading.
function ReadingText({ text, label }: { text: string; label: string }) {
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  return (
    <p className="text-xl leading-[1.9] font-semibold text-[#3C3C3C] sm:text-2xl">
      {readingParts(text, label).map((part, i) =>
        part.kind === "space" ? (
          part.text
        ) : (
          <span
            key={i}
            onClick={() => setLit((prev) => new Set(prev).add(i))}
            className={cn(
              "cursor-pointer rounded-md px-0.5 transition-colors duration-200",
              part.kind === "sign" ? "bg-hudyat-gold/35 font-black uppercase" : lit.has(i) && "bg-[#FFE58A]",
            )}
          >
            {part.text}
          </span>
        ),
      )}
    </p>
  );
}

function MeaningCard({ prompt }: CardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-[#FBBF24] bg-white shadow-[0_6px_0_#0000001a]">
      <div
        className="relative py-5 pr-5 pl-9 sm:pl-12"
        style={{
          backgroundImage: "repeating-linear-gradient(transparent 0 calc(1.9em - 2px), #DCEBFA calc(1.9em - 2px) 1.9em)",
          backgroundPositionY: "1.25rem",
        }}
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-5 w-0.5 bg-[#FCA5A5] sm:left-8" />
        {prompt.referenceImageUrl && (
          <figure className="relative float-right mb-2 ml-3 w-28 rotate-3 rounded-lg bg-white p-1.5 pb-3 shadow-[0_4px_10px_#0000002a] sm:w-36">
            <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 bg-[#FDE68A]/80" />
            <ReferenceMedia imageUrl={prompt.referenceImageUrl} label={prompt.label} className="aspect-square rounded" />
          </figure>
        )}
        <ReadingText text={signMeaningText(prompt.label, prompt.meaning)} label={prompt.label} />
      </div>
      <p className="border-t-2 border-dashed border-[#FDE68A] bg-[#FFFBEB] px-5 py-2 text-sm font-bold text-[#92700C]">
        Tap the words as you read them
      </p>
    </div>
  );
}

function ContextCard({ prompt, title, color }: CardProps) {
  return (
    <div
      className="rounded-3xl border-4 border-[#0284C7] bg-[#E0F2FE] p-4 shadow-[0_6px_0_#0000001a] sm:p-5"
      style={{ backgroundImage: "radial-gradient(#0284C722 1.5px, transparent 2px)", backgroundSize: "14px 14px" }}
    >
      <div className="flex items-end gap-2 sm:gap-4">
        <div aria-hidden="true" className="ls-mood-talk w-20 shrink-0 sm:w-28">
          <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
        </div>
        <div className="relative mb-6 flex-1 rounded-[1.75rem] border-[3px] border-[#3C3C3C] bg-white p-4 sm:p-5">
          <span aria-hidden="true" className="absolute -bottom-[11px] left-4 size-5 rotate-45 border-r-[3px] border-b-[3px] border-[#3C3C3C] bg-white" />
          <ReadingText text={signWhenToUseText(prompt.label, prompt.whenToUse)} label={prompt.label} />
        </div>
      </div>
    </div>
  );
}

export function HowCard({ prompt }: Pick<CardProps, "prompt">) {
  const video = useRef<HTMLVideoElement>(null);
  const [slow, setSlow] = useState(false);
  const again = () => {
    if (!video.current) return;
    video.current.currentTime = 0;
    void video.current.play();
  };
  const toggleSlow = () => {
    setSlow(!slow);
    if (video.current) video.current.playbackRate = slow ? 1 : 0.5;
  };
  const control =
    "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-b-4 text-lg font-black active:translate-y-0.5 active:border-b-2";
  return (
    <div className="rounded-[2rem] border-4 border-[#059669] bg-[#064E3B] p-2.5 pb-3 shadow-[0_6px_0_#0000001a]">
      <div className="overflow-hidden rounded-3xl bg-black">
        <ReferenceMedia
          key={prompt.label}
          videoRef={video}
          videoUrl={prompt.referenceVideoUrl}
          imageUrl={prompt.referenceImageUrl}
          label={prompt.label}
          className="max-h-[calc(100dvh-30rem)] min-h-48"
        />
      </div>
      {prompt.referenceVideoUrl && (
        <div className="mt-3 flex gap-2 px-1">
          <button type="button" onClick={again} className={cn(control, "border-[#CECECE] bg-white text-[#064E3B]")}>
            <RotateCcw aria-hidden="true" className="size-6" /> Again
          </button>
          <button
            type="button"
            aria-pressed={slow}
            onClick={toggleSlow}
            className={cn(control, slow ? "border-[#B45309] bg-[#FBBF24] text-[#3C3C3C]" : "border-[#CECECE] bg-white text-[#064E3B]")}
          >
            <Snail aria-hidden="true" className="size-6" /> {slow ? "Slow: on" : "Slow"}
          </button>
        </div>
      )}
    </div>
  );
}

function TryCard({ prompt, title, onCorrect }: CardProps) {
  return (
    <div className="relative rounded-3xl border-4 border-[#E11D48] bg-white p-2 shadow-[0_6px_0_#0000001a] sm:p-3">
      {prompt.referenceImageUrl && (
        <figure className="absolute -top-5 right-3 z-10 w-20 -rotate-6 rounded-xl bg-white p-1 pb-1.5 text-center shadow-[0_4px_10px_#0000002a] sm:w-24">
          <ReferenceMedia imageUrl={prompt.referenceImageUrl} label={prompt.label} className="aspect-square rounded-lg" />
          <figcaption className="mt-0.5 text-xs font-black text-[#E11D48] uppercase">Copy this</figcaption>
        </figure>
      )}
      <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={onCorrect} />
    </div>
  );
}

const CARDS = { meaning: MeaningCard, context: ContextCard, how: HowCard, try: TryCard } satisfies Record<
  LessonStep,
  (props: CardProps) => React.ReactNode
>;

export default function StepCard({ step, ...props }: CardProps & { step: LessonStep }) {
  const Card = CARDS[step];
  return <Card {...props} />;
}
