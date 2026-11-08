import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

// PROTOTYPE, delete me: ?variant=sign-* shows the Sign test prototype (dev only).
import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import { isSignTestVariant, SIGN_TEST_VARIANTS, SignTestPrototype } from "./sign-test-prototype";

import { FeedbackBanner, FeedbackOverlay, ResultProgress } from "@/components/common/assessment-feedback";
import VideoQuestion from "@/components/common/video-question";
import HandSignQuestion from "@/components/common/hand-sign-question";
import ElevatedButton from "@/components/ui/elavated-button";
import QuizSummary from "@/components/common/quiz-summary";

import type { AssessmentAnswer, AssessmentResult } from "@/api/assessment-api";
import { useAssessment } from "@/hooks/use-assessment";
import { useCheckAnswer } from "@/hooks/use-check-answer";
import { useSubmitAssessment } from "@/hooks/use-submit-assessment";

const TakeAssessmentPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const [results, setResults] = useState<boolean[]>([]);

  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const assessmentEndSound = useRef<HTMLAudioElement | null>(null);

  const {
    data: assessment,
    isLoading,
    error: loadError,
  } = useAssessment(categoryId);

  const checkAnswerMutation = useCheckAnswer(categoryId);
  const submitAssessmentMutation = useSubmitAssessment(categoryId);

  const [selectedChoiceId, setSelectedChoiceId] =
    useState<string | null>(null);

  const [checked, setChecked] = useState(false);

  const [correctChoiceId, setCorrectChoiceId] =
    useState<string | null>(null);

  const [questionNumber, setQuestionNumber] = useState(1);

  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [result, setResult] =
    useState<AssessmentResult | null>(null);

  // Try again from the summary: a fresh attempt on the same quiz, without reloading the page.
  const restartQuiz = () => {
    setResult(null);
    setResults([]);
    setAnswers([]);
    setQuestionNumber(1);
    setSelectedChoiceId(null);
    setChecked(false);
    setCorrectChoiceId(null);
    setSubmitError(null);
  };

  const isChecking = checkAnswerMutation.isPending;
  const isSubmitting = submitAssessmentMutation.isPending;

  const error =
    submitError ??
    (loadError instanceof Error
      ? loadError.message
      : loadError
        ? "We couldn't load this assessment."
        : !categoryId
          ? "Assessment category was not provided."
          : null);

  useEffect(() => {
    correctSound.current = new Audio(
      "/sounds/correct.mp3",
    );

    wrongSound.current = new Audio(
      "/sounds/wrong.mp3",
    );

    assessmentEndSound.current = new Audio(
      "/sounds/summary_sound1.mp3",
    );

    return () => {
      correctSound.current = null;
      wrongSound.current = null;
      assessmentEndSound.current = null;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading assessment...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex h-dvh items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">
            Assessment unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "We couldn't load this assessment."}
          </p>

          <ElevatedButton
            text="BACK TO LEARN"
            className="mt-6"
            onClick={() => navigate("/student/learn")}
          />
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <QuizSummary
        score={Number(result.score)}
        totalItems={Number(result.totalPoints)}
        passed={result.passed}
        passingPercent={Number(result.passingScore)}
        lessonName={assessment.category.name}
        // The Learn page shows the newly unlocked lesson as the current one.
        onNextLesson={() => navigate("/student/learn")}
        onReviewLesson={() => navigate(`/student/learn/${categoryId}`)}
        onRetry={restartQuiz}
      />
    );
  }

  const currentQuestion =
    assessment.questions[questionNumber - 1];

  if (!currentQuestion) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No questions are available.
        </p>
      </div>
    );
  }

  const totalQuestions = assessment.questions.length;

  const isVideoQuestion =
    currentQuestion.questionType === "VIDEO_GESTURE";

  /*
   * These components identify answers by a short label (A/B/C),
   * not the underlying choice id, so we map between the two here.
   */
  const choiceOptions = currentQuestion.choices.map(
    (choice, index) => ({
      id: choice.id,
      label: String.fromCharCode(65 + index),
      text: choice.choiceText ?? choice.gesture.label,
      imageUrl:
        choice.imageUrl ??
        choice.gesture.referenceImageUrl ??
        undefined,
    }),
  );

  const labelForChoiceId = (choiceId: string | null) =>
    choiceOptions.find((option) => option.id === choiceId)
      ?.label ?? undefined;

  const choiceIdForLabel = (label: string) =>
    choiceOptions.find((option) => option.label === label)
      ?.id ?? null;

  const handleSelect = (label: string) => {
    if (checked) return;
    setSelectedChoiceId(choiceIdForLabel(label));
  };

  const handleCheckOrNext = async () => {
    if (!selectedChoiceId) return;
    if (!categoryId) return;

    /*
     * Browsers only allow HTMLAudioElement.play() when it happens inside a
     * user gesture. This handler awaits an API call before it knows which
     * sound to play, and by then the gesture has expired, so the play()
     * calls below were silently rejected. Playing (muted) and immediately
     * pausing here, synchronously within the click, "unlocks" each element
     * so it can be played later once the API response comes back.
     */
    for (const sound of [correctSound, wrongSound, assessmentEndSound]) {
      const audio = sound.current;
      if (!audio) continue;

      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    }

    if (!checked) {
      try {
        const checkResult = await checkAnswerMutation.mutateAsync({
          questionId: currentQuestion.id,
          selectedChoiceId,
        });

        setCorrectChoiceId(checkResult.correctChoiceId);
        setChecked(true);
        setResults((list) => [...list.slice(0, questionNumber - 1), checkResult.isCorrect]);

        const sound = checkResult.isCorrect
          ? correctSound
          : wrongSound;

        if (sound.current) {
          sound.current.currentTime = 0;
        }
        sound.current?.play().catch(() => {});
      } catch (checkError: unknown) {
        setSubmitError(
          checkError instanceof Error
            ? checkError.message
            : "We couldn't check that answer.",
        );
      }

      return;
    }

    const newAnswer: AssessmentAnswer = {
      questionId: currentQuestion.id,
      selectedChoiceId,
    };

    const updatedAnswers = [
      ...answers.filter(
        (answer) =>
          answer.questionId !== currentQuestion.id,
      ),
      newAnswer,
    ];

    setAnswers(updatedAnswers);

    if (questionNumber === totalQuestions) {
      try {
        const submissionResult =
          await submitAssessmentMutation.mutateAsync(
            updatedAnswers,
          );

        setResult(submissionResult);

        if (assessmentEndSound.current) {
          assessmentEndSound.current.currentTime = 0;
        }
        assessmentEndSound.current?.play().catch(() => {});
      } catch (error: unknown) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "We couldn't submit your assessment.",
        );
      }

      return;
    }

    setQuestionNumber(
      (current) => current + 1,
    );

    setSelectedChoiceId(null);
    setChecked(false);
    setCorrectChoiceId(null);
  };

  const lastResult = checked ? results[questionNumber - 1] : undefined;
  const correctOption = choiceOptions.find((option) => option.id === correctChoiceId);
  const showFeedback = lastResult !== undefined;

  // Same look as the lesson: cream page, chunky Close button and counter, one card, the action in a fixed bottom bar.
  const actionText = isChecking
    ? "CHECKING..."
    : isSubmitting
      ? "SUBMITTING..."
      : !checked
        ? "CHECK"
        : questionNumber === totalQuestions
          ? "FINISH"
          : "NEXT";

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-[#FFF8E7] font-body">
      {/* HEADER */}
      <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <button
          type="button"
          aria-label="Close assessment"
          onClick={() => navigate("/student/learn")}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-b-4 border-[#CECECE] bg-white text-[#4B4B4B] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2"
        >
          <X aria-hidden="true" className="size-6" strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <ResultProgress results={results} current={questionNumber} total={totalQuestions} />
        </div>

        <span className="shrink-0 rounded-2xl bg-white px-3 py-2 text-sm font-black text-[#4B4B4B]">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* QUESTION */}
      <main className="relative mx-auto mt-4 flex w-full min-h-0 max-w-3xl flex-1 flex-col px-4 pb-4 sm:mt-6 sm:px-8">
        {showFeedback && (
          <FeedbackOverlay key={questionNumber} isCorrect={lastResult} correctAnswer={correctOption} streak={results.length - 1 - results.lastIndexOf(false)} />
        )}
        <div className={`flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-3xl border-4 bg-white p-[clamp(0.875rem,3vh,1.75rem)] shadow-[0_6px_0_#0000001a] ${showFeedback ? (lastResult ? "border-green-600" : "border-[#d95849]") : "border-[#F3E3B5]"}`}>
          {/* Small label + big question, as on the lesson steps. */}
          <p className="flex shrink-0 items-center gap-2 text-sm font-extrabold tracking-wider text-[#6B6B6B] uppercase">
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-xl bg-violet-500 text-white">
              <Sparkles className="size-4.5" />
            </span>
            {assessment.category.name} quiz · Question {currentQuestion.questionNumber}
          </p>

          <h1 className="mt-2 shrink-0 text-2xl leading-snug font-bold text-[#3C3C3C] sm:text-3xl">
            {currentQuestion.questionText}
          </h1>

          {showFeedback && <FeedbackBanner isCorrect={lastResult} correctAnswer={correctOption} />}

          {/* QUESTION MEDIA + ANSWERS */}
          {/* The arbitrary variant enlarges the shared components' check/X badges after checking, without forking them. */}
          <div className={`mx-auto mt-[clamp(0.75rem,2vh,1.5rem)] flex w-full min-h-0 max-w-2xl flex-1 flex-col ${showFeedback ? "[&_button>svg]:size-9!" : ""}`}>
            {isVideoQuestion ? (
              <VideoQuestion
                videoUrl={
                  currentQuestion.referenceMediaUrl ??
                  currentQuestion.gesture
                    .referenceVideoUrl ??
                  undefined
                }
                answers={choiceOptions.map((option) => ({
                  label: option.label,
                  text: option.text,
                }))}
                correctAnswer={labelForChoiceId(correctChoiceId)}
                selectedAnswer={labelForChoiceId(selectedChoiceId)}
                checked={checked}
                onSelect={handleSelect}
              />
            ) : (
              <HandSignQuestion
                answers={choiceOptions.map((option) => ({
                  label: option.label,
                  hand: option.text,
                  imageUrl: option.imageUrl,
                }))}
                correctAnswer={labelForChoiceId(correctChoiceId)}
                selectedAnswer={labelForChoiceId(selectedChoiceId)}
                checked={checked}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>
      </main>

      {/* BOTTOM BAR: same place and button as the lesson, so the next action is always under the thumb. */}
      <nav
        aria-label="Quiz actions"
        className="shrink-0 rounded-t-3xl border-t-4 border-hudyat-gold/30 bg-white/95 px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-w-md justify-center">
          <ElevatedButton
            text={actionText}
            disabled={!selectedChoiceId || isChecking || isSubmitting}
            icon={checked && questionNumber === totalQuestions ? Check : ArrowRight}
            iconPosition="right"
            size="lg"
            className="min-h-14 w-full text-xl! font-black!"
            onClick={handleCheckOrNext}
          />
        </div>
      </nav>
    </div>
  );
};

// PROTOTYPE, delete me: wrapper so the quiz's own hooks stay unconditional.
function TakeAssessmentOrSignTest() {
  const { categoryId } = useParams();
  const variant = useSearchParams()[0].get("variant");
  if (import.meta.env.DEV && variant && isSignTestVariant(variant)) {
    return (
      <>
        <SignTestPrototype variant={variant} categoryId={categoryId} />
        <PrototypeSwitcher variants={SIGN_TEST_VARIANTS} current={variant} />
      </>
    );
  }
  return <TakeAssessmentPage />;
}

export default TakeAssessmentOrSignTest;
