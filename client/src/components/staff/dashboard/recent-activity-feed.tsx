import { Link } from "react-router";
import { CheckCircle2, XCircle } from "lucide-react";

import InitialsAvatar from "@/components/staff/initials-avatar";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttemptSummary } from "@/api/teacher-api";

/** Timeline of the latest quiz submissions, newest first. */
export default function RecentActivityFeed({
  attempts,
}: {
  attempts: AttemptSummary[];
}) {
  if (attempts.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted-foreground">
        No quiz submissions yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 p-5 before:absolute before:top-8 before:bottom-8 before:left-[32px] before:w-px before:bg-border">
      {attempts.map((attempt) => (
        <li key={attempt.id} className="relative flex gap-3">
          <InitialsAvatar
            name={attempt.learnerName}
            size="sm"
            className="relative mx-0.5 mt-0.5 ring-4 ring-card"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-foreground">
              <Link
                to={`/teacher/students/${attempt.learnerId}`}
                className="font-bold hover:text-primary"
              >
                {attempt.learnerName}
              </Link>{" "}
              {attempt.passed ? "passed" : "didn't pass"}{" "}
              <span className="font-semibold">{attempt.categoryName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(attempt.completedAt)}
            </p>
          </div>
          <span
            className={cn(
              "flex h-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
              attempt.passed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {attempt.passed ? (
              <CheckCircle2 className="size-3.5" aria-label="Passed" />
            ) : (
              <XCircle className="size-3.5" aria-label="Did not pass" />
            )}
            {attempt.percentage}%
          </span>
        </li>
      ))}
    </ol>
  );
}
