import { Link } from "react-router";

import LessonIcon from "@/components/staff/lesson-icon";
import ProgressBar from "@/components/staff/progress-bar";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Quiz } from "@/lib/lessons";

/** Every lesson's quiz with its status, size and submission volume. */
export default function QuizPerformanceTable({ quizzes }: { quizzes: Quiz[] }) {
  if (quizzes.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        No quizzes yet. Create one from a lesson to see it here.
      </p>
    );
  }

  const maxAttempts = Math.max(
    1,
    ...quizzes.map((quiz) => quiz.assessment.attemptCount),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Quiz</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="text-right">Questions</TableHead>
          <TableHead className="w-2/5 pr-5">Submissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.map((quiz) => {
          const { attemptCount } = quiz.assessment;
          return (
            <TableRow key={quiz.categoryId}>
              <TableCell className="py-3 pl-5">
                <Link
                  to={`/teacher/quizzes/${quiz.categoryId}`}
                  className="group flex items-center gap-3"
                >
                  <LessonIcon name={quiz.categoryName} className="size-8" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground group-hover:text-primary">
                      {quiz.assessment.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {quiz.areaName} · {quiz.categoryName}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <QuizStatusBadge status={quiz.assessment.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {quiz.assessment.questionCount}
              </TableCell>
              <TableCell className="pr-5">
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={attemptCount}
                    max={maxAttempts}
                    label={`${quiz.assessment.title} submissions`}
                    className="h-2 flex-1"
                  />
                  <span className="w-6 text-right text-xs font-bold tabular-nums">
                    {attemptCount}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
