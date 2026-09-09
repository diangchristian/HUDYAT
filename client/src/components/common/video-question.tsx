import { Check, XCircle } from "lucide-react";

type VideoAnswer = {
  label: string;
  text: string;
};

type VideoQuestionProps = {
  title?: string;
  videoSrc?: string;
  videoUrl?: string;
  answers?: VideoAnswer[];
  correctAnswer?: string;
  selectedAnswer?: string | null;
  checked?: boolean;
  onSelect?: (answer: string) => void;
};

const VideoQuestion = ({
  title,
  videoSrc,
  videoUrl,
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: VideoQuestionProps) => {
  const source = videoSrc ?? videoUrl;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <h1 className="shrink-0 text-[clamp(1.25rem,3vh,1.875rem)] font-extrabold leading-tight">
        {title ?? "Reference video"}
      </h1>

      <div className="mt-[clamp(0.5rem,1.5vh,1rem)] flex w-full min-h-0 flex-1 justify-center">
        <video
          className="aspect-video max-h-full w-full max-w-md rounded-sm object-contain"
          controls
          preload="metadata"
        >
          <source src={source} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mt-[clamp(0.75rem,2vh,2rem)] grid w-full shrink-0 grid-cols-1 gap-[clamp(0.375rem,1vh,1rem)]">
        {(answers ?? []).map((answer) => {
          const isSelected = selectedAnswer === answer.label;
          const isCorrect = answer.label === correctAnswer;
          const showCorrectBounce = checked && !isSelected && isCorrect;
          const answerStyle = checked
            ? isCorrect
              ? "border-[#54b848] bg-[#f1ffed] shadow-[0_3px_0_#3d9d35]"
              : isSelected
                ? "border-[#ed6a5a] bg-[#fff3f1] shadow-[0_3px_0_#d95849]"
                : "border-[#e1e1e1] bg-white opacity-60"
            : isSelected
              ? "border-[#5fc3fd] bg-[#f5fff1] shadow-[0_3px_0_#5fc3fd]"
              : "border-[#e1e1e1] hover:border-[#ffc145] hover:shadow-[0_3px_0_#e8d5a5]";

          return (
            <button
              key={answer.label}
              type="button"
              aria-label={`Answer ${answer.label}: ${answer.text}`}
              aria-pressed={isSelected}
              onClick={() => !checked && onSelect?.(answer.label)}
              disabled={checked}
              className={`relative flex h-[clamp(2.5rem,6vh,3.5rem)] w-full items-center rounded-xl border-2 px-3 transition-all ${showCorrectBounce ? "animate-bounce" : ""} ${answerStyle}`}
            >
              <span className="absolute left-2 flex size-6 items-center justify-center rounded-md border border-[#e0e0e0] text-[10px] text-[#999]">
                {answer.label}
              </span>
              <span className="w-full text-center text-xs font-bold sm:text-sm">
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