import { Check, XCircle } from "lucide-react";

import ReferenceMedia from "./reference-media";

type VideoAnswer = {
  label: string;
  text: string;
};

type VideoQuestionProps = {
  title?: string;
  videoUrl?: string;
  answers?: VideoAnswer[];
  correctAnswer?: string;
  selectedAnswer?: string | null;
  checked?: boolean;
  onSelect?: (answer: string) => void;
};

const VideoQuestion = ({
  title,
  videoUrl,
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: VideoQuestionProps) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* The page already shows the question, so a heading only when a title is given. */}
      {title && (
        <h2 className="shrink-0 text-[clamp(1.25rem,3vh,1.875rem)] font-extrabold leading-tight">{title}</h2>
      )}

      {/* Same green "TV" frame as the lesson's How to Sign step. */}
      <div className="flex w-full min-h-0 flex-1 justify-center">
        <div className="flex max-h-full w-full max-w-md min-h-0 rounded-[2rem] border-4 border-[#059669] bg-[#064E3B] p-2 shadow-[0_6px_0_#0000001a]">
          <div className="min-h-0 w-full overflow-hidden rounded-3xl bg-black">
            <ReferenceMedia
              videoUrl={videoUrl}
              label={title ?? "Reference video"}
              className="max-h-full w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-[clamp(0.75rem,2vh,1.5rem)] grid w-full shrink-0 grid-cols-1 gap-[clamp(0.5rem,1.2vh,0.875rem)]">
        {(answers ?? []).map((answer) => {
          const isSelected = selectedAnswer === answer.label;
          const isCorrect = answer.label === correctAnswer;
          const showCorrectBounce = checked && !isSelected && isCorrect;
          // Chunky like the lesson buttons: thick border, solid bottom shadow, gold when picked.
          const answerStyle = checked
            ? isCorrect
              ? "border-[#54b848] bg-[#f1ffed] shadow-[0_4px_0_#3d9d35]"
              : isSelected
                ? "border-[#ed6a5a] bg-[#fff3f1] shadow-[0_4px_0_#d95849]"
                : "border-[#e1e1e1] bg-white opacity-60"
            : isSelected
              ? "border-hudyat-gold bg-[#FFF8E7] shadow-[0_4px_0_#C98A00]"
              : "border-[#e1e1e1] bg-white shadow-[0_4px_0_#e1e1e1] hover:border-[#ffc145] active:translate-y-0.5 active:shadow-[0_1px_0_#e1e1e1]";

          return (
            <button
              key={answer.label}
              type="button"
              aria-label={`Answer ${answer.label}: ${answer.text}`}
              aria-pressed={isSelected}
              onClick={() => !checked && onSelect?.(answer.label)}
              disabled={checked}
              className={`relative flex min-h-12 w-full items-center rounded-2xl border-[3px] px-3 py-2 transition-all focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none ${showCorrectBounce ? "animate-bounce" : ""} ${answerStyle}`}
            >
              <span className="absolute left-2.5 flex size-7 items-center justify-center rounded-lg border-2 border-[#e0e0e0] bg-white text-xs font-black text-[#6B6B6B]">
                {answer.label}
              </span>
              <span className="w-full px-8 text-center text-base font-extrabold text-[#3C3C3C] sm:text-lg">
                {answer.text}
              </span>
              {checked && isCorrect && (
                <Check className="absolute right-2 size-5 rounded-full bg-[#54b848] p-0.5 text-white" />
              )}
              {checked && isSelected && !isCorrect && (
                <XCircle className="absolute right-2 size-5 rounded-full bg-[#ed6a5a] p-0.5 text-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VideoQuestion;