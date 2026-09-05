import { useState } from "react";

import {
  ArrowLeft,
  Camera,
  Check,
  Hand,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { CATEGORIES } from "@/components/common/categories.constants";
import PracticeCamera from "@/components/common/practice-camera";
import PracticeReference from "@/components/common/practice-reference";
import SessionHeader from "@/components/common/session-header";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import {
  categorySlug,
  PRACTICE_PROMPTS,
  practicePosition,
  type PracticePrompt,
} from "@/lib/practice";

type LessonStep = "meaning" | "context" | "how" | "try";

type ExtendedPracticePrompt = PracticePrompt & {
  meaning?: string;
  whenToUse?: string;
  contextImageUrl?: string;
  howToUse?: string;
};

function LearnSession({
  title,
  prompts,
}: {
  title: string;
  prompts: PracticePrompt[];
}) {
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [step, setStep] = useState<LessonStep>("meaning");

  const prompt = prompts[index] as ExtendedPracticePrompt;
  const isLast = index === prompts.length - 1;

  const continueLesson = () => {
    if (step !== "try") {
      if (step === "meaning") {
        setStep("context");
      } else if (step === "context") {
        setStep("how");
      } else if (step === "how") {
        setStep("try");
      }

      return;
    }

    if (isLast) {
      setComplete(true);
      return;
    }

    setIndex((current) => current + 1);
    setStep("meaning");
  };

  const previousStep = () => {
    if (step === "try") {
      setStep("how");
      return;
    }

    if (step === "how") {
      setStep("context");
      return;
    }

    if (step === "context") {
      setStep("meaning");
      return;
    }

    if (index === 0) {
      setComplete(false);
      return;
    }

    setIndex((current) => current - 1);
    setStep("meaning");
  };

  const meaningText =
    prompt.meaning ||
    `Learn what the Filipino Sign Language sign "${prompt.label}" means.`;

  const whenToUseText =
    prompt.whenToUse ||
    prompt.exampleUsage ||
    `Use "${prompt.label}" in a situation where this expression is appropriate.`;

  const howToUseText =
    prompt.howToUse ||
    prompt.instruction ||
    "Watch the reference and follow the hand position and movement.";

  if (complete) {
    return (
      <Card
        className="mx-auto mt-12 max-w-lg border-hudyat-gold/40 bg-accent/20 p-8 text-center"
        role="status"
      >
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-hudyat-gold/20">
          <Sparkles
            aria-hidden="true"
            className="size-9 text-hudyat-gold"
          />
        </div>

        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-hudyat-gold">
          Great job!
        </p>

        <h1 className="mt-2 text-2xl font-extrabold">
          Lesson Complete!
        </h1>

        <p className="mt-3 text-muted-foreground">
          You finished learning all the signs in{" "}
          <strong>{title}</strong>.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <ElevatedButton
            text="PRACTICE NOW"
            className="min-h-11"
            onClick={() =>
              navigate(`/student/practice/${categorySlug(title)}`)
            }
          />

          <ElevatedButton
            text="BACK TO LEARN"
            variant="secondary"
            className="min-h-11"
            onClick={() => navigate("/student/learn")}
          />
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <ElevatedButton
          text="BACK TO CATEGORIES"
          variant="secondary"
          size="sm"
          className="min-h-11 sm:min-h-8"
          icon={ArrowLeft}
          onClick={() => navigate("/student/learn")}
        />

        <h1 className="inline-flex min-h-8 items-center rounded-full bg-hudyat-gold px-5 py-2 text-xs font-extrabold uppercase text-primary-foreground">
          Learning: {title}
        </h1>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">

        {/* ==========================================
            LEFT: CONSISTENT SIGN INFORMATION
        ========================================== */}
        <div className="space-y-4">
          <Card className="relative flex min-h-44 flex-col items-center justify-center border-hudyat-gold/30 bg-accent/10 px-5 py-6 text-center">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold/75 px-6 py-1.5 text-xs font-extrabold text-primary-foreground">
              Target Sign
            </span>

            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
              <Hand aria-hidden="true" className="size-5" />
            </div>

            <h2
              aria-live="polite"
              aria-atomic="true"
              className={`max-w-full break-words font-bold leading-tight ${
                prompt.label.length <= 2
                  ? "text-8xl"
                  : "text-3xl sm:text-4xl"
              }`}
            >
              {prompt.label}
            </h2>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Learn this sign before you try making it.
            </p>
          </Card>

          {/* LEARNING NAVIGATION */}
          <Card className="space-y-2 p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setStep("meaning")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                step === "meaning"
                  ? "bg-hudyat-gold/15 text-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Lightbulb className="size-5 shrink-0 text-hudyat-gold" />

              <div>
                <p className="text-sm font-extrabold">
                  Meaning
                </p>
                <p className="text-xs text-muted-foreground">
                  What does it mean?
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep("context")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                step === "context"
                  ? "bg-hudyat-gold/15 text-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <MessageCircle className="size-5 shrink-0 text-hudyat-gold" />

              <div>
                <p className="text-sm font-extrabold">
                  When to Use
                </p>
                <p className="text-xs text-muted-foreground">
                  See it in context.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep("how")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                step === "how"
                  ? "bg-hudyat-gold/15 text-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Hand className="size-5 shrink-0 text-hudyat-gold" />

              <div>
                <p className="text-sm font-extrabold">
                  How to Sign
                </p>
                <p className="text-xs text-muted-foreground">
                  Watch the FSL sign.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep("try")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                step === "try"
                  ? "bg-hudyat-gold/15 text-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Camera className="size-5 shrink-0 text-hudyat-gold" />

              <div>
                <p className="text-sm font-extrabold">
                  Try
                </p>
                <p className="text-xs text-muted-foreground">
                  Make the sign.
                </p>
              </div>
            </button>
          </Card>
        </div>

        {/* ==========================================
            RIGHT: MULTIPURPOSE LEARNING BOX
        ========================================== */}
        <div className="min-w-0">
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted sm:min-h-56">
                {/* ------------------------------------------
                    MEANING
                ------------------------------------------ */}
                {step === "meaning" && (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-hudyat-gold/15">
                      <Lightbulb className="size-6 text-hudyat-gold" />
                    </div>

                    <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-hudyat-gold">
                      Meaning
                    </p>

                    <h2 className="mt-3 text-3xl font-extrabold">
                      {prompt.label}
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {meaningText}
                    </p>
                  </div>
                )}

                {/* ------------------------------------------
                    CONTEXT / WHEN TO USE
                ------------------------------------------ */}
                {step === "context" && (
                  <div className="h-full w-full p-3">
                    <div className="mb-4 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-hudyat-gold">
                        When to Use
                      </p>

                      <h2 className="mt-2 text-2xl font-extrabold">
                        See it in context
                      </h2>
                    </div>

                    {prompt.contextImageUrl ? (
                      <div className="overflow-hidden rounded-2xl bg-muted">
                        <img
                          src={prompt.contextImageUrl}
                          alt={`Context for the sign ${prompt.label}`}
                          className="mx-auto aspect-video w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted/60 px-8 text-center">
                        <div>
                          <MessageCircle className="mx-auto mb-4 size-12 text-hudyat-gold" />

                          <p className="text-lg font-bold">
                            {whenToUseText}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
                      {whenToUseText}
                    </p>
                  </div>
                )}

                {/* ------------------------------------------
                    HOW TO SIGN
                ------------------------------------------ */}
                {step === "how" && (
                  <PracticeReference
                    key={`${title}-${prompt.label}`}
                    prompt={prompt}
                  />
                )}

                {/* ------------------------------------------
                    TRY / CAMERA
                ------------------------------------------ */}
                {step === "try" && (
                  <PracticeCamera />
                )}
              </div>
            </div>

            <div className="relative mt-28">
              {step === "try" && (
                <div className="absolute bottom-full left-0 mb-1 flex w-full justify-center translate-y-8">
                  <ElevatedButton
                    text={isLast ? "FINISH LESSON" : "CONTINUE"}
                    icon={Check}
                    iconPosition="right"
                    className="min-h-10 w-full max-w-sm"
                    onClick={continueLesson}
                  />
                </div>
              )}

              {/* ------------------------------------------
                  PREVIOUS + PROGRESS
              ------------------------------------------ */}
              <div className="relative top-10 flex items-center gap-3 sm:gap-5">
                <ElevatedButton
                  text=""
                  aria-label="Previous step"
                  title="Previous step"
                  variant="secondary"
                  icon={ArrowLeft}
                  size="sm"
                  className="h-11 w-12 shrink-0 px-0 sm:h-9"
                  onClick={previousStep}
                />

                <div className="min-w-0 flex-1">
                  <div
                    role="progressbar"
                    aria-label="Learning progress"
                    aria-valuemin={0}
                    aria-valuemax={prompts.length}
                    aria-valuenow={index + 1}
                    aria-valuetext={`Sign ${index + 1} of ${prompts.length}`}
                    className="h-5 overflow-hidden rounded-full border border-hudyat-gold/20 bg-muted p-0.5"
                  >
                    <div
                      className="h-full rounded-full bg-hudyat-gold shadow-sm transition-[width] motion-reduce:transition-none"
                      style={{
                        width: `${practicePosition(index, prompts.length)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Sign {index + 1} of {prompts.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CategoryLearnPage() {
  const { category: slug } = useParams();
  const navigate = useNavigate();

  const category = CATEGORIES.find(
    (item) => categorySlug(item.title) === slug,
  );

  const prompts =
    category && slug ? PRACTICE_PROMPTS[slug] : undefined;

  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader />

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {category && prompts?.length ? (
          <LearnSession
            key={slug}
            title={category.title}
            prompts={prompts}
          />
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">
              Category not found
            </h1>

            <p className="my-4 text-muted-foreground">
              Choose an available category to start learning.
            </p>

            <ElevatedButton
              text="BACK TO LEARN"
              variant="secondary"
              className="min-h-11"
              onClick={() => navigate("/student/learn")}
            />
          </Card>
        )}
      </main>
    </div>
  );
}