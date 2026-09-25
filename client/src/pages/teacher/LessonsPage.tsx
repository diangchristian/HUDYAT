import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Clock, Plus } from "lucide-react";

import QueryState from "@/components/staff/query-state";
import LessonIcon from "@/components/staff/lesson-icon";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTeacherAssessments } from "@/hooks/use-teacher-assessments";

const ALL = "all";

export default function LessonsPage() {
  const { data: areas, isLoading, error, refetch } = useTeacherAssessments();
  const [areaFilter, setAreaFilter] = useState(ALL);

  const lessons = (areas ?? [])
    .filter((area) => areaFilter === ALL || area.id === areaFilter)
    .flatMap((area) =>
      area.categories.map((category) => ({ ...category, areaName: area.name })),
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
                  <StaffCard className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <LessonIcon name={lesson.categoryName} />
                      <QuizStatusBadge
                        status={lesson.assessment?.status ?? null}
                      />
                    </div>

                    <h2 className="mt-4 font-body text-xl font-bold text-foreground">
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

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs">
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
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
