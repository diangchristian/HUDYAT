/*
 * Free-play practice for one category, mobile first. Same world and cards as the
 * lesson page, but no steps: per sign just the reference (video with Again/Slow,
 * or photo) and the camera. Children pick any sign from the strip; a correct sign
 * earns a star (this visit only) and moves to the next sign without one.
 * Signs and media come from the lesson data, which is read-only here.
 */
import { useState } from "react";
import { ArrowRight, House, RotateCcw, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { CATEGORIES } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import PracticeCamera from "@/components/common/practice-camera";
import SessionHeader from "@/components/common/session-header";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { usePreloadRecognition } from "@/features/fsl-recognition/preload";
import { useCategoryLesson } from "@/hooks/use-category-lesson";
import { useLearningAreas } from "@/hooks/use-learning-areas";
import { categorySlug, nextUnstarred } from "@/lib/practice";
import { cn } from "@/lib/utils";

import type { LessonPrompt } from "./category-learn/learn-session";
import { HowCard } from "./category-learn/step-cards";
import "./category-learn/learn-session.css";

const CHEER_MS = 1500;

function PracticeSession({ title, prompts }: { title: string; prompts: LessonPrompt[] }) {
  const navigate = useNavigate();
  usePreloadRecognition(categorySlug(title));
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState<ReadonlySet<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [cheerAt, setCheerAt] = useState(0);
  const cheering = cheerAt > 0;
  const color = CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
  const prompt = prompts[index];

  const correct = () => {
    const earned = new Set(stars).add(index);
    setStars(earned);
    // Only the latest star's timer ends the cheer, so quick stars don't cut it short.
    const at = Date.now();
    setCheerAt(at);
    setTimeout(() => setCheerAt((current) => (current === at ? 0 : current)), CHEER_MS);
    const next = nextUnstarred(earned, index, prompts.length);
    if (next === null) setFinished(true);
    else setIndex(next);
  };

  const restart = () => {
    setStars(new Set());
    setIndex(0);
    setFinished(false);
  };

  return (
    <div className="min-h-dvh bg-[#FFF8E7] pb-10 font-body">
      {/* WORLD HEADER: frozen while the camera is on, the character cheers on each star */}
      <section className="relative h-36 overflow-hidden rounded-b-[2rem] border-b-4 border-white shadow-[0_6px_0_#0000000d] sm:h-44">
        <div className="ls-mood-watch absolute inset-0">
          <LessonStage title={title} color={color} className="!h-full [&>span.lc-shadow]:hidden [&>svg]:hidden" />
        </div>
        <div aria-hidden="true" className={cn("absolute bottom-1 left-1/2 w-20 -translate-x-1/2 sm:w-24", cheering ? "ls-mood-cheer" : "ls-mood-watch")}>
          <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
        </div>
        <button
          type="button"
          aria-label="Back to practice"
          onClick={() => navigate("/student/practice")}
          className="absolute top-3 left-3 z-10 flex size-12 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-white text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2"
        >
          <House aria-hidden="true" className="size-6" />
        </button>
        <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-2xl bg-white/90 px-3 py-2 text-sm font-black text-[#4B4B4B]">
          <Star aria-hidden="true" className="size-4 fill-hudyat-gold text-hudyat-gold" />
          {stars.size}/{prompts.length}
          <span className="sr-only">stars</span>
        </span>
      </section>

      <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-8">
        {finished ? (
          <div role="status" className="ls-pop mx-auto mt-6 max-w-md rounded-3xl border-4 border-hudyat-gold bg-white p-8 text-center shadow-[0_6px_0_#0000001a]">
            <div aria-hidden="true" className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => <Star key={i} className="size-10 fill-hudyat-gold text-hudyat-gold" />)}
            </div>
            <h1 className="mt-3 text-3xl font-black text-[#3C3C3C]">Great practice!</h1>
            <p className="mt-2 text-lg font-semibold text-[#6B6B6B]">You got {stars.size} of {prompts.length} stars in {title}.</p>
            <div className="mt-6 flex flex-col gap-3">
              <ElevatedButton text="PRACTICE AGAIN" icon={RotateCcw} size="lg" className="min-h-14" onClick={restart} />
              <ElevatedButton text="CHOOSE ANOTHER" variant="secondary" size="lg" className="min-h-14" onClick={() => navigate("/student/practice")} />
            </div>
          </div>
        ) : (
          <>
            {/* SIGN STRIP: tap any sign; stars show the ones already signed */}
            <nav aria-label={`${title} signs`} className="-mx-4 overflow-x-auto px-4 pb-2">
              <ol className="flex w-max gap-2">
                {prompts.map((p, i) => (
                  <li key={p.label}>
                    <button
                      type="button"
                      aria-current={i === index ? "true" : undefined}
                      aria-label={`${p.label}${stars.has(i) ? ", got a star" : ""}`}
                      onClick={() => setIndex(i)}
                      className={cn(
                        "relative flex min-h-12 min-w-12 items-center justify-center rounded-2xl border-b-4 px-3 text-base font-black whitespace-nowrap focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none",
                        i === index ? "border-[#B87800] bg-hudyat-gold text-[#3C3C3C]" : "border-[#E5E5E5] bg-white text-[#4B4B4B]",
                      )}
                    >
                      {p.label}
                      {stars.has(i) && <Star aria-hidden="true" className="absolute -top-1.5 -right-1.5 size-5 fill-hudyat-gold text-[#B87800]" />}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <h1 key={prompt.label} className="ls-rise mt-3 text-2xl leading-snug font-bold text-[#3C3C3C] sm:text-3xl">
              Sign
              <mark className="mx-1 rounded-lg bg-hudyat-gold/30 px-1.5 font-black text-[#3C3C3C] uppercase">{prompt.label}</mark>!
            </h1>

            {/* REFERENCE + CAMERA: stacked on phones, side by side on tablets */}
            <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
              <HowCard key={prompt.label} prompt={prompt} />
              <div className="rounded-3xl border-4 border-[#E11D48] bg-white p-2 shadow-[0_6px_0_#0000001a] sm:p-3">
                <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={correct} />
              </div>
            </div>

            <ElevatedButton
              text="SKIP TO NEXT SIGN"
              icon={ArrowRight}
              iconPosition="right"
              variant="secondary"
              size="lg"
              className="mt-5 min-h-14 w-full"
              onClick={() => setIndex((index + 1) % prompts.length)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default function CategoryPracticePage() {
  const { categoryId: slug } = useParams();
  const navigate = useNavigate();
  const areas = useLearningAreas();
  const category = areas.data?.flatMap((area) => area.categories).find((item) => categorySlug(item.name) === slug);
  const lesson = useCategoryLesson(category?.id);

  const prompts: LessonPrompt[] =
    lesson.data?.categoryGestures.map((item) => ({
      label: item.gesture.label,
      modelClass: item.gesture.modelClass,
      referenceImageUrl: item.gesture.referenceImageUrl ?? undefined,
      referenceVideoUrl: item.gesture.referenceVideoUrl ?? undefined,
    })) ?? [];

  if (category && prompts.length) {
    return <PracticeSession key={category.id} title={category.name} prompts={prompts} />;
  }

  const loading = areas.isLoading || lesson.isLoading;
  const error = areas.error ?? lesson.error;
  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader backTo="/student/practice" backLabel="Hudyat — back to practice categories" />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading practice...</p>
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">{error ? "We couldn't load this practice" : "Category not found"}</h1>
            <p className="my-4 text-muted-foreground">
              {error instanceof Error ? error.message : "Choose an available category to start practicing."}
            </p>
            <ElevatedButton text="BACK TO CATEGORIES" variant="secondary" className="min-h-11" onClick={() => navigate("/student/practice")} />
          </Card>
        )}
      </main>
    </div>
  );
}
