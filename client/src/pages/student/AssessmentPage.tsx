import { Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { AssessmentListCategory } from "@/api/assessment-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import LearnCard from "@/components/common/learn-card/learn-card";
import LessonPicture from "@/components/common/lesson-picture";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { quizCardStep, type QuizCardStep } from "@/lib/quiz-card";
import { starsEarned } from "@/lib/quiz-stars";
import { cn } from "@/lib/utils";

/*
 * The quiz page, built from the Learn page's own parts so it feels like the same app: the same
 * centred header, lessons grouped by learning area, and the LearnCard look (lesson world, hover lift,
 * lesson-coloured button). Each card has ONE button, always the next step (quiz → Sign test → play
 * again), so young readers never have to choose between two. The quiz's stars show the score, and a
 * ✋ badge lights up once the Sign test is passed (only in lessons the camera can check), which is
 * what unlocks the next lesson there.
 */
type QuizArea = { id: string; name: string; categories: AssessmentListCategory[] };

const BUTTON_TEXT: Record<QuizCardStep, string> = { locked: "Locked", quiz: "Quiz", sign: "Sign test", again: "Play again" };

function QuizCard({ category }: { category: AssessmentListCategory }) {
  const navigate = useNavigate();
  const step = quizCardStep(category);
  const attempt = category.latestAttempt;
  const stars = attempt ? starsEarned(Math.round(Number(attempt.score)), Math.round(Number(attempt.totalPoints))) : 0;
  const signPassed = Boolean(category.signTest.best?.passed);

  return (
    <LearnCard
      title={category.categoryName}
      color={CATEGORIES.find((item) => item.title === category.categoryName)?.color ?? "blue"}
      progress={0}
      status={step === "locked" ? "locked" : "current"}
      statusText={step === "locked" ? "Finish the lesson first" : ""}
      actionText={BUTTON_TEXT[step]}
      onClick={() => navigate(`/student/assessment/${category.categoryId}${step === "sign" ? "/sign-test" : ""}`)}
    >
      {step !== "locked" && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="flex items-end justify-center gap-1" role="img" aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={cn(i === 1 ? "size-9" : "size-7", i < stars ? "fill-hudyat-gold text-hudyat-gold" : "fill-[#F2F2F2] text-[#E0E0E0]")}
                strokeWidth={i < stars ? 1.5 : 2}
              />
            ))}
          </div>
          {category.signTest.hasModel && (
            <>
              <span aria-hidden="true" className="h-8 w-0.5 rounded-full bg-[#E5E5E5]" />
              <span
                role="img"
                aria-label={signPassed ? "Sign test passed" : "Sign test not passed yet"}
                className={cn("flex size-11 items-center justify-center rounded-full border-4", signPassed ? "border-hudyat-gold bg-[#FFF4D6]" : "border-[#E5E5E5] bg-[#F7F7F7] opacity-50 grayscale")}
              >
                <LessonPicture picture="✋" className="size-6" />
              </span>
            </>
          )}
        </div>
      )}
    </LearnCard>
  );
}

function QuizzesPage({ areas, loading, error }: { areas: QuizArea[]; loading: boolean; error: unknown }) {
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
                {area.categories.map((category) => (
                  <QuizCard key={category.categoryId} category={category} />
                ))}
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
