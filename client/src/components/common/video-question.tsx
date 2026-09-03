import { Check, XCircle } from "lucide-react";

type VideoAnswer = {
  label: string;
  text: string;
};

type VideoQuestionProps = {
  title: string;
  videoSrc: string;
  answers: VideoAnswer[];
  correctAnswer: string;
  selectedAnswer: string | null;
  checked: boolean;
  onSelect: (answer: string) => void;
};

const VideoQuestion = ({
  title,
  videoSrc,
  answers,
  correctAnswer,
  selectedAnswer,
  checked,
  onSelect,
}: VideoQuestionProps) => {
  return (
    <>
      <h1 className="shrink-0 text-2xl font-extrabold leading-tight sm:text-3xl">
        {title}
      </h1>

      <div className="mt-3 flex w-full justify-center sm:mt-4">
        <video
          className="aspect-video w-full max-w-md rounded-sm object-cover"
          controls
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:mt-8 sm:gap-4">
        {answers.map((answer) => {
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
              onClick={() => !checked && onSelect(answer.label)}
              disabled={checked}
              className={`relative flex h-12 w-full items-center rounded-xl border-2 px-3 transition-all sm:h-14 ${showCorrectBounce ? "animate-bounce" : ""} ${answerStyle}`}
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
    </>
  );
};

export default VideoQuestion;