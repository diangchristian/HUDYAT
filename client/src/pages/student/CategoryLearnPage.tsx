import { useState } from "react";

import {
  ArrowLeft,
  Camera,
  Check,
  Hand,
  Lightbulb,
  MessageCircle,
  Quote,
  RotateCcw,
  User,
} from "lucide-react";

import { useNavigate, useParams } from "react-router";

import type { LessonStep } from "@/api/learning-api";
import { useCategoryLesson } from "@/hooks/use-category-lesson";
import { useSaveLessonCheckpoint } from "@/hooks/use-save-lesson-checkpoint";

import PracticeCamera from "@/components/common/practice-camera";
import PracticeReference from "@/components/common/practice-reference";
import SessionHeader from "@/components/common/session-header";
import LoadingScreen from "@/components/common/loading-screen";
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

const LESSON_TO_ASSESSMENT_TRANSITION_MS = 1400;

function LearnSession({
  categoryId,
  title,
  prompts,
  initialGestureIndex,
  initialStep,
  onFinishLesson,
}: {
  categoryId: string;
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

  const checkpointMutation =
    useSaveLessonCheckpoint(categoryId);

  const prompt = prompts[index];

  if (!prompt) {
    return null;
  }

  const isLast =
    index === prompts.length - 1;

  const currentStepIndex =
    STEP_ORDER.indexOf(step);

  const saveCheckpoint = async (
    gestureIndex: number,
    lessonStep: LessonStep,
  ) => {
    try {
      await checkpointMutation.mutateAsync({
        gestureIndex,
        lessonStep,
      });
    } catch {
      /*
       * The lesson can continue even if checkpoint
       * saving fails — checkpointMutation.isError
       * drives a banner the learner can see below.
       */
    }
  };

  const continueLesson = async () => {
    const currentStepIndex =
      STEP_ORDER.indexOf(step);

    const nextStep =
      STEP_ORDER[currentStepIndex + 1];

    /*
     * Continue is only shown on the TRY step,
     * so normally nextStep will not exist here.
     *
     * This keeps the function safe if it is
     * called from another place later.
     */
    if (nextStep) {
      setStep(nextStep);

      await saveCheckpoint(
        index,
        nextStep,
      );

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

    await saveCheckpoint(
      nextIndex,
      "meaning",
    );
  };

  const previousStep = async () => {
    const previousStep =
      STEP_ORDER[currentStepIndex - 1];

    if (previousStep) {
      setStep(previousStep);

      await saveCheckpoint(
        index,
        previousStep,
      );

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

    await saveCheckpoint(
      previousIndex,
      "try",
    );
  };

  /*
   * All four lesson sections are accessible.
   *
   * The learner can freely switch between:
   * Meaning
   * When to Use
   * How to Sign
   * Try
   *
   * Continue still only appears on Try.
   */
  const selectStep = async (
    selectedStep: LessonStep,
  ) => {
    setStep(selectedStep);

    await saveCheckpoint(
      index,
      selectedStep,
    );
  };

  const meaningText =
    prompt.meaning ||
    `Learn what the Filipino Sign Language sign "${prompt.label}" means.`;

  const whenToUseText =
    prompt.whenToUse ||
    `Use "${prompt.label}" in a situation where this expression is appropriate.`;

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <ElevatedButton
          text="BACK TO CATEGORIES"
          variant="secondary"
          size="sm"
          className="min-h-11 sm:min-h-8"
          icon={ArrowLeft}
          onClick={() =>
            navigate("/student/learn")
          }
        />

        <h1 className="inline-flex min-h-8 max-w-full min-w-0 items-center truncate rounded-full bg-hudyat-gold px-5 py-2 text-xs font-extrabold uppercase text-primary-foreground">
          Learning: {title}
        </h1>
      </div>

      {/* CHECKPOINT SAVE FAILURE */}
      {checkpointMutation.isError && (
        <Card
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center justify-between gap-3 border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          <span className="min-w-0 flex-1">
            Your progress isn't saving right now.
            You can keep going — we'll keep trying.
          </span>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => checkpointMutation.reset()}
            className="shrink-0 text-xs font-bold underline"
          >
            Dismiss
          </button>
        </Card>
      )}

      {/* MAIN LESSON */}
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* LEFT SIDE */}
        <div className="order-2 space-y-4 md:order-none md:col-start-1">
          {/* TARGET SIGN */}
          <Card className="relative flex min-h-44 flex-col items-center justify-center border-hudyat-gold/30 bg-accent/10 px-5 py-6 text-center">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold/75 px-6 py-1.5 text-xs font-extrabold text-primary-foreground">
              Target Sign
            </span>

            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
              <Hand
                aria-hidden="true"
                className="size-5"
              />
            </div>

            <h2
              aria-live="polite"
              aria-atomic="true"
              className={`max-w-full wrap-break-word font-bold leading-tight ${
                prompt.label.length <= 2
                  ? "text-6xl sm:text-7xl md:text-8xl"
                  : "text-3xl sm:text-4xl"
              }`}
            >
              {prompt.label}
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Learn this sign before you
              try making it.
            </p>
          </Card>

          {/* LESSON STEPS */}
          <Card className="space-y-2 p-4 sm:p-5">
            {STEP_ORDER.map(
              (stepItem) => {
                const isCurrent =
                  step === stepItem;

                const stepIndex =
                  STEP_ORDER.indexOf(
                    stepItem,
                  );

                const isCompleted =
                  stepIndex <
                  currentStepIndex;

                const StepIcon =
                  stepItem === "meaning"
                    ? Lightbulb
                    : stepItem === "context"
                      ? MessageCircle
                      : stepItem === "how"
                        ? Hand
                        : Camera;

                return (
                  <button
                    key={stepItem}
                    type="button"
                    onClick={() =>
                      void selectStep(
                        stepItem,
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isCurrent
                        ? "bg-hudyat-gold/15 text-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <StepIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-hudyat-gold"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold">
                        {
                          STEP_LABELS[
                            stepItem
                          ]
                        }
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {stepItem ===
                        "meaning"
                          ? "What does it mean?"
                          : stepItem ===
                              "context"
                            ? "See it in context."
                            : stepItem ===
                                "how"
                              ? "Watch the FSL sign."
                              : "Make the sign."}
                      </p>
                    </div>

                    {isCompleted && (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-hudyat-gold"
                      />
                    )}
                  </button>
                );
              },
            )}
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="order-1 min-w-0 space-y-4 md:order-none md:col-start-2">
          {/* CONTENT AREA */}
          {step === "meaning" || step === "context" ? (
            <div className="rounded-2xl border-2 border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3">
              <div className="flex min-h-60 w-full flex-col rounded-lg bg-gradient-to-br from-card to-muted/40 sm:min-h-56">
                {/* =========================
                    MEANING
                   ========================= */}
                {step === "meaning" && (
                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 p-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:p-8 sm:text-left">
                    <div className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-hudyat-gold/40 via-hudyat-gold/15 to-transparent p-1.5 shadow-card">
                      <div className="flex size-16 items-center justify-center rounded-full bg-background ring-1 ring-hudyat-gold/10 sm:size-20">
                        <Lightbulb
                          aria-hidden="true"
                          className="size-8 text-hudyat-gold sm:size-9"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 max-w-xl">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-hudyat-gold/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-hudyat-gold">
                        Meaning
                      </span>

                      <h2 className="mt-3 wrap-break-word text-2xl font-extrabold text-foreground sm:text-3xl">
                        {prompt.label}
                      </h2>

                      <p className="mt-3 border-l-4 border-hudyat-gold/30 pl-4 text-left text-base leading-relaxed text-foreground/80 sm:text-lg">
                        {meaningText}
                      </p>
                    </div>
                  </div>
                )}

                {/* =========================
                    WHEN TO USE
                   ========================= */}
                {step === "context" && (
                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 p-6 text-center sm:gap-6 sm:p-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-hudyat-gold/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-hudyat-gold">
                      <MessageCircle
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      When to Use
                    </span>

                    <div className="relative w-full max-w-2xl text-left">
                      <div className="relative overflow-hidden rounded-3xl border border-hudyat-gold/20 bg-card px-6 py-6 shadow-card sm:px-8 sm:py-7">
                        <Quote
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-2 -right-2 size-20 text-hudyat-gold/10"
                        />

                        <p className="relative mb-2 text-xs font-extrabold uppercase tracking-[0.15em] text-hudyat-gold/70">
                          Example
                        </p>

                        <p className="relative text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                          <span
                            aria-hidden="true"
                            className="mr-1 text-2xl font-black text-hudyat-gold/60"
                          >
                            &#8220;
                          </span>
                          {whenToUseText}
                          <span
                            aria-hidden="true"
                            className="ml-1 text-2xl font-black text-hudyat-gold/60"
                          >
                            &#8221;
                          </span>
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="absolute -bottom-2.5 left-10 size-5 rotate-45 rounded-sm border-r border-b border-hudyat-gold/20 bg-card"
                      />
                    </div>

                    <div className="flex items-center gap-2 pl-2 sm:ml-10 sm:self-start">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/20">
                        <User
                          aria-hidden="true"
                          className="size-3.5 text-hudyat-gold"
                        />
                      </div>

                      <p className="text-xs font-semibold text-muted-foreground">
                        Someone using &#8220;{prompt.label}&#8221; in
                        conversation
                      </p>
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
            <PracticeCamera />
          )}

          {/* NAVIGATION / CONTINUE */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* CONTINUE ONLY APPEARS ON TRY */}
            {step === "try" && (
              <div className="flex w-full justify-center">
                <ElevatedButton
                  text={
                    isLast
                      ? "FINISH LESSON"
                      : "CONTINUE"
                  }
                  icon={Check}
                  iconPosition="right"
                  className="min-h-11 w-full max-w-sm sm:min-h-10"
                  onClick={() =>
                    void continueLesson()
                  }
                />
              </div>
            )}

            {/* PREVIOUS + PROGRESS */}
            <div className="flex items-center gap-3 sm:gap-5">
              <ElevatedButton
                text=""
                aria-label="Previous step"
                title="Previous step"
                variant="secondary"
                icon={ArrowLeft}
                size="sm"
                className="h-11 w-12 shrink-0 px-0 sm:h-9"
                disabled={
                  index === 0 &&
                  step === "meaning"
                }
                onClick={() =>
                  void previousStep()
                }
              />

              <div className="min-w-0 flex-1">
                <div
                  role="progressbar"
                  aria-label="Learning progress"
                  aria-valuemin={0}
                  aria-valuemax={
                    prompts.length
                  }
                  aria-valuenow={
                    index + 1
                  }
                  aria-valuetext={`Sign ${
                    index + 1
                  } of ${
                    prompts.length
                  }`}
                  className="h-5 overflow-hidden rounded-full border border-hudyat-gold/20 bg-muted p-0.5"
                >
                  <div
                    className="h-full rounded-full bg-hudyat-gold shadow-sm transition-[width] motion-reduce:transition-none"
                    style={{
                      width: `${practicePosition(
                        index,
                        prompts.length,
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Sign {index + 1} of{" "}
                  {prompts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CategoryLearnPage() {
  const { categoryId } = useParams();

  const navigate = useNavigate();

  const [isFinishingLesson, setIsFinishingLesson] =
    useState(false);

  const {
    data: lesson,
    isLoading,
    error,
    refetch,
  } = useCategoryLesson(categoryId);

  const handleFinishLesson = () => {
    setIsFinishingLesson(true);

    setTimeout(() => {
      navigate(
        `/student/assessment/${categoryId}`,
      );
    }, LESSON_TO_ASSESSMENT_TRANSITION_MS);
  };

  if (isFinishingLesson) {
    return <LoadingScreen />;
  }

  const prompts: LessonPrompt[] =
    lesson?.categoryGestures.map(
      (item) => ({
        label: item.gesture.label,

        modelClass:
          item.gesture.modelClass,

        meaning:
          item.gesture.meaning ??
          undefined,

        whenToUse:
          item.exampleUsage ??
          undefined,

        referenceImageUrl:
          item.gesture
            .referenceImageUrl ??
          undefined,

        referenceVideoUrl:
          item.gesture
            .referenceVideoUrl ??
          undefined,
      }),
    ) ?? [];

  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader
        backTo="/student/learn"
        backLabel="Hudyat — back to learning categories"
      />

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {isLoading ? (
          <p
            className="py-12 text-center text-sm text-muted-foreground"
            role="status"
          >
            Loading this lesson...
          </p>
        ) : error || !categoryId ? (
          <div className="py-12 text-center">
            <p
              className="text-sm font-bold text-destructive"
              role="alert"
            >
              {error instanceof Error
                ? error.message
                : !categoryId
                  ? "Category not found."
                  : "We couldn't load this lesson right now."}
            </p>

            {categoryId && error && (
              <ElevatedButton
                text="TRY AGAIN"
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                className="mt-4 min-h-9"
                onClick={() => void refetch()}
              />
            )}
          </div>
        ) : lesson?.category &&
          prompts.length ? (
          <LearnSession
            key={lesson.category.id}
            categoryId={
              lesson.category.id
            }
            title={
              lesson.category.name
            }
            prompts={prompts}
            initialGestureIndex={
              lesson.progress
                .lastGestureIndex
            }
            initialStep={
              lesson.progress
                .lastLessonStep
            }
            onFinishLesson={
              handleFinishLesson
            }
          />
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">
              Category not found
            </h1>

            <p className="my-4 text-muted-foreground">
              Choose an available
              category to start
              learning.
            </p>

            <ElevatedButton
              text="BACK TO LEARN"
              variant="secondary"
              className="min-h-11"
              onClick={() =>
                navigate(
                  "/student/learn",
                )
              }
            />
          </Card>
        )}
      </main>
    </div>
  );
}