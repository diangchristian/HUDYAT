import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  FileQuestion,
  Hand,
  PlayCircle,
  XCircle,
} from "lucide-react";

import QueryState from "@/components/staff/query-state";
import { ProfileHeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/staff/skeletons";
import InitialsAvatar from "@/components/staff/initials-avatar";
import LessonIcon from "@/components/staff/lesson-icon";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import ProgressBar from "@/components/staff/progress-bar";
import StatCard from "@/components/staff/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProgressCategory } from "@/api/progress-api";
import { useLearnerDetail } from "@/hooks/use-learner-detail";

const STATUS_PRESENTATION: Record<
  ProgressCategory["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: PlayCircle,
    className: "bg-sky-100 text-sky-800",
  },
  NOT_STARTED: {
    label: "Not started",
    icon: Circle,
    className: "bg-slate-100 text-slate-600",
  },
};

export default function StudentDetailPage() {
  const { learnerId } = useParams();
  const { data, isLoading, error, refetch } = useLearnerDetail(learnerId);

  return (
    <div className="space-y-6">
      <Link
        to="/teacher/students"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Students
      </Link>

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading student..."
        skeleton={
          <>
            <ProfileHeaderSkeleton />
            <StatGridSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />
            <TableSkeleton />
          </>
        }
        errorText="Unable to load this student."
        onRetry={() => void refetch()}
      />

      {data && (
        <>
          <StaffCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <InitialsAvatar
              name={data.learner.fullName}
              avatarKey={data.learner.avatarKey}
              className="size-16 text-2xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {data.learner.fullName}
                </h1>
                {!data.learner.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{data.learner.username}
                {data.learner.email && ` · ${data.learner.email}`} · Joined{" "}
                {formatDate(data.learner.dateJoined)}
              </p>
            </div>
          </StaffCard>

          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={BookOpen}
              label="Lessons completed"
              value={data.progress.summary.completedCategories}
              suffix={`of ${data.progress.summary.totalCategories}`}
              color="sky"
              progress={{
                value: data.progress.summary.completedCategories,
                max: data.progress.summary.totalCategories,
              }}
            />
            <StatCard
              icon={FileQuestion}
              label="Quizzes submitted"
              value={data.attempts.length}
              color="emerald"
            />
            <StatCard
              icon={Hand}
              label="Practice accuracy"
              value={
                data.practice.totalAttempts > 0
                  ? `${data.practice.accuracy}%`
                  : "—"
              }
              suffix={`${data.practice.totalAttempts} tries`}
              color="violet"
              progress={{ value: data.practice.accuracy, max: 100 }}
            />
          </section>

          <StaffCard className="overflow-hidden">
            <StaffCardHeader>
              <StaffCardTitle>Lesson progress</StaffCardTitle>
            </StaffCardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Lesson</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Latest quiz
                  </TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.progress.learningAreas.flatMap((area) =>
                  area.categories.map((category) => {
                    const status = STATUS_PRESENTATION[category.status];
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <LessonIcon name={category.name} className="size-8" />
                            <div>
                              <p className="font-bold text-foreground">
                                {category.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {area.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={category.progressPercent}
                              max={100}
                              label={`${category.name} lesson progress`}
                              barClassName="bg-staff-nav"
                              className="h-2 w-20"
                            />
                            <span className="text-xs font-semibold">
                              {category.progressPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {category.latestAssessment
                            ? `${category.latestAssessment.percentage}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Badge
                            variant="secondary"
                            className={cn("h-6 px-2.5 font-bold", status.className)}
                          >
                            <status.icon aria-hidden="true" data-icon="inline-start" />
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }),
                )}
              </TableBody>
            </Table>
          </StaffCard>

          <StaffCard className="overflow-hidden">
            <StaffCardHeader>
              <StaffCardTitle>Quiz history</StaffCardTitle>
            </StaffCardHeader>
            {data.attempts.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                This student hasn't submitted a quiz yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Quiz</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Submitted
                    </TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="pr-6 text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="py-3 pl-6 font-bold text-foreground">
                        {attempt.assessmentTitle}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {new Date(attempt.completedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {attempt.score}/{attempt.totalPoints}{" "}
                        <span className="text-muted-foreground">
                          ({attempt.percentage}%)
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        {attempt.passed ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 aria-hidden="true" className="size-4" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-600">
                            <XCircle aria-hidden="true" className="size-4" />
                            Not passed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </StaffCard>
        </>
      )}
    </div>
  );
}
