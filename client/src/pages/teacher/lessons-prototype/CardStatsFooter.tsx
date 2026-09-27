/*
 * PROTOTYPE — throwaway. Lesson card 2 · "Stats footer": the current
 * card's header and title, with the footer upgraded to three icon stats
 * (signs · questions · submissions) and a split action: open the quiz,
 * or peek at every sign in a dialog without leaving the page.
 */
import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Clock, FileQuestion, Hand, Images, Plus, Users } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/lessons";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import { SignThumb } from "./shared";

function SignsDialog({
  lesson,
  open,
  onOpenChange,
}: {
  lesson: Lesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: gestures = [], isLoading } = useCategoryGestures(
    open ? lesson.categoryId : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-staff sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {lesson.categoryName} signs
          </DialogTitle>
          <DialogDescription>
            {lesson.gestureCount} signs learners practice in this lesson.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading signs…</p>
        ) : (
          <ul className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
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
      </DialogContent>
    </Dialog>
  );
}

export default function CardStatsFooter({ lesson }: { lesson: Lesson }) {
  const [signsOpen, setSignsOpen] = useState(false);
  const quiz = lesson.assessment;

  const stats = [
    { icon: Hand, value: lesson.gestureCount, label: "Signs" },
    { icon: FileQuestion, value: quiz?.questionCount ?? "—", label: "Questions" },
    { icon: Users, value: quiz?.attemptCount ?? "—", label: "Taken" },
  ];

  return (
    <StaffCard className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <LessonIcon name={lesson.categoryName} />
        <QuizStatusBadge status={quiz?.status ?? null} />
      </div>

      <h2 className="mt-4 text-xl font-bold text-foreground">{lesson.categoryName}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="h-6 px-2.5 font-bold">
          {lesson.areaName}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock aria-hidden="true" className="size-3" />
          {formatRelativeTime(lesson.categoryUpdatedAt)}
        </span>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-2 pt-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted/70 px-2 py-2.5 text-center">
            <stat.icon aria-hidden="true" className="mx-auto size-4 text-primary" />
            <dd className="mt-1 text-base font-extrabold text-foreground tabular-nums">
              {stat.value}
            </dd>
            <dt className="text-[11px] font-semibold text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/teacher/quizzes/${lesson.categoryId}`}
          className={cn(
            buttonVariants(),
            "h-9 flex-1 rounded-full",
          )}
        >
          {quiz ? (
            <>
              Open quiz <ArrowRight aria-hidden="true" />
            </>
          ) : (
            <>
              <Plus aria-hidden="true" /> Create quiz
            </>
          )}
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full"
          aria-label={`View ${lesson.categoryName} signs`}
          title="View signs"
          onClick={() => setSignsOpen(true)}
        >
          <Images aria-hidden="true" />
        </Button>
      </div>

      <SignsDialog lesson={lesson} open={signsOpen} onOpenChange={setSignsOpen} />
    </StaffCard>
  );
}
