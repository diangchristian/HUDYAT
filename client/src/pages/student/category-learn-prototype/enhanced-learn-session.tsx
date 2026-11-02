// PROTOTYPE, delete me. The same 4-step lesson, enhanced for deaf elementary learners. Never saves progress.
import {CategoryDownload} from "@/features/fsl-recognition/category-download";
import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Hand,
  Lightbulb,
  MessageCircle,
  Quote,
  User,
} from "lucide-react";

import { useNavigate } from "react-router";

import type { LessonStep } from "@/api/learning-api";

import PracticeCamera from "./prototype-practice-camera";
import { categorySlug } from "@/lib/practice";
import PracticeReference from "@/components/common/practice-reference";
import ReferenceMedia from "@/components/common/reference-media";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";

import {
  practicePosition,
  type PracticePrompt,
} from "@/lib/practice";

type LessonPrompt = PracticePrompt & {
  modelClass: string;
  meaning?: string | null;
  whenToUse?: string | null;
};

const STEP_ORDER: LessonStep[] = [
  "meaning",
  "context",
  "how",
  "try",
];

const STEP_LABELS: Record<LessonStep, string> = {
  meaning: "Meaning",
  context: "When to Use",
  how: "How to Sign",
  try: "Try",
};

const STEP_ICONS: Record<LessonStep, typeof Hand> = {
  meaning: Lightbulb,
  context: MessageCircle,
  how: Hand,
  try: Camera,
};

