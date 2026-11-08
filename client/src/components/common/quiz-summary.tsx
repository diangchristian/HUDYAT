/*
 * End of a lesson quiz, in the lesson's look (cream page, chunky cards), with the actions right under the result.
 * It answers the child's real question first: did I pass, and is the next lesson open?
 *  - passed:  confetti once, "Next lesson unlocked", NEXT LESSON (+ try again for a better score)
 *  - not yet: no confetti, "Get N of M right to pass", TRY AGAIN (+ review the lesson)
 * Stars still show how well it went, whatever the result.
 */
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Check, RotateCcw, Star, Target, ThumbsUp, Trophy, type LucideIcon } from "lucide-react";

import ElevatedButton from "@/components/ui/elavated-button";
import { starsEarned } from "@/lib/quiz-stars";

type QuizSummaryProps = {
  score: number;
  totalItems: number;
  passed: boolean;
  /** The teacher's passing mark, as a percentage of the total. */
  passingPercent: number;
  lessonName: string;
  onNextLesson: () => void;
  onRetry: () => void;
  onReviewLesson: () => void;
};

const STAR_SIZE_CLASSES = ["size-14 sm:size-16", "size-20 sm:size-24", "size-14 sm:size-16"];

type FeedbackTier = { icon: LucideIcon; ring: string; iconBg: string; iconColor: string; headline: string; body: (score: number, total: number) => string };

// One tier per star count, using the learner's own numbers rather than a generic "great job".
const FEEDBACK_TIERS: FeedbackTier[] = [
  {
    icon: RotateCcw,
    ring: "border-[#9ed3d9]",
    iconBg: "bg-[#e6f5f6]",
    iconColor: "text-[#3f8b93]",
    headline: "Let's practise more",
    body: () => "Every learner starts somewhere. Look at the lesson again, then try the quiz when you're ready.",
  },
  {
    icon: Target,
    ring: "border-[#f2a49b]",
    iconBg: "bg-[#fbe3e0]",
    iconColor: "text-[#c1584a]",
    headline: "Good first try",
    body: (score, total) => `${score} out of ${total} right so far. Look at these signs in the lesson again, then try once more.`,
  },
  {
    icon: ThumbsUp,
    ring: "border-[#72d44f]",
    iconBg: "bg-[#e3f7db]",
    iconColor: "text-[#4a9c2e]",
    headline: "Solid progress!",
    body: (score, total) => `${score} out of ${total} right. Practise the ones you missed and you'll have this lesson in no time.`,
  },
  {
    icon: Trophy,
    ring: "border-[#ffbd3d]",
    iconBg: "bg-[#fff1d6]",
    iconColor: "text-[#e6a100]",
    headline: "Outstanding signing!",
    body: (score, total) => `${score} out of ${total} right. You really know this lesson!`,
  },
];

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const QuizSummary = ({ score, totalItems, passed, passingPercent, lessonName, onNextLesson, onRetry, onReviewLesson }: QuizSummaryProps) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [reduceMotion] = useState(prefersReducedMotion);

  const earnedStars = starsEarned(score, totalItems);
  const feedback = FEEDBACK_TIERS[earnedStars];
  // passingPercent is a share of the total, so this is the score that passes (same units as `score`).
  const neededToPass = Math.ceil((passingPercent / 100) * totalItems);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#FFF8E7] font-body text-[#3C3C3C]">
      {/* Confetti only for a pass, and only once: cheering a fail sends a mixed message. */}
      {passed && !reduceMotion && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={220}
          gravity={0.12}
          recycle={false}
          colors={["#FF4B4B", "#FFC145", "#1CB0F6", "#58CC02", "#CE82FF", "#FF86D0"]}
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
        />
      )}

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <section className="flex w-full max-w-md flex-col items-center text-center">
          {/* Stars */}
          <div className="mb-3 flex items-end justify-center gap-3" role="img" aria-label={`${earnedStars} of 3 stars`}>
            {STAR_SIZE_CLASSES.map((sizeClass, index) => {
              const isFilled = index < earnedStars;
              return (
                <Star
                  key={index}
                  aria-hidden="true"
                  className={`${sizeClass} ${isFilled ? "fill-hudyat-gold text-hudyat-gold" : "text-[#E0D3B4]"}`}
                  strokeWidth={isFilled ? 1.5 : 2}
                />
              );
            })}
          </div>

          <p className="text-sm font-extrabold tracking-wider text-[#6B6B6B] uppercase">{lessonName} quiz</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{passed ? "You passed!" : "Almost there!"}</h1>

          {/* Pass / not-yet badge: the one thing the child most needs to know. */}
          {passed ? (
            <p role="status" className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-1.5 text-base font-extrabold text-white">
              <Check aria-hidden="true" className="size-5" strokeWidth={3} /> Next lesson unlocked
            </p>
          ) : (
            <p role="status" className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-[#E0D3B4] bg-white px-4 py-1.5 text-base font-extrabold text-[#4B4B4B]">
              <Target aria-hidden="true" className="size-5 text-[#c1584a]" /> Get {neededToPass} of {totalItems} right to pass
            </p>
          )}

          {/* Score: one big number pair instead of two boxes to compare. */}
          <div className="mt-6 w-full rounded-3xl border-4 border-[#F3E3B5] bg-white px-6 py-4 shadow-[0_6px_0_#0000001a]">
            <p className="text-6xl leading-none font-black tabular-nums sm:text-7xl">
              <span className={passed ? "text-green-600" : "text-[#3C3C3C]"}>{score}</span>
              <span className="text-[#AFAFAF]"> / {totalItems}</span>
            </p>
            <p className="mt-1 text-lg font-extrabold text-[#6B6B6B]">correct</p>
          </div>

          {/* Feedback */}
          <div className={`mt-4 flex w-full items-start gap-3 rounded-3xl border-4 ${feedback.ring} bg-white p-4 text-left shadow-[0_6px_0_#0000001a]`}>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${feedback.iconBg}`}>
              <feedback.icon aria-hidden="true" className={`size-6 ${feedback.iconColor}`} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-lg font-extrabold">{feedback.headline}</p>
              <p className="mt-0.5 text-base leading-relaxed text-[#4B4B4B]">{feedback.body(score, totalItems)}</p>
            </div>
          </div>

          {/* Actions sit right under the result, same width as the cards: one big main button,
              the other choice as a quiet text button so the two never compete. */}
          <nav aria-label="What next" className="mt-6 flex w-full flex-col items-center gap-2">
            <ElevatedButton
              text={passed ? "NEXT LESSON" : "TRY AGAIN"}
              icon={passed ? undefined : RotateCcw}
              iconPosition="right"
              size="lg"
              className="min-h-14 w-full text-xl! font-black!"
              onClick={passed ? onNextLesson : onRetry}
            />
            <button
              type="button"
              onClick={passed ? onRetry : onReviewLesson}
              className="min-h-11 rounded-xl px-4 text-base font-extrabold text-[#6B6B6B] uppercase underline-offset-4 hover:text-[#3C3C3C] hover:underline focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none"
            >
              {passed ? "Try again" : "Review lesson"}
            </button>
          </nav>
        </section>
      </main>
    </div>
  );
};

export default QuizSummary;
