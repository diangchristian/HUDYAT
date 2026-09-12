import { useState } from "react";
import { Check, XCircle } from "lucide-react";

type HandSignAnswer = {
  label: string;
  hand: string;
  imageUrl?: string;
};

type HandSignQuestionProps = {
  answers?: HandSignAnswer[];
  correctAnswer?: string;
  selectedAnswer?: string | null;
  checked?: boolean;
  onSelect?: (answer: string) => void;
};

const HandSignQuestion = ({
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: HandSignQuestionProps) => {
  const [failedChoices, setFailedChoices] = useState<Set<string>>(
    () => new Set(),
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="mx-auto grid min-h-0 w-full max-w-3xl flex-1 grid-cols-1 grid-rows-3 items-center gap-2 sm:grid-cols-3 sm:grid-rows-1 sm:gap-4 md:gap-5">
        {(answers ?? []).map((answer) => {
          const isSelected = selectedAnswer === answer.label;
          const isCorrect = answer.label === correctAnswer;
          const answerStyle = checked
            ? isCorrect
              ? "border-[#54b848] bg-[#f1ffed]"
              : isSelected
                ? "border-[#ed6a5a] bg-[#fff3f1]"
                : "border-[#e1e1e1] opacity-60"
            : isSelected
              ? "border-[#5fc3fd] bg-[#f5fff1]"
              : "border-[#e1e1e1] hover:border-[#ffc145]";

          const showImage =
            answer.imageUrl && !failedChoices.has(answer.label);

          return (
            <button
              key={answer.label}
              type="button"
              aria-label={`Answer ${answer.label}`}
              aria-pressed={isSelected}
              onClick={() => !checked && onSelect?.(answer.label)}
              disabled={checked}
              className={`relative flex h-full max-h-56 min-h-0 w-full items-center justify-center overflow-hidden rounded-2xl border-2 transition-all sm:max-h-72 ${showImage ? "p-1.5 sm:p-2" : "p-4"} ${checked && !isSelected && isCorrect ? "animate-bounce" : ""} ${answerStyle}`}
            >
              <span className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-md border-2 border-[#e0e0e0] bg-white/90 text-xs font-bold text-[#999] backdrop-blur-sm sm:size-9 sm:text-sm">
                {answer.label}
              </span>
              {showImage ? (
                <img
                  src={answer.imageUrl}
                  alt={`Hand sign for ${answer.label}`}
                  className="h-full w-full rounded-xl object-contain"
                  onError={() =>
                    setFailedChoices((prev) => {
                      const next = new Set(prev);
                      next.add(answer.label);
                      return next;
                    })
                  }
                />
              ) : (
                <span
                  className="text-[clamp(2.5rem,12vw,5rem)] leading-none"
                  role="img"
                  aria-label={`Hand sign ${answer.label}`}
                >
                  {answer.hand}
                </span>
              )}
              {checked && isCorrect && <Check className="absolute right-2 top-2 z-10 size-6 rounded-full bg-[#54b848] p-1 text-white sm:size-7" />}
              {checked && isSelected && !isCorrect && <XCircle className="absolute right-2 top-2 z-10 size-6 rounded-full bg-[#ed6a5a] p-1 text-white sm:size-7" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HandSignQuestion;