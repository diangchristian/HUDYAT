/*
 * PROTOTYPE — throwaway. Variant A: "Curriculum path" — each learning
 * area is a section; its lessons sit on a numbered vertical track in the
 * order learners unlock them. Coverage (which lessons lack a quiz) is
 * summarised per area; each row previews a strip of its signs.
 */
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import ProgressBar from "@/components/staff/progress-bar";
import { cn } from "@/lib/utils";
import type { AssessmentListArea } from "@/api/teacher-api";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { flattenLessons, type Lesson } from "@/lib/lessons";
import { QuizPill, SignThumb } from "./shared";

function SignStrip({ categoryId }: { categoryId: string }) {
  const { data: gestures = [] } = useCategoryGestures(categoryId);
  const shown = gestures.slice(0, 6);
  const rest = gestures.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((gesture) => (
        <SignThumb
          key={gesture.id}
          gesture={gesture}
          className="size-9 rounded-lg border-2 border-white shadow-sm"
        />
      ))}
      {rest > 0 && (
        <span className="flex size-9 items-center justify-center rounded-lg border-2 border-white bg-muted text-xs font-bold text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
}

function LessonRow({ lesson, step, isLast }: { lesson: Lesson; step: number; isLast: boolean }) {
  return (
    <li className="relative flex gap-4">
      {/* Track */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
            lesson.assessment?.status === "PUBLISHED"
              ? "bg-staff-nav text-white"
              : "border-2 border-dashed border-border bg-white text-muted-foreground",
          )}
        >
          {step}
        </span>
        {!isLast && <span className="w-0.5 flex-1 bg-border" />}
      </div>

      <Link
        to={`/teacher/quizzes/${lesson.categoryId}`}
        className="group mb-4 flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LessonIcon name={lesson.categoryName} />
          <div className="min-w-0">
            <p className="font-bold text-foreground group-hover:text-primary">
              {lesson.categoryName}
            </p>
            <p className="text-xs text-muted-foreground">
              {lesson.gestureCount} signs
              {lesson.assessment &&
                ` · ${lesson.assessment.questionCount} quiz questions`}
            </p>
          </div>
        </div>
        <SignStrip categoryId={lesson.categoryId} />
        <div className="flex items-center gap-2 sm:w-44 sm:justify-end">
          <QuizPill lesson={lesson} />
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </Link>
    </li>
  );
}

export default function VariantA({ areas }: { areas: AssessmentListArea[] }) {
  const all = flattenLessons(areas);
  const live = all.filter((l) => l.assessment?.status === "PUBLISHED").length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Curriculum
          </h1>
          <p className="text-muted-foreground">
            Lessons in the order learners unlock them.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-1 flex justify-between text-sm">
            <span className="font-semibold text-muted-foreground">Quiz coverage</span>
            <span className="font-bold">
              {live}/{all.length} lessons
            </span>
          </p>
          <ProgressBar value={live} max={all.length} label="Quiz coverage" className="h-2" />
        </div>
      </header>

      {areas.map((area) => {
        const lessons = flattenLessons([area]);
        const missing = lessons.filter((l) => !l.assessment).length;
        return (
          <section key={area.id} aria-labelledby={`area-${area.id}`}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 id={`area-${area.id}`} className="text-xl font-bold text-foreground">
                {area.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {lessons.length} lessons
                {missing > 0 && (
                  <span className="font-semibold text-rose-600"> · {missing} without a quiz</span>
                )}
              </span>
            </div>
            <ol>
              {lessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.categoryId}
                  lesson={lesson}
                  step={index + 1}
                  isLast={index === lessons.length - 1}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
