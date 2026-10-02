import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Clock, Plus } from "lucide-react";

import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import QueryState from "@/components/staff/query-state";
import { CardGridSkeleton } from "@/components/staff/skeletons";
import CardSignPreview from "./lessons-prototype/CardSignPreview";
import CardStatsFooter from "./lessons-prototype/CardStatsFooter";
import CardColorHeader from "./lessons-prototype/CardColorHeader";
import LessonIcon from "@/components/staff/lesson-icon";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { flattenLessons, type Lesson } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { useTeacherAssessments } from "@/hooks/use-teacher-assessments";

const ALL = "all";

function CurrentLessonCard({ lesson }: { lesson: Lesson }) {
  return (
      <StaffCard className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <LessonIcon name={lesson.categoryName} />
          <QuizStatusBadge
            status={lesson.assessment?.status ?? null}
          />
        </div>
    
        <h2 className="mt-4 text-xl font-bold text-foreground">
          {lesson.categoryName}
        </h2>
        <Badge
          variant="secondary"
          className="mt-1.5 h-6 px-2.5 font-bold"
        >
          {lesson.areaName}
        </Badge>
        {lesson.categoryDescription && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {lesson.categoryDescription}
          </p>
        )}
    
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            Updated {formatRelativeTime(lesson.categoryUpdatedAt)}
          </span>
          <span className="font-extrabold text-primary">
            {lesson.gestureCount} signs
          </span>
        </div>
    
        <Link
          to={`/teacher/quizzes/${lesson.categoryId}`}
          className={cn(
            buttonVariants({
              variant: lesson.assessment ? "outline" : "default",
            }),
            "mt-4 h-9 rounded-full",
          )}
        >
          {lesson.assessment ? (
            <>
              Open quiz
              <ArrowRight aria-hidden="true" />
            </>
          ) : (
            <>
              <Plus aria-hidden="true" />
              Create quiz
            </>
          )}
        </Link>
      </StaffCard>
  );
}

/* PROTOTYPE: `Card` lets `?variant=` swap only the card design. */
function CurrentLessons({
  Card = CurrentLessonCard,
}: {
  Card?: (props: { lesson: Lesson }) => React.ReactNode;
}) {
  const { data: areas, isLoading, error, refetch } = useTeacherAssessments();
  const [areaFilter, setAreaFilter] = useState(ALL);

  const lessons = flattenLessons(
    (areas ?? []).filter((area) => areaFilter === ALL || area.id === areaFilter),
  );

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Lessons"
        description="Browse your FSL curriculum and check which lessons have a quiz."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading lessons..."
        skeleton={
          <CardGridSkeleton
            count={8}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6"
          />
        }
        errorText="Unable to load lessons."
        onRetry={() => void refetch()}
      />

      {areas && (
        <>
          <div
            role="group"
            aria-label="Filter by learning area"
            className="flex flex-wrap gap-2"
          >
            {[{ id: ALL, name: "All areas" }, ...areas].map((area) => {
              const isActive = areaFilter === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setAreaFilter(area.id)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                    isActive
                      ? "bg-staff-nav text-white"
                      : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {area.name}
                </button>
              );
            })}
          </div>

          {lessons.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No lessons in this learning area yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
              {lessons.map((lesson) => (
                <li key={lesson.categoryId}>
                  <Card lesson={lesson} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/*
 * PROTOTYPE — throwaway. `?variant=` switches between lessons-page
 * design explorations (dev builds only).
 */
const PROTOTYPE_VARIANTS = [
  { key: "0", name: "Current card" },
  { key: "1", name: "Card · Sign preview" },
  { key: "2", name: "Card · Stats footer" },
  { key: "3", name: "Card · Color header" },
];

const PROTOTYPE_CARDS: Record<string, (props: { lesson: Lesson }) => React.ReactNode> = {
  "1": CardSignPreview,
  "2": CardStatsFooter,
  "3": CardColorHeader,
};

function PrototypeLessons({ variant }: { variant: string }) {
  return (
    <>
      <CurrentLessons Card={PROTOTYPE_CARDS[variant]} />
      <div className="h-20" />
      <PrototypeSwitcher variants={PROTOTYPE_VARIANTS} current={variant} />
    </>
  );
}

export default function LessonsPage() {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant");

  if (import.meta.env.DEV && variant) {
    return <PrototypeLessons variant={variant} />;
  }

  return <CurrentLessons />;
}
