import { useRef, useState } from "react";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router";
import VideoQuestion from "@/components/common/video-question";
import HandSignQuestion from "@/components/common/hand-sign-question";
import ElevatedButton from "@/components/ui/elavated-button";
import QuizSummary from "@/components/common/quiz-summary";

const answers = [
  { label: "A", hand: "✊" },
  { label: "B", hand: "🤚" },
  { label: "C", hand: "🤏" },
];

const videoAnswers = [
  { label: "A", text: "Good Afternoon" },
  { label: "B", text: "Good Morning" },
  { label: "C", text: "Good Night" },
];

const TakeAssessmentPage = () => {
  const navigate = useNavigate();

  const correctSound = useRef(new Audio("/sounds/correct.mp3"));
  const wrongSound = useRef(new Audio("/sounds/wrong.mp3"));
  const assessmentEndSound = useRef(new Audio("/sounds/summary_sound1.mp3"));

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(9);

  // Controls the loading state after the final question
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSummary, setShowSummary] = useState(false);  

  const totalQuestions = 10;
  const correctAnswer = "A";
  const isVideoPresent = true;

  const playCorrectSound = () => {
    correctSound.current.currentTime = 0;
    void correctSound.current.play();
  };

  const playWrongSound = () => {
    wrongSound.current.currentTime = 0;
    void wrongSound.current.play();
  };

   const playAssessmentEndSound = () => {
    assessmentEndSound.current.currentTime = 0;
    void assessmentEndSound.current.play();
  };


  const resetQuestion = () => {
    setSelectedAnswer(null);
    setChecked(false);
  };

 const handleCheckOrNext = async () => {
  if (!selectedAnswer || isSubmitting) return;

  // First click: CHECK
  if (!checked) {
    if (selectedAnswer === correctAnswer) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setChecked(true);
    return;
  }

  // Not the last question: CONTINUE
  if (questionNumber < totalQuestions) {
    setQuestionNumber((current) => current + 1);
    resetQuestion();
    return;
  }

  // Last question: FINISH
  setIsSubmitting(true);

  // Small delay so the loading state can render
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Temporary API simulation
  await new Promise((resolve) => setTimeout(resolve, 1200));

  setIsSubmitting(false);
  setShowSummary(true);
  playAssessmentEndSound()
};

  const handleSkip = () => {
    if (isSubmitting) return;

    if (questionNumber < totalQuestions) {
      setQuestionNumber((current) => current + 1);
      resetQuestion();
    }
  };

  const isQuizComplete =
    questionNumber === totalQuestions && checked && !isSubmitting;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white font-body text-[#111827]">
      {showSummary ? (
        <QuizSummary />
      ) : (
        <>
          {/* ================= HEADER ================= */}
          <header className="shrink-0">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 pt-5 sm:gap-7 sm:px-10 sm:pt-8">
              <button
                type="button"
                aria-label="Close assessment"
                onClick={() => navigate("/student/assessment")}
                disabled={isSubmitting}
                className="shrink-0 rounded-full p-1 text-[#777] transition-colors hover:bg-gray-100 hover:text-[#222] disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-5" />
              </button>

              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                <div
                  className="h-full rounded-full bg-[#70d24e] transition-all"
                  style={{
                    width: `${(questionNumber / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
          </header>

          {/* ================= MAIN ================= */}
          <main className="min-h-0 flex-1">
            <section className="mx-auto flex h-full w-full max-w-xl flex-col px-5 pb-4 pt-5 sm:px-10 xl:pt-20 lg:max-w-3xl">
              {/* Category */}
              <div className="mb-4 flex shrink-0 items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#b9eea3] text-xs font-extrabold text-[#27751b]">
                  A
                  <span className="text-[#e85e57]">B</span>
                  <span className="text-[#268bd0]">C</span>
                </span>

                <span className="text-sm font-extrabold">Alphabet</span>
              </div>

              {/* Question */}
              {isVideoPresent ? (
                <VideoQuestion
                  title="Select the correct gesture"
                  videoSrc="/videos/good-afternoon.mp4"
                  answers={videoAnswers}
                  correctAnswer={correctAnswer}
                  selectedAnswer={selectedAnswer}
                  checked={checked}
                  onSelect={setSelectedAnswer}
                />
              ) : (
                <HandSignQuestion
                  title="Which one of these is signed the letter ‘A’?"
                  answers={answers}
                  correctAnswer={correctAnswer}
                  selectedAnswer={selectedAnswer}
                  checked={checked}
                  onSelect={setSelectedAnswer}
                />
              )}

              {/* Feedback */}
              <div className="min-h-6">
                {checked && (
                  <div
                    className={`mt-4 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-[0_3px_0_rgb(0_0_0/0.08)] ${
                      selectedAnswer === correctAnswer
                        ? "border-[#9bdc8f] bg-[#efffec] text-[#287c22]"
                        : "border-[#f2aaa0] bg-[#fff4f2] text-[#b84438]"
                    }`}
                    role="status"
                  >
                    {selectedAnswer === correctAnswer ? (
                      <Sparkles className="size-6 shrink-0" />
                    ) : (
                      <Lightbulb className="size-6 shrink-0" />
                    )}

                    <div>
                      <p className="text-sm font-extrabold">
                        {selectedAnswer === correctAnswer
                          ? "Awesome! You got it!"
                          : "Good try!"}
                      </p>

                      <p className="text-xs font-bold opacity-80">
                        {selectedAnswer === correctAnswer
                          ? "Your sign language skills are growing."
                          : "The correct answer is A. Keep learning!"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>

          {/* ================= FOOTER ================= */}
          <footer className="shrink-0 border-t-2 border-[#ededed] bg-white">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-5">
              <ElevatedButton
                text="SKIP"
                size="lg"
                onClick={handleSkip}
                disabled={
                  questionNumber === totalQuestions || isSubmitting
                }
                variant="secondary"
              />

              <ElevatedButton
                text={
                  isSubmitting
                    ? "..."
                    : !checked
                      ? "CHECK"
                      : questionNumber === totalQuestions
                        ? "FINISH"
                        : "CONTINUE"
                }
                size="lg"
                onClick={handleCheckOrNext}
                disabled={!selectedAnswer || isSubmitting}
              />
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default TakeAssessmentPage;