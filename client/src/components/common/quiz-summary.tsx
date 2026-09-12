import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import {
  RotateCcw,
  Star,
  Target,
  ThumbsUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { useNavigate } from "react-router";

type QuizSummaryProps = {
  score?: number;
  totalItems?: number;
  onContinue?: () => void;
};

/*
 * Star thresholds, based on the percentage of items answered
 * correctly:
 *   3 stars — 80% or higher
 *   2 stars — 50% up to 80%
 *   1 star  — any correct answer below 50%
 *   0 stars — nothing answered correctly
 */
function starsEarned(score: number, totalItems: number) {
  if (totalItems <= 0) return 0;

  const percentage = (score / totalItems) * 100;

  if (percentage >= 80) return 3;
  if (percentage >= 50) return 2;
  if (percentage > 0) return 1;
  return 0;
}

const STAR_SIZE_CLASSES = [
  "size-14 sm:size-16",
  "size-20 sm:size-24",
  "size-14 sm:size-16",
];

type FeedbackTier = {
  icon: LucideIcon;
  borderClass: string;
  iconBgClass: string;
  iconColorClass: string;
  headline: string;
  body: (score: number, totalItems: number) => string;
};

/*
 * One feedback tier per star count (index matches earnedStars),
 * each grounded in the learner's actual numbers rather than a
 * generic "great job" — the copy and colors change with the score.
 */
const FEEDBACK_TIERS: FeedbackTier[] = [
  {
    icon: RotateCcw,
    borderClass: "border-[#9ed3d9]",
    iconBgClass: "bg-[#e6f5f6]",
    iconColorClass: "text-[#3f8b93]",
    headline: "Let's practice more",
    body: () =>
      "Every learner starts somewhere. Revisit the lesson steps and try the quiz again when you're ready.",
  },
  {
    icon: Target,
    borderClass: "border-[#f2a49b]",
    iconBgClass: "bg-[#fbe3e0]",
    iconColorClass: "text-[#c1584a]",
    headline: "Good first attempt",
    body: (score, totalItems) =>
      `${score} out of ${totalItems} correct so far. Head back to the lesson to review these signs, then try again.`,
  },
  {
    icon: ThumbsUp,
    borderClass: "border-[#72d44f]",
    iconBgClass: "bg-[#e3f7db]",
    iconColorClass: "text-[#4a9c2e]",
    headline: "Solid progress!",
    body: (score, totalItems) =>
      `${score} out of ${totalItems} correct. Review the ones you missed and you'll have this mastered in no time.`,
  },
  {
    icon: Trophy,
    borderClass: "border-[#ffbd3d]",
    iconBgClass: "bg-[#fff1d6]",
    iconColorClass: "text-[#e6a100]",
    headline: "Outstanding signing!",
    body: (score, totalItems) =>
      `${score} out of ${totalItems} correct — you've clearly got this category down. Ready for the next one?`,
  },
];

const QuizSummary = ({
  score = 9,
  totalItems = 10,
  onContinue,
}: QuizSummaryProps) => {
    const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const earnedStars = starsEarned(score, totalItems);
  const feedback = FEEDBACK_TIERS[earnedStars];

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-white font-body text-[#111827]">
      {/* Confetti background */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={180}
        gravity={0.04}
        recycle={true}
        run={true}
        colors={[
          "#F7B6B2",
          "#BFE8ED",
          "#C8C9EE",
          "#FFE7A3",
          "#AEE3E5",
        ]}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-6">
        <section className="flex w-full max-w-xl flex-col items-center text-center">
          {/* Stars */}
          <div className="mb-3 flex items-end justify-center gap-3">
            {STAR_SIZE_CLASSES.map((sizeClass, index) => {
              const isFilled = index < earnedStars;

              return (
                <Star
                  key={index}
                  className={`${sizeClass} text-[#ffbd3d] ${
                    isFilled ? "fill-[#ffbd3d]" : ""
                  }`}
                  strokeWidth={isFilled ? 1.5 : 2}
                />
              );
            })}
          </div>

          <h1 className="text-2xl font-extrabold text-[#4a4a4a] sm:text-3xl">
            Quiz Complete!
          </h1>

          {/* Score cards */}
          <div className="mt-8 flex w-full max-w-xs justify-center gap-4 sm:mt-10 sm:gap-6">
            {/* Total */}
            <div className="w-28 overflow-hidden rounded-xl border-2 border-[#ffbd3d] bg-white sm:w-32">
              <div className="bg-[#ffbd3d] px-2 py-0.5 text-[10px] font-extrabold text-white">
                TOTAL ITEMS
              </div>

              <div className="flex h-16 items-center justify-center sm:h-18">
                <span className="text-4xl font-extrabold text-[#4a4a4a]">
                  {totalItems}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="w-28 overflow-hidden rounded-xl border-2 border-[#72d44f] bg-white sm:w-32">
              <div className="bg-[#72d44f] px-2 py-0.5 text-[10px] font-extrabold text-white">
                SCORE
              </div>

              <div className="flex h-16 items-center justify-center sm:h-18">
                <span className="text-4xl font-extrabold text-[#4a4a4a]">
                  {score}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div
            className={`mt-6 flex w-full max-w-md items-start gap-3 rounded-xl border-2 ${feedback.borderClass} bg-white p-4 text-left sm:mt-8 sm:p-5`}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${feedback.iconBgClass}`}
            >
              <feedback.icon
                aria-hidden="true"
                className={`size-5 ${feedback.iconColorClass}`}
                strokeWidth={2.5}
              />
            </div>

            <div>
              <p className="text-sm font-extrabold text-[#4a4a4a] sm:text-base">
                {feedback.headline}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[#6b6b6b] sm:text-sm">
                {feedback.body(score, totalItems)}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom actions */}
      <footer className="relative z-10 shrink-0 border-t border-[#ededed] bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-5 py-4 sm:px-10 sm:py-5">
          {/* <ElevatedButton
            text="BACK TO LESSONS"
            variant="secondary"
            size="lg"
          /> */}

          <ElevatedButton
            text="CONTINUE"
            variant="primary"
            size="lg"
            onClick={onContinue ?? (() => navigate("/student/learn"))}
          />
        </div>
      </footer>
    </div>
  );
};

export default QuizSummary;