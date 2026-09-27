/*
 * PROTOTYPE — throwaway. Lesson card 3 · "Color header": a header band
 * in the lesson's own category color carrying the icon and title, a row
 * of sign thumbnails overlapping the band's edge, then the current
 * card's footer and action.
 */
import { Link } from "react-router";
import { ArrowRight, Clock, Plus } from "lucide-react";

import { lessonPresentation } from "@/components/staff/lesson-presentation";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/lessons";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { SignThumb } from "./shared";

export default function CardColorHeader({ lesson }: { lesson: Lesson }) {
  const { icon: Icon, theme } = lessonPresentation(lesson.categoryName);
  const { data: gestures = [] } = useCategoryGestures(lesson.categoryId);
  const shown = gestures.slice(0, 5);
  const rest = gestures.length - shown.length;

  return (
    <StaffCard className="flex h-full flex-col overflow-hidden">
      <div className={cn("relative px-5 pt-5 pb-10", theme.bg)}>
        <Icon
          aria-hidden="true"
          className={cn("absolute -right-3 -bottom-4 size-24 opacity-15", theme.icon)}
        />
        <div className="relative flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
            <Icon aria-hidden="true" className={cn("size-5", theme.icon)} />
          </span>
          <QuizStatusBadge status={lesson.assessment?.status ?? null} className="shadow-sm" />
        </div>
        <h2 className="relative mt-3 text-xl font-extrabold text-foreground">
          {lesson.categoryName}
        </h2>
        <p className="relative text-xs font-bold text-foreground/60">{lesson.areaName}</p>
      </div>

      <div className="-mt-6 flex items-center -space-x-2 px-5">
        {shown.map((gesture) => (
          <SignThumb
            key={gesture.id}
            gesture={gesture}
            className="size-11 rounded-xl border-2 border-white shadow-md"
          />
        ))}
        {rest > 0 && (
          <span className="flex size-11 items-center justify-center rounded-xl border-2 border-white bg-muted text-xs font-bold text-muted-foreground shadow-md">
            +{rest}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4">
        {lesson.categoryDescription && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {lesson.categoryDescription}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            Updated {formatRelativeTime(lesson.categoryUpdatedAt)}
          </span>
          <span className="font-extrabold text-primary">{lesson.gestureCount} signs</span>
        </div>

        <Link
          to={`/teacher/quizzes/${lesson.categoryId}`}
          className={cn(
            buttonVariants({ variant: lesson.assessment ? "outline" : "default" }),
            "mt-4 h-9 rounded-full",
          )}
        >
          {lesson.assessment ? (
            <>
              Open quiz <ArrowRight aria-hidden="true" />
            </>
          ) : (
            <>
              <Plus aria-hidden="true" /> Create quiz
            </>
          )}
        </Link>
      </div>
    </StaffCard>
  );
}
