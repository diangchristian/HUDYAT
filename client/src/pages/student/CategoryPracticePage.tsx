/*
 * Free-play practice for one category, mobile first. Same cards as the lesson page
 * under a slim header, but no steps: per sign just the reference (video with Again/Slow,
 * or photo) and the camera. Children step through signs with ◀ ▶ (or jump via "All signs"); a correct sign
 * earns a star (this visit only) and moves to the next sign without one.
 * Signs and media come from the lesson data, which is read-only here.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, House, LayoutGrid, RotateCcw, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { CATEGORIES } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
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

const switchButton =
  "flex size-12 shrink-0 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-white text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2 sm:size-14";

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

  const [showAll, setShowAll] = useState(false);
  // Wraps around both ends, so ◀ on the first sign goes to the last.
  const go = (next: number) => {
    setIndex((next + prompts.length) % prompts.length);
    setShowAll(false);
  };

  const restart = () => {
    setStars(new Set());
    setIndex(0);
    setFinished(false);
  };

  return (
    // Phones: exactly one screen tall, so the reference and camera always fit (no scrolling while signing).
    <div className="flex min-h-dvh flex-col bg-[#FFF8E7] font-body max-md:h-dvh md:pb-10">
      {/* SLIM HEADER: practice is a drill, so the camera and the example get the room the world banner used to take.
          The lesson character stays, small, and still cheers on each star. */}
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center gap-3 px-3 pt-3 sm:px-8 sm:pt-4">
        <button
          type="button"
          aria-label="Back to practice"
          onClick={() => navigate("/student/practice")}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-white text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2"
        >
          <House aria-hidden="true" className="size-6" />
        </button>
        <div aria-hidden="true" className={cn("w-12 shrink-0", cheering ? "ls-mood-cheer" : "ls-mood-watch")}>
          <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
        </div>
        <p className="min-w-0 flex-1 truncate text-lg font-black text-[#3C3C3C] sm:text-xl">
          <span className="text-sm font-extrabold tracking-wider text-[#6B6B6B] uppercase">Practice · </span>
          {title}
        </p>
        <span className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-sm font-black text-[#4B4B4B] shadow-[0_2px_0_#0000000d]">
          <Star aria-hidden="true" className="size-4 fill-hudyat-gold text-hudyat-gold" />
          {stars.size}/{prompts.length}
          <span className="sr-only">stars</span>
        </span>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-4">
        {finished ? (
          <div role="status" className="ls-pop mx-auto mt-6 max-h-full max-w-md overflow-y-auto rounded-3xl border-4 border-hudyat-gold bg-white p-5 text-center sm:p-8 shadow-[0_6px_0_#0000001a]">
            <div aria-hidden="true" className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => <Star key={i} className="size-10 fill-hudyat-gold text-hudyat-gold" />)}
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#3C3C3C] sm:text-3xl">Great practice!</h1>
            <p className="mt-2 text-lg font-semibold text-[#6B6B6B]">You got {stars.size} of {prompts.length} stars in {title}.</p>
            <div className="mt-6 flex flex-col gap-3">
              <ElevatedButton text="PRACTICE AGAIN" icon={RotateCcw} size="lg" className="min-h-14" onClick={restart} />
              <ElevatedButton text="CHOOSE ANOTHER" variant="secondary" size="lg" className="min-h-14" onClick={() => navigate("/student/practice")} />
            </div>
          </div>
        ) : (
          <>
            {/* SIGN SWITCHER: the sign's name is the heading, with big ◀ ▶ either side. Dots show progress
                (gold star = signed); "All signs" opens a grid for jumping straight to one. */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Previous sign"
                onClick={() => go(index - 1)}
                className={switchButton}
              >
                <ChevronLeft aria-hidden="true" className="size-7" strokeWidth={3} />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <h1 key={prompt.label} className="ls-rise text-xl leading-snug font-bold text-balance text-[#3C3C3C] sm:text-2xl md:text-3xl">
                  Sign
                  <mark className="mx-1 rounded-lg bg-hudyat-gold/30 px-1.5 font-black text-[#3C3C3C] uppercase">{prompt.label}</mark>!
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                  <span className="sr-only">Sign {index + 1} of {prompts.length}</span>
                  {prompts.map((p, i) =>
                    stars.has(i) ? (
                      <Star key={p.label} aria-hidden="true" className={cn("fill-hudyat-gold text-[#B87800]", i === index ? "size-4" : "size-3")} />
                    ) : (
                      <span key={p.label} aria-hidden="true" className={cn("rounded-full", i === index ? "size-3 bg-hudyat-gold" : "size-2 bg-[#D9CBB0]")} />
                    ),
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Next sign"
                onClick={() => go(index + 1)}
                className={switchButton}
              >
                <ChevronRight aria-hidden="true" className="size-7" strokeWidth={3} />
              </button>
            </div>

            <div className="mt-2 flex shrink-0 justify-center">
              <button
                type="button"
                aria-expanded={showAll}
                aria-controls="all-signs"
                onClick={() => setShowAll(!showAll)}
                className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-[#6B6B6B] uppercase hover:text-[#3C3C3C] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none"
              >
                <LayoutGrid aria-hidden="true" className="size-4" /> {showAll ? "Close" : "All signs"}
              </button>
            </div>

            {showAll && (
              <nav id="all-signs" aria-label={`${title} signs`} className="ls-rise shrink-0 rounded-3xl border-4 border-[#F3E3B5] bg-white p-3 shadow-[0_6px_0_#0000001a]">
                <ol className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2 overflow-y-auto">
                  {prompts.map((p, i) => (
                    <li key={p.label}>
                      <button
                        type="button"
                        aria-current={i === index ? "true" : undefined}
                        aria-label={`${p.label}${stars.has(i) ? ", got a star" : ""}`}
                        onClick={() => {
                          setIndex(i);
                          setShowAll(false);
                        }}
                        className={cn(
                          "flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-b-4 px-2 text-center text-sm leading-tight font-black focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2",
                          i === index ? "border-[#B87800] bg-hudyat-gold text-[#3C3C3C]" : "border-[#E5E5E5] bg-[#FAFAFA] text-[#4B4B4B]",
                        )}
                      >
                        {p.label}
                        {stars.has(i) && <Star aria-hidden="true" className="size-4 shrink-0 fill-hudyat-gold text-[#B87800]" />}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* REFERENCE + CAMERA: stacked on phones, side by side (same height) on tablets and up */}
            <div className="mt-3 grid min-h-0 flex-1 grid-rows-[minmax(0,2fr)_minmax(0,3fr)] gap-3 sm:mt-4 sm:gap-4 md:flex-none md:grid-cols-2 md:grid-rows-none">
              {/* From tablets up the example is laid over its cell, so the camera alone sets the row height and the example matches it. */}
              <div className="min-h-0 md:relative">
                <div className="h-full md:absolute md:inset-0">
                  <HowCard key={prompt.label} prompt={prompt} fill />
                </div>
              </div>
              <div className="rounded-3xl border-4 border-[#E11D48] bg-white p-1.5 shadow-[0_6px_0_#0000001a] max-md:min-h-0 sm:p-2.5">
                {/* bare: the red card is the only frame, no second frame inside it. */}
                <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={correct} fillOnPhone bare />
              </div>
            </div>
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
