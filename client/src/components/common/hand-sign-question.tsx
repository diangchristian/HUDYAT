import { Check, XCircle } from "lucide-react";

type HandSignAnswer = {
  label: string;
  hand: string;
};

type HandSignQuestionProps = {
  title?: string;
  imageUrl?: string;
  answers?: HandSignAnswer[];
  correctAnswer?: string;
  selectedAnswer?: string | null;
  checked?: boolean;
  onSelect?: (answer: string) => void;
};

const HandSignQuestion = ({
  title,
  imageUrl,
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: HandSignQuestionProps) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <h1 className="shrink-0 text-[clamp(1.25rem,3vh,1.875rem)] font-extrabold leading-tight">
        {title ?? "Reference sign"}
      </h1>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Reference sign"
          className="mx-auto mt-[clamp(0.5rem,1.5vh,1.5rem)] min-h-0 flex-1 rounded-lg object-contain"
        />
      )}

      <div className="mt-[clamp(0.75rem,2vh,3rem)] grid shrink-0 grid-cols-1 gap-[clamp(0.375rem,1vh,1.5rem)] lg:grid-cols-3">
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

          return (
            <button
              key={answer.label}
              type="button"
              aria-label={`Answer ${answer.label}`}
              aria-pressed={isSelected}
              onClick={() => !checked && onSelect?.(answer.label)}
              disabled={checked}
              className={`relative flex h-[clamp(3.5rem,10vh,6rem)] w-full items-center justify-center rounded-xl border-2 p-4 transition-all ${checked && !isSelected && isCorrect ? "animate-bounce" : ""} ${answerStyle}`}
            >
              <span className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-md border-2 border-[#e0e0e0] text-[10px] text-[#999]">
                {answer.label}
              </span>
              <span className="text-[clamp(2rem,6vh,4rem)] leading-none" role="img" aria-label={`Hand sign ${answer.label}`}>
                {answer.hand}
              </span>
              {checked && isCorrect && <Check className="absolute right-2 top-2 size-5 rounded-full bg-[#54b848] p-0.5 text-white" />}
              {checked && isSelected && !isCorrect && <XCircle className="absolute right-2 top-2 size-5 rounded-full bg-[#ed6a5a] p-0.5 text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HandSignQuestion;