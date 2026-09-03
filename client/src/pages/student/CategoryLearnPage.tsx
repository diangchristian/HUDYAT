import { useState } from "react";

import {
  ArrowLeft,
  Camera,
  Check,
  Hand,
  Lightbulb,
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
  const [isTrying, setIsTrying] = useState(false);

  const prompt = prompts[index];
  const isLast = index === prompts.length - 1;

  const continueLesson = () => {
    setIsTrying(false);

    if (isLast) {
      setComplete(true);
      return;
    }

    setIndex((current) => current + 1);
  };

  const previousStep = () => {
    if (index === 0) {
      setComplete(false);
      setIsTrying(false);
      return;
    }

    setIndex((current) => current - 1);
    setIsTrying(false);
  };

  const meaningText = `Learn the Filipino Sign Language sign for "${prompt.label}".`;

  const howToMakeText =
    prompt.instruction ||
    "Follow the hand position and movement shown in the reference.";

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
          You finished learning all the signs in <strong>{title}</strong>.
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
        {/* LEFT: SIGN INFORMATION */}
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

          <Card className="space-y-3 p-4 sm:p-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Lightbulb
                  aria-hidden="true"
                  className="size-4 text-hudyat-gold"
                />
                What does it mean?
              </p>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {meaningText}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Hand
                  aria-hidden="true"
                  className="size-4 text-hudyat-gold"
                />
                How do I make it?
              </p>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {howToMakeText}
              </p>
            </div>
          </Card>
        </div>

        {/* RIGHT: REFERENCE / CAMERA */}
        <div className={`min-w-0 space-y-4 ${isTrying ? "[&>div:first-child>p]:hidden" : ""}`}>
          {isTrying ? (
            <PracticeCamera />
          ) : (
            <PracticeReference
              key={`${title}-${prompt.label}`}
              prompt={prompt}
            />
          )}

          <div className="flex justify-center">
            {isTrying ? (
              <ElevatedButton
                text="CONTINUE"
                icon={Check}
                iconPosition="right"
                className="w-full min-h-10 max-w-sm"
                onClick={continueLesson}
              />
            ) : (
              <ElevatedButton
                text="TRY THIS SIGN"
                icon={Camera}
                className="w-full min-h-10 max-w-sm"
                onClick={() => setIsTrying(true)}
              />
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <ElevatedButton
              text=""
              aria-label="Previous sign"
              title="Previous sign"
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