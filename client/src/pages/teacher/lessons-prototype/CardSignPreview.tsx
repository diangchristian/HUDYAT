/*
 * PROTOTYPE — throwaway. Lesson card 1 · "Sign preview": the current
 * card, led by a band of the lesson's real sign images, with the quiz
 * status as a corner badge over the band.
 */
import { Link } from "react-router";
import { ArrowRight, Clock, Plus } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/lessons";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { SignThumb } from "./shared";

export default function CardSignPreview({ lesson }: { lesson: Lesson }) {
  const { data: gestures = [] } = useCategoryGestures(lesson.categoryId);
  const preview = gestures.slice(0, 4);

  return (
    <StaffCard className="flex h-full flex-col overflow-hidden">
      <div className="relative grid h-28 grid-cols-4 gap-px bg-border">
        {preview.map((gesture) => (
          <SignThumb key={gesture.id} gesture={gesture} className="size-full p-1.5" />
        ))}
        {Array.from({ length: Math.max(0, 4 - preview.length) }, (_, i) => (
          <span key={i} className="bg-muted" />
        ))}
        <QuizStatusBadge
          status={lesson.assessment?.status ?? null}
          className="absolute top-2 right-2 shadow-sm"
        />
        {gestures.length > 4 && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">
            +{gestures.length - 4} more
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <LessonIcon name={lesson.categoryName} className="-mt-10 size-12 ring-4 ring-card" />
        </div>
        <h2 className="mt-2 text-xl font-bold text-foreground">{lesson.categoryName}</h2>
        <Badge variant="secondary" className="mt-1.5 h-6 px-2.5 font-bold">
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
