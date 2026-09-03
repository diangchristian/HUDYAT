import { Check, XCircle } from "lucide-react";

type HandSignAnswer = {
  label: string;
  hand: string;
};

type HandSignQuestionProps = {
  title: string;
  answers: HandSignAnswer[];
  correctAnswer: string;
  selectedAnswer: string | null;
  checked: boolean;
  onSelect: (answer: string) => void;
};

const HandSignQuestion = ({
  title,
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: HandSignQuestionProps) => {
  return (
    <>
      <h1 className="shrink-0 text-2xl font-extrabold leading-tight sm:text-3xl">
        {title}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:gap-4 lg:mt-12 lg:grid-cols-3 lg:gap-6">
        {answers.map((answer) => {
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
              onClick={() => !checked && onSelect(answer.label)}
              disabled={checked}
              className={`relative flex h-24 w-full items-center justify-center rounded-xl border-2 p-4 transition-all sm:h-32 md:h-40 lg:h-60 ${checked && !isSelected && isCorrect ? "animate-bounce" : ""} ${answerStyle}`}
            >
              <span className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-md border-2 border-[#e0e0e0] text-[10px] text-[#999]">
                {answer.label}
              </span>
              <span className="text-6xl leading-none sm:text-6xl lg:text-8xl" role="img" aria-label={`Hand sign ${answer.label}`}>
                {answer.hand}
              </span>
              {checked && isCorrect && <Check className="absolute right-2 top-2 size-5 rounded-full bg-[#54b848] p-0.5 text-white" />}
              {checked && isSelected && !isCorrect && <XCircle className="absolute right-2 top-2 size-5 rounded-full bg-[#ed6a5a] p-0.5 text-white" />}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default HandSignQuestion;