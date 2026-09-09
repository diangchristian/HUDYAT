import { useEffect, useRef, useState } from "react";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

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
        onContinue={() => {
          navigate("/student/learn");
        }}
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

    if (!checked) {
      try {
        const checkResult = await checkAnswerMutation.mutateAsync({
          questionId: currentQuestion.id,
          selectedChoiceId,
        });

        setCorrectChoiceId(checkResult.correctChoiceId);
        setChecked(true);

        const sound = checkResult.isCorrect
          ? correctSound
          : wrongSound;

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

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background px-4 py-6 sm:px-6">
      {/* HEADER */}
      <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            Assessment
          </p>

          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {assessment.category.name}
          </h1>
        </div>

        <button
          type="button"
          aria-label="Close assessment"
          onClick={() => navigate("/student/learn")}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* PROGRESS */}
      <div className="mx-auto mt-6 w-full max-w-5xl shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            Question {questionNumber}
          </span>

          <span className="text-muted-foreground">
            {totalQuestions} questions
          </span>
        </div>

        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={questionNumber}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        >
          <div
            className="h-full rounded-full bg-hudyat-gold transition-all"
            style={{
              width: `${
                (questionNumber / totalQuestions) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* QUESTION */}
      <main className="mx-auto mt-[clamp(1rem,4vh,2rem)] flex w-full min-h-0 max-w-5xl flex-1 flex-col">
        <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-3xl border bg-card p-[clamp(0.875rem,3vh,2rem)] shadow-sm">
          <div className="flex shrink-0 items-center gap-2 text-sm font-bold text-hudyat-gold">
            <Sparkles className="h-4 w-4" />
            <span>
              Question {currentQuestion.questionNumber}
            </span>
          </div>

          <h2 className="mt-[clamp(0.5rem,1.5vh,1.5rem)] shrink-0 text-center text-xl font-bold text-foreground sm:text-2xl">
            {currentQuestion.questionText}
          </h2>

          {/* HINT */}
          <div className="mx-auto mt-[clamp(0.5rem,1.5vh,1.5rem)] flex w-full max-w-2xl shrink-0 items-start gap-3 rounded-2xl bg-muted p-[clamp(0.5rem,1.5vh,1rem)]">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-hudyat-gold" />

            <p className="text-sm text-muted-foreground">
              Choose the sign that matches the question.
            </p>
          </div>

          {/* QUESTION MEDIA + ANSWERS */}
          <div className="mx-auto mt-[clamp(0.75rem,2vh,2rem)] flex w-full min-h-0 max-w-2xl flex-1 flex-col">
            {isVideoQuestion ? (
              <VideoQuestion
                videoUrl={
                  currentQuestion.referenceMediaUrl ??
                  currentQuestion.choices[0]?.gesture
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
                imageUrl={
                  currentQuestion.referenceMediaUrl ??
                  currentQuestion.choices[0]?.gesture
                    .referenceImageUrl ??
                  undefined
                }
                answers={choiceOptions.map((option) => ({
                  label: option.label,
                  hand: option.text,
                }))}
                correctAnswer={labelForChoiceId(correctChoiceId)}
                selectedAnswer={labelForChoiceId(selectedChoiceId)}
                checked={checked}
                onSelect={handleSelect}
              />
            )}
          </div>

          {/* ACTION */}
          <div className="mt-[clamp(0.75rem,2vh,2rem)] flex shrink-0 justify-center">
            <ElevatedButton
              text={
                isChecking
                  ? "CHECKING..."
                  : isSubmitting
                    ? "SUBMITTING..."
                    : !checked
                      ? "CHECK ANSWER"
                      : questionNumber === totalQuestions
                        ? "FINISH ASSESSMENT"
                        : "NEXT"
              }
              disabled={
                !selectedChoiceId || isChecking || isSubmitting
              }
              icon={Sparkles}
              iconPosition="right"
              onClick={handleCheckOrNext}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeAssessmentPage;
