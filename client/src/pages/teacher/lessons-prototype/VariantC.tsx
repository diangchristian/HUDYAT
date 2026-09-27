/*
 * PROTOTYPE — throwaway. Variant C: "Browse & inspect" — master/detail.
 * A compact, searchable lesson list grouped by area on the left; the
 * selected lesson's quiz stats and full sign set on the right. Drill in
 * without leaving the page.
 */
import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Plus, Search } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AssessmentListArea } from "@/api/teacher-api";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { flattenLessons, type Lesson } from "@/lib/lessons";
import { QuizPill, SignThumb } from "./shared";

function LessonDetail({ lesson }: { lesson: Lesson }) {
  const { data: gestures = [], isLoading } = useCategoryGestures(lesson.categoryId);
  const quiz = lesson.assessment;

  const stats = [
    ["Signs", lesson.gestureCount],
    ["Questions", quiz?.questionCount ?? "—"],
    ["Submissions", quiz?.attemptCount ?? "—"],
    ["Pass mark", quiz ? `${quiz.passingScore}%` : "—"],
  ] as const;

  return (
    <StaffCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-br from-accent to-white p-6 sm:flex-row sm:items-center">
        <LessonIcon name={lesson.categoryName} className="size-14" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {lesson.areaName}
          </p>
          <h2 className="text-2xl font-extrabold text-foreground">
            {lesson.categoryName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Updated {formatRelativeTime(lesson.categoryUpdatedAt)}
          </p>
        </div>
        <Link
          to={`/teacher/quizzes/${lesson.categoryId}`}
          className={cn(buttonVariants(), "h-10 rounded-full px-5 font-bold")}
        >
          {quiz ? (
            <>
              Open quiz <ArrowRight className="size-4" />
            </>
          ) : (
            <>
              <Plus className="size-4" /> Create quiz
            </>
          )}
        </Link>
      </div>

      <dl className="grid grid-cols-2 divide-border border-b border-border sm:grid-cols-4 sm:divide-x">
        {stats.map(([label, value]) => (
          <div key={label} className="p-4 text-center">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="text-xl font-extrabold text-foreground tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Signs in this lesson</h3>
          {quiz ? <QuizStatusBadge status={quiz.status} /> : <QuizPill lesson={lesson} />}
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading signs…</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {gestures.map((gesture) => (
              <li key={gesture.id} className="overflow-hidden rounded-xl border border-border">
                <SignThumb gesture={gesture} className="aspect-square w-full p-1.5" />
                <p className="truncate border-t border-border px-2 py-1 text-center text-xs font-bold">
                  {gesture.label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StaffCard>
  );
}

export default function VariantC({ areas }: { areas: AssessmentListArea[] }) {
  const all = flattenLessons(areas);
  const [selectedId, setSelectedId] = useState(all[0]?.categoryId ?? null);
  const [query, setQuery] = useState("");
  const selected = all.find((lesson) => lesson.categoryId === selectedId) ?? all[0];
  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Lessons</h1>
        <p className="text-muted-foreground">
          Pick a lesson to see its signs and quiz at a glance.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <StaffCard className="p-2 lg:sticky lg:top-8">
          <div className="relative p-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search lessons"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <nav aria-label="Lessons" className="max-h-[65vh] overflow-y-auto">
            {areas.map((area) => {
              const lessons = flattenLessons([area]).filter((l) =>
                l.categoryName.toLowerCase().includes(q),
              );
              if (lessons.length === 0) return null;
              return (
                <div key={area.id} className="mt-2">
                  <p className="px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {area.name}
                  </p>
                  {lessons.map((lesson) => {
                    const active = lesson.categoryId === selected?.categoryId;
                    const status = lesson.assessment?.status;
                    return (
                      <button
                        key={lesson.categoryId}
                        type="button"
                        onClick={() => setSelectedId(lesson.categoryId)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                          active ? "bg-staff-nav text-white" : "hover:bg-muted",
                        )}
                      >
                        <LessonIcon name={lesson.categoryName} className="size-8" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {lesson.categoryName}
                          </span>
                          <span className={cn("block text-xs", active ? "text-white/80" : "text-muted-foreground")}>
                            {lesson.gestureCount} signs
                          </span>
                        </span>
                        <span
                          title={status ?? "No quiz"}
                          className={cn(
                            "size-2.5 rounded-full",
                            status === "PUBLISHED" && "bg-emerald-400",
                            status === "DRAFT" && "bg-amber-400",
                            status === "ARCHIVED" && "bg-slate-400",
                            !status && "bg-rose-400",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </StaffCard>

        {selected ? (
          <LessonDetail lesson={selected} />
        ) : (
          <p className="text-muted-foreground">No lessons yet.</p>
        )}
      </div>
    </div>
  );
}
