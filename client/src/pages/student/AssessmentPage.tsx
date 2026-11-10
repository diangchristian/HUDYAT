import { Hand, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { AssessmentListCategory } from "@/api/assessment-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import LearnCard from "@/components/common/learn-card/learn-card";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { starsEarned } from "@/lib/quiz-stars";

/*
 * The quiz page, built from the Learn page's own parts so it feels like the same app:
 * the same centred header, lessons grouped by learning area, and the same LearnCard
 * (lesson world, hover lift, lesson-coloured button) with stars in place of the progress bar.
 * Once a quiz is passed, lessons the camera can check offer the optional Sign test under the card.
 */
type QuizArea = { id: string; name: string; categories: AssessmentListCategory[] };

function quizCard(category: AssessmentListCategory) {
  const attempt = category.latestAttempt;
  const score = attempt ? Math.round(Number(attempt.score)) : 0;
  const total = attempt ? Math.round(Number(attempt.totalPoints)) : category.totalQuestions;

  if (!category.isUnlocked) {
    return { status: "locked" as const, statusText: `Finish the ${category.categoryName} lesson first`, actionText: "Locked", stars: 0 };
  }
  if (category.status === "completed") {
    return { status: "completed" as const, statusText: `Score ${score} / ${total}`, actionText: "Play again", stars: starsEarned(score, total) };
  }
  if (attempt) {
    return { status: "current" as const, statusText: `Last try ${score} / ${total}`, actionText: "Try again", stars: starsEarned(score, total) };
  }
  return { status: "current" as const, statusText: `${category.totalQuestions} questions`, actionText: "Start quiz", stars: 0 };
}

// The camera step's colour and hand, as in the lesson's Try step, so children know it means signing.
function SignTestButton({ category }: { category: AssessmentListCategory }) {
  const navigate = useNavigate();
  const { available, best } = category.signTest;
  if (!available) return null;
  const text = best?.passed ? "Sign test · passed" : best ? `Sign test · best ${best.score}/${best.total}` : "Try the sign test";
  return (
    <button
      type="button"
      onClick={() => navigate(`/student/assessment/${category.categoryId}/sign-test`)}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-[#9F1239] bg-[#E11D48] px-3 text-sm font-extrabold tracking-widest text-white uppercase focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-0.5 active:border-b-2"
    >
      {best?.passed ? <Star aria-hidden="true" className="size-5 fill-white" /> : <Hand aria-hidden="true" className="size-5" />}
      {text}
    </button>
  );
}

function QuizzesPage({ areas, loading, error }: { areas: QuizArea[]; loading: boolean; error: unknown }) {
  const navigate = useNavigate();

  return (
    <section className="w-full font-body" aria-labelledby="quiz-heading">
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          Quizzes
        </span>
        <h1 id="quiz-heading" className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          Show what you've learned!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Finish a lesson, then earn its stars here.</p>
      </header>

      {loading && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          Loading your quizzes...
        </p>
      )}

      {!loading && Boolean(error) && (
        <p className="mt-12 text-center text-sm font-bold text-destructive" role="alert">
          We couldn't load your quizzes right now.
        </p>
      )}

      {!loading && !error && areas.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          No quizzes are available yet.
        </p>
      )}

      {!loading && !error && areas.length > 0 && (
        <div className="mt-10">
          {areas.map((area) => (
            <section key={area.id} aria-labelledby={`quiz-area-${area.id}`} className="mb-12 last:mb-0">
              <h2 id={`quiz-area-${area.id}`} className="mb-4 text-lg font-bold text-foreground sm:text-xl">
                {area.name}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {area.categories.map((category) => {
                  const card = quizCard(category);
                  return (
                    <div key={category.categoryId} className="flex flex-col gap-3">
                      <LearnCard
                        title={category.categoryName}
                        color={CATEGORIES.find((item) => item.title === category.categoryName)?.color ?? "blue"}
                        progress={0}
                        status={card.status}
                        statusText={card.statusText}
                        stars={card.stars}
                        actionText={card.actionText}
                        onClick={() => navigate(`/student/assessment/${category.categoryId}`)}
                      />
                      <SignTestButton category={category} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AssessmentPage() {
  const { data, isLoading, error } = useAssessmentList();
  return <QuizzesPage areas={data?.learningAreas ?? []} loading={isLoading} error={error} />;
}
