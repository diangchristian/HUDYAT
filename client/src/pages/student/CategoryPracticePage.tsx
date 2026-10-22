import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Hand, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import SessionHeader from "@/components/common/session-header";
import PracticeCamera from "@/components/common/practice-camera";
import ReferenceMedia from "@/components/common/reference-media";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { CategoryDownload } from "@/features/fsl-recognition/category-download";
import { usePreloadRecognition } from "@/features/fsl-recognition/preload";
import { useCategoryLesson } from "@/hooks/use-category-lesson";
import { useLearningAreas } from "@/hooks/use-learning-areas";
import { categorySlug, practicePosition, type PracticePrompt } from "@/lib/practice";

type PracticeSign = PracticePrompt & { modelClass: string };

function PracticeSession({ title, prompts }: { title: string; prompts: PracticeSign[] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prompt = prompts[index]!;
  const isLast = index === prompts.length - 1;
  usePreloadRecognition(categorySlug(title));

  const goTo = (next: number) => {
    setIndex(next);
    headingRef.current?.focus();
  };
  const advance = () => {
    if (isLast) setComplete(true);
    else goTo(index + 1);
  };
  const restart = () => {
    setComplete(false);
    goTo(0);
  };

  if (complete) {
    return (
      <Card className="mx-auto mt-12 max-w-lg border-hudyat-gold/30 bg-accent/10 p-8 text-center" role="status">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
          <Check aria-hidden="true" className="size-7" />
        </div>
        <h1 className="text-2xl font-extrabold">Practice round complete!</h1>
        <p className="mt-3 text-muted-foreground">You practiced all {prompts.length} {title.toLowerCase()} signs.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <ElevatedButton text="PRACTICE AGAIN" icon={RotateCcw} className="min-h-11" onClick={restart} />
          <ElevatedButton text="BACK TO CATEGORIES" variant="secondary" className="min-h-11" onClick={() => navigate("/student/practice")} />
        </div>
      </Card>
    );
  }

  return (
    <>
      <CategoryDownload category={categorySlug(title)} />
      {/* HEADER */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <ElevatedButton
          text="BACK TO CATEGORIES"
          variant="secondary"
          size="sm"
          className="min-h-11 sm:min-h-8"
          icon={ArrowLeft}
          onClick={() => navigate("/student/practice")}
        />
        <h1 className="inline-flex min-h-8 max-w-full min-w-0 items-center truncate rounded-full bg-hudyat-gold px-5 py-2 text-xs font-extrabold uppercase text-primary-foreground">
          Practicing: {title}
        </h1>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* LEFT SIDE */}
        <div className="order-2 space-y-4 md:order-none md:col-start-1">
          {/* TARGET SIGN */}
          <Card className="relative flex min-h-44 flex-col items-center justify-center border-hudyat-gold/30 bg-accent/10 px-5 py-6 text-center">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold/75 px-6 py-1.5 text-xs font-extrabold text-primary-foreground">
              Target Sign
            </span>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-hudyat-gold/20 text-hudyat-gold">
              <Hand aria-hidden="true" className="size-5" />
            </div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              aria-live="polite"
              aria-atomic="true"
              className={`max-w-full wrap-break-word font-bold leading-tight outline-none ${
                prompt.label.length <= 2 ? "text-6xl sm:text-7xl md:text-8xl" : "text-3xl sm:text-4xl"
              }`}
            >
              {prompt.label}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Make this sign. The reference below shows how.
            </p>
          </Card>

          {/* SIGN REFERENCE (a placeholder until the sign has a picture or video) */}
          <Card className="relative border-hudyat-gold/30 bg-accent/10 px-3 pt-7 pb-3">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold/75 px-6 py-1.5 text-xs font-extrabold text-primary-foreground">
              Sign Reference
            </span>
            <ReferenceMedia
              key={`${title}-${prompt.label}`}
              videoUrl={prompt.referenceVideoUrl}
              imageUrl={prompt.referenceImageUrl}
              label={prompt.label}
            />
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="order-1 min-w-0 space-y-4 md:order-none md:col-start-2">
          <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={advance} />

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex w-full justify-center">
              <ElevatedButton
                text={isLast ? "FINISH" : "NEXT SIGN"}
                icon={isLast ? Check : ArrowRight}
                iconPosition="right"
                className="min-h-11 w-full max-w-sm sm:min-h-10"
                onClick={advance}
              />
            </div>

            {/* PREVIOUS + PROGRESS */}
            <div className="flex items-center gap-3 sm:gap-5">
              <ElevatedButton
                text=""
                aria-label="Previous sign"
                title="Previous sign"
                variant="secondary"
                icon={ArrowLeft}
                size="sm"
                className="h-11 w-12 shrink-0 px-0 sm:h-9"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
              />
              <div className="min-w-0 flex-1">
                <div
                  role="progressbar"
                  aria-label="Practice progress"
                  aria-valuemin={0}
                  aria-valuemax={prompts.length}
                  aria-valuenow={index + 1}
                  aria-valuetext={`Sign ${index + 1} of ${prompts.length}`}
                  className="h-5 overflow-hidden rounded-full border border-hudyat-gold/20 bg-muted p-0.5"
                >
                  <div
                    className="h-full rounded-full bg-hudyat-gold shadow-sm transition-[width] motion-reduce:transition-none"
                    style={{ width: `${practicePosition(index, prompts.length)}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Sign {index + 1} of {prompts.length}
                </p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Make the sign correctly to hear a sound and move on automatically, or use Next sign.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CategoryPracticePage() {
  const { categoryId: slug } = useParams();
  const navigate = useNavigate();
  // The address names the category (/student/practice/colors); its signs come from the lesson, as in Learn.
  const areas = useLearningAreas();
  const category = areas.data?.flatMap((area) => area.categories).find((c) => categorySlug(c.name) === slug);
  const lesson = useCategoryLesson(category?.id);
  const prompts: PracticeSign[] =
    lesson.data?.categoryGestures.map((item) => ({
      label: item.gesture.label,
      modelClass: item.gesture.modelClass,
      referenceImageUrl: item.gesture.referenceImageUrl ?? undefined,
      referenceVideoUrl: item.gesture.referenceVideoUrl ?? undefined,
    })) ?? [];
  const isLoading = areas.isLoading || (Boolean(category) && lesson.isLoading);
  const error = areas.error ?? lesson.error;

  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader backTo="/student/practice" backLabel="Hudyat — back to practice categories" />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">
            Loading this practice...
          </p>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-destructive" role="alert">
              {error instanceof Error ? error.message : "We couldn't load this practice right now."}
            </p>
            <ElevatedButton
              text="TRY AGAIN"
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              className="mt-4 min-h-9"
              onClick={() => void (areas.error ? areas.refetch() : lesson.refetch())}
            />
          </div>
        ) : category && prompts.length ? (
          <PracticeSession key={category.id} title={category.name} prompts={prompts} />
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">Category not found</h1>
            <p className="my-4 text-muted-foreground">Choose an available category to start practicing.</p>
            <ElevatedButton text="BACK TO CATEGORIES" variant="secondary" className="min-h-11" onClick={() => navigate("/student/practice")} />
          </Card>
        )}
      </main>
    </div>
  );
}
