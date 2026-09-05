import { useEffect, useRef, useState } from "react";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import VideoQuestion from "@/components/common/video-question";
import HandSignQuestion from "@/components/common/hand-sign-question";
import ElevatedButton from "@/components/ui/elavated-button";
import QuizSummary from "@/components/common/quiz-summary";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001";

type AssessmentChoice = {
  id: string;
  choiceText: string | null;
  imageUrl: string | null;
  displayOrder: number;
  gesture: {
    id: string;
    label: string;
    referenceImageUrl: string | null;
    referenceVideoUrl: string | null;
  };
};

type AssessmentQuestion = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: "IMAGE_GESTURE" | "VIDEO_GESTURE";
  referenceMediaUrl: string | null;
  points: string;
  choices: AssessmentChoice[];
};

type AssessmentData = {
  id: string;
  title: string;
  description: string | null;
  passingScore: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  questions: AssessmentQuestion[];
};

type AssessmentAnswer = {
  questionId: string;
  selectedChoiceId: string;
};

type AssessmentResult = {
  attemptId: string;
  score: string;
  totalPoints: string;
  percentage: string;
  passingScore: string;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedChoiceId: string;
    isCorrect: boolean;
    pointsEarned: string;
  }>;
};

async function getAssessment(
  categoryId: string,
): Promise<AssessmentData> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/assessments/categories/${categoryId}`,
    {
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  const body = (await response.json()) as {
    success?: boolean;
    data?: AssessmentData;
    message?: string;
  };

  if (!response.ok || !body.data) {
    throw new Error(
      body.message ?? "We couldn't load this assessment.",
    );
  }

  return body.data;
}

async function submitAssessment(
  categoryId: string,
  answers: AssessmentAnswer[],
): Promise<AssessmentResult> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/assessments/categories/${categoryId}/submit`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      body: JSON.stringify({
        answers,
      }),
    },
  );

  const body = (await response.json()) as {
    success?: boolean;
    data?: AssessmentResult;
    message?: string;
  };

  if (!response.ok || !body.data) {
    throw new Error(
      body.message ?? "We couldn't submit your assessment.",
    );
  }

  return body.data;
}

const TakeAssessmentPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const assessmentEndSound = useRef<HTMLAudioElement | null>(null);

  const [assessment, setAssessment] =
    useState<AssessmentData | null>(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [checked, setChecked] = useState(false);

  const [questionNumber, setQuestionNumber] = useState(1);

  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [result, setResult] =
    useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setError("Assessment category was not provided.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void getAssessment(categoryId)
      .then((data) => {
        if (!isMounted) return;

        setAssessment(data);
        setQuestionNumber(1);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "We couldn't load this assessment.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading assessment...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No questions are available.
        </p>
      </div>
    );
  }

  const totalQuestions = assessment.questions.length;

  const selectedChoice = currentQuestion.choices.find(
    (choice) => choice.id === selectedAnswer,
  );

  const isVideoQuestion =
    currentQuestion.questionType === "VIDEO_GESTURE";

  const handleCheckOrNext = async () => {
    if (!selectedAnswer) return;

    if (!checked) {
      setChecked(true);

      /*
       * We do NOT determine correctness here.
       *
       * The backend determines whether the selected
       * choice matches the question's correct gesture.
       *
       * This keeps the correct answer hidden from
       * the frontend.
       */

      return;
    }

    const newAnswer: AssessmentAnswer = {
      questionId: currentQuestion.id,
      selectedChoiceId: selectedAnswer,
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
      if (!categoryId) return;

      try {
        setIsSubmitting(true);

        const submissionResult =
          await submitAssessment(
            categoryId,
            updatedAnswers,
          );

        setResult(submissionResult);

        assessmentEndSound.current?.play().catch(() => {});
      } catch (submitError: unknown) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "We couldn't submit your assessment.",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setQuestionNumber(
      (current) => current + 1,
    );

    setSelectedAnswer(null);
    setChecked(false);
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6">
      {/* HEADER */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
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
      <div className="mx-auto mt-6 w-full max-w-5xl">
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
      <main className="mx-auto mt-8 w-full max-w-5xl">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-sm font-bold text-hudyat-gold">
            <Sparkles className="h-4 w-4" />
            <span>
              Question {currentQuestion.questionNumber}
            </span>
          </div>

          <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">
            {currentQuestion.questionText}
          </h2>

          {/* QUESTION MEDIA */}
          <div className="mx-auto mt-8 max-w-2xl">
            {isVideoQuestion ? (
              <VideoQuestion
                videoUrl={
                  currentQuestion.referenceMediaUrl ??
                  currentQuestion.choices[0]?.gesture
                    .referenceVideoUrl ??
                  undefined
                }
              />
            ) : (
              <HandSignQuestion
                imageUrl={
                  currentQuestion.referenceMediaUrl ??
                  currentQuestion.choices[0]?.gesture
                    .referenceImageUrl ??
                  undefined
                }
              />
            )}
          </div>

          {/* HINT */}
          <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-2xl bg-muted p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-hudyat-gold" />

            <p className="text-sm text-muted-foreground">
              Choose the sign that matches the question.
            </p>
          </div>

          {/* ANSWERS */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            {currentQuestion.choices.map(
              (choice) => {
                const isSelected =
                  selectedAnswer === choice.id;

                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={checked}
                    onClick={() =>
                      setSelectedAnswer(choice.id)
                    }
                    className={[
                      "rounded-2xl border-2 p-4 text-center transition",
                      isSelected
                        ? "border-hudyat-gold bg-hudyat-gold/10"
                        : "border-border hover:border-hudyat-gold/50",
                      checked
                        ? "cursor-default"
                        : "cursor-pointer",
                    ].join(" ")}
                  >
                    {choice.imageUrl && (
                      <img
                        src={choice.imageUrl}
                        alt=""
                        className="mx-auto mb-3 h-20 w-20 object-contain"
                      />
                    )}

                    <span className="block text-lg font-bold">
                      {choice.choiceText ??
                        choice.gesture.label}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/* SELECTED ANSWER */}
          {selectedChoice && checked && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              You selected{" "}
              <strong>
                {selectedChoice.choiceText ??
                  selectedChoice.gesture.label}
              </strong>
            </p>
          )}

          {/* ACTION */}
          <div className="mt-8 flex justify-center">
            <ElevatedButton
              text={
                isSubmitting
                  ? "SUBMITTING..."
                  : !checked
                    ? "CHECK ANSWER"
                    : questionNumber === totalQuestions
                      ? "FINISH ASSESSMENT"
                      : "NEXT"
              }
              disabled={
                !selectedAnswer || isSubmitting
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