export default function EnhancedLearnSession({
  title,
  prompts,
  initialGestureIndex,
  initialStep,
  onFinishLesson,
}: {
  title: string;
  prompts: LessonPrompt[];
  initialGestureIndex: number;
  initialStep: LessonStep | null;
  onFinishLesson: () => void;
}) {
  const navigate = useNavigate();

  const safeInitialIndex =
    prompts.length > 0
      ? Math.min(
          Math.max(initialGestureIndex, 0),
          prompts.length - 1,
        )
      : 0;

  const safeInitialStep: LessonStep =
    initialStep &&
    STEP_ORDER.includes(initialStep)
      ? initialStep
      : "meaning";

  const [index, setIndex] = useState(
    safeInitialIndex,
  );

  const [step, setStep] =
    useState<LessonStep>(
      safeInitialStep,
    );

  const prompt = prompts[index];

  if (!prompt) {
    return null;
  }

  const isLast =
    index === prompts.length - 1;

  const currentStepIndex =
    STEP_ORDER.indexOf(step);

  const CurrentStepIcon = STEP_ICONS[step];

  const continueLesson = async () => {
    const currentStepIndex =
      STEP_ORDER.indexOf(step);

    const nextStep =
      STEP_ORDER[currentStepIndex + 1];

    if (nextStep) {
      setStep(nextStep);

      return;
    }

    /*
     * Last sign: finish Learn and proceed to assessment.
     */
    if (isLast) {
      onFinishLesson();

      return;
    }

    /*
     * Move to the next sign.
     */
    const nextIndex = index + 1;

    setIndex(nextIndex);
    setStep("meaning");
  };

  const previousStep = async () => {
    const previousStep =
      STEP_ORDER[currentStepIndex - 1];

    if (previousStep) {
      setStep(previousStep);

      return;
    }

    if (index === 0) {
      return;
    }

    /*
     * Going back from Meaning moves to
     * the previous sign's Try step.
     */
    const previousIndex = index - 1;

    setIndex(previousIndex);
    setStep("try");
  };

  /*
   * All four lesson sections are accessible.
   *
   * The learner can freely switch between:
   * Meaning
   * When to Use
   * How to Sign
   * Try
   */
  const selectStep = async (
    selectedStep: LessonStep,
  ) => {
    setStep(selectedStep);
  };

  const meaningText =
    prompt.meaning ||
    `Learn what the Filipino Sign Language sign "${prompt.label}" means.`;

  const whenToUseText =
    prompt.whenToUse ||
    `Use "${prompt.label}" in a situation where this expression is appropriate.`;

  return (
    <>
      <CategoryDownload category={title.toLowerCase().replace(/\s+/g,"-")} />
      {/* HEADER */}
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <ElevatedButton
          text="BACK TO CATEGORIES"
          variant="secondary"
          size="sm"
          className="min-h-11"
          icon={ArrowLeft}
          onClick={() =>
            navigate("/student/learn")
          }
        />

        <h1 className="inline-flex min-h-8 max-w-full min-w-0 items-center truncate rounded-full bg-hudyat-gold px-5 py-2 text-sm font-extrabold uppercase text-primary-foreground">
          Learning: {title}
        </h1>
      </div>

      {/* SIGN PROGRESS */}
      <div className="mb-8 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Learning progress"
          aria-valuemin={0}
          aria-valuemax={prompts.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Sign ${index + 1} of ${prompts.length}`}
          className="h-5 min-w-0 flex-1 overflow-hidden rounded-full border border-hudyat-gold/20 bg-muted p-0.5"
        >
          <div
            className="h-full rounded-full bg-hudyat-gold shadow-sm transition-[width] motion-reduce:transition-none"
            style={{
              width: `${practicePosition(index, prompts.length)}%`,
            }}
          />
        </div>

        <p className="shrink-0 text-base font-extrabold">
          Sign {index + 1} of {prompts.length}
        </p>
      </div>

      {/* MAIN LESSON */}
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* LEFT SIDE: on phones this sits on top, so the steps are seen first */}
        <div className="min-w-0 space-y-4">
          {/* TARGET SIGN */}
          <Card className="relative flex min-h-24 flex-col items-center justify-center border-2 border-hudyat-gold/40 bg-accent/10 px-5 pt-6 pb-4 text-center md:min-h-44">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold px-5 py-1.5 text-sm font-extrabold text-primary-foreground">
              Target Sign
            </span>

            <h2
              aria-live="polite"
              aria-atomic="true"
              className={`max-w-full wrap-break-word font-extrabold leading-tight ${
                prompt.label.length <= 2
                  ? "text-6xl sm:text-7xl md:text-8xl"
                  : "text-3xl sm:text-4xl"
              }`}
            >
              {prompt.label}
            </h2>
          </Card>

          {/* LESSON STEPS */}
          <nav aria-label="Lesson steps">
            <ol className="grid grid-cols-4 gap-2 md:grid-cols-1">
              {STEP_ORDER.map((stepItem, stepIndex) => {
                const isCurrent = step === stepItem;
                const isCompleted = stepIndex < currentStepIndex;
                const StepIcon = isCompleted ? Check : STEP_ICONS[stepItem];

                return (
                  <li key={stepItem} className="relative">
                    {stepIndex < STEP_ORDER.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute top-full left-8.5 z-0 hidden h-2 w-1 md:block ${
                          isCompleted ? "bg-hudyat-gold" : "bg-border"
                        }`}
                      />
                    )}

                    <button
                      type="button"
                      aria-current={isCurrent ? "step" : undefined}
                      onClick={() => void selectStep(stepItem)}
                      className={`relative flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 py-2 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none md:min-h-16 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-left ${
                        isCurrent
                          ? "border-hudyat-gold bg-hudyat-gold/15"
                          : "border-transparent bg-card hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                          isCurrent
                            ? "bg-hudyat-gold text-primary-foreground"
                            : isCompleted
                              ? "bg-hudyat-gold/25 text-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <StepIcon
                          aria-hidden="true"
                          className="size-6"
                          strokeWidth={isCompleted ? 3 : 2}
                        />
                      </span>

                      <span className="min-w-0 text-sm leading-tight font-extrabold md:text-lg">
                        {STEP_LABELS[stepItem]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="min-w-0 space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
            <CurrentStepIcon
              aria-hidden="true"
              className="size-7 shrink-0 text-hudyat-gold sm:size-8"
            />
            {STEP_LABELS[step]}
          </h2>

          {/* CONTENT AREA */}
          {step === "meaning" || step === "context" ? (
            <div className="rounded-2xl border-2 border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3">
              <div className="flex min-h-60 w-full flex-col rounded-lg bg-gradient-to-br from-card to-muted/40 sm:min-h-56">
                {/* =========================
                    MEANING
                   ========================= */}
                {step === "meaning" && (
                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 p-5 sm:flex-row sm:gap-8 sm:p-8">
                    {/* The picture carries the meaning for children still learning to read. */}
                    {prompt.referenceImageUrl ? (
                      <ReferenceMedia
                        imageUrl={prompt.referenceImageUrl}
                        label={prompt.label}
                        className="max-w-xs shrink-0 bg-background shadow-card sm:w-2/5"
                      />
                    ) : (
                      <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-background shadow-card ring-1 ring-hudyat-gold/10">
                        <Lightbulb
                          aria-hidden="true"
                          className="size-9 text-hudyat-gold"
                        />
                      </div>
                    )}

                    <p className="min-w-0 text-xl leading-relaxed font-semibold text-foreground sm:text-2xl">
                      {meaningText}
                    </p>
                  </div>
                )}

                {/* =========================
                    WHEN TO USE
                   ========================= */}
                {step === "context" && (
                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 p-5 sm:p-8">
                    <div className="relative w-full max-w-2xl text-left">
                      <div className="relative overflow-hidden rounded-3xl border-2 border-hudyat-gold/30 bg-card px-6 py-6 shadow-card sm:px-8 sm:py-7">
                        <Quote
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-2 -right-2 size-20 text-hudyat-gold/10"
                        />

                        <p className="relative text-xl leading-relaxed font-semibold text-foreground sm:text-2xl">
                          {whenToUseText}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="absolute -bottom-2.5 left-10 size-5 rotate-45 rounded-sm border-r-2 border-b-2 border-hudyat-gold/30 bg-card"
                      />
                    </div>

                    <div
                      aria-hidden="true"
                      className="flex size-12 shrink-0 items-center justify-center self-start rounded-full bg-hudyat-gold/20 sm:ml-8"
                    >
                      <User className="size-6 text-hudyat-gold" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : step === "how" ? (
            /* =========================
               HOW TO SIGN
              ========================= */
            <PracticeReference
              key={`${title}-${prompt.label}`}
              prompt={prompt}
            />
          ) : (
            /* =========================
               TRY
              ========================= */
            <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={() => { void continueLesson(); }} />
          )}

          {/* NAVIGATION: stays on screen so the way forward is never hidden */}
          <div className="sticky bottom-0 z-10 flex gap-3 bg-background py-3">
            <ElevatedButton
              text="BACK"
              variant="secondary"
              icon={ArrowLeft}
              size="lg"
              className="min-h-14 shrink-0"
              disabled={index === 0 && step === "meaning"}
              onClick={() => void previousStep()}
            />

            <ElevatedButton
              text={isLast && step === "try" ? "FINISH LESSON" : "NEXT"}
              icon={isLast && step === "try" ? Check : ArrowRight}
              iconPosition="right"
              size="lg"
              className="min-h-14 min-w-0 flex-1 text-lg!"
              onClick={() => void continueLesson()}
            />
          </div>
        </div>
      </div>
    </>
  );
}
