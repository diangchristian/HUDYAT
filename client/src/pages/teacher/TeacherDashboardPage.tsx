import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Hand,
  Star,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import QueryState from "@/components/staff/query-state";
import InitialsAvatar from "@/components/staff/initials-avatar";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import StatCard from "@/components/staff/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTeacherDashboard } from "@/hooks/use-teacher-dashboard";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const ACTIONS: Array<{
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: LucideIcon;
  iconTone: string;
  buttonTone: string;
}> = [
  {
    title: "Manage Lessons",
    description:
      "Browse the curriculum by learning area and see which lessons still need a quiz.",
    to: "/teacher/lessons",
    cta: "Go to Lessons",
    icon: BookOpen,
    iconTone: "bg-staff-nav text-white",
    buttonTone: "bg-staff-brand hover:bg-staff-brand/90",
  },
  {
    title: "Manage Quizzes",
    description:
      "Author quiz questions, publish them to learners and track submissions.",
    to: "/teacher/quizzes",
    cta: "Go to Quizzes",
    icon: FileQuestion,
    iconTone: "bg-green-300 text-green-950",
    buttonTone: "bg-green-800 hover:bg-green-800/90",
  },
  {
    title: "View Students",
    description:
      "Monitor each learner's lesson progress, quiz results and practice.",
    to: "/teacher/students",
    cta: "Go to Students",
    icon: Users,
    iconTone: "bg-amber-200 text-amber-900",
    buttonTone: "bg-slate-500 hover:bg-slate-500/90",
  },
];

export default function TeacherDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: dashboard, isLoading, error, refetch } = useTeacherDashboard();

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title={`${greeting()}, ${user?.fullName ?? "Teacher"}!`}
        description="Here's an overview of your classroom activity today."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading dashboard..."
        errorText="Unable to load the dashboard."
        onRetry={() => void refetch()}
      />

      {dashboard && (
        <>
          <section
            aria-label="Summary"
            className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
          >
            <StatCard
              icon={Users}
              label="Total students"
              value={dashboard.learnerCount}
              tone="bg-staff-nav text-white"
            />
            <StatCard
              icon={BookOpen}
              label="Active lessons"
              value={dashboard.categoryCount}
              tone="bg-green-300 text-green-950"
            />
            <StatCard
              icon={Star}
              label="Avg quiz score"
              value={
                dashboard.averageQuizScore === null
                  ? "—"
                  : `${dashboard.averageQuizScore}%`
              }
              tone="bg-amber-200 text-amber-900"
            />
            <StatCard
              icon={Hand}
              label="Practiced today"
              value={dashboard.practicedTodayCount}
              tone="bg-blue-200 text-blue-900"
            />
          </section>

          <section
            aria-label="Quick actions"
            className="grid gap-4 md:grid-cols-3 lg:gap-6"
          >
            {ACTIONS.map((action) => (
              <StaffCard key={action.to} className="flex flex-col p-6">
                <span
                  className={cn(
                    "flex size-16 items-center justify-center rounded-2xl",
                    action.iconTone,
                  )}
                >
                  <action.icon aria-hidden="true" className="size-7" />
                </span>
                <h2 className="mt-6 font-body text-xl font-extrabold text-foreground">
                  {action.title}
                </h2>
                <p className="mt-2 mb-6 flex-1 text-muted-foreground">
                  {action.description}
                </p>
                <Link
                  to={action.to}
                  className={cn(
                    buttonVariants(),
                    "h-11 w-full rounded-full text-white",
                    action.buttonTone,
                  )}
                >
                  {action.cta}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </StaffCard>
            ))}
          </section>

          <StaffCard>
            <StaffCardHeader>
              <StaffCardTitle>Recent quiz results</StaffCardTitle>
              <Link
                to="/teacher/students"
                className="text-sm font-bold text-primary hover:underline"
              >
                All students
              </Link>
            </StaffCardHeader>

            {dashboard.recentAttempts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No learner has submitted a quiz yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {dashboard.recentAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      to={`/teacher/students/${attempt.learnerId}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60 sm:px-6"
                    >
                      <InitialsAvatar name={attempt.learnerName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground">
                          {attempt.learnerName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {attempt.assessmentTitle} ·{" "}
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold">
                        {attempt.passed ? (
                          <CheckCircle2
                            aria-label="Passed"
                            className="size-4 text-emerald-600"
                          />
                        ) : (
                          <XCircle
                            aria-label="Did not pass"
                            className="size-4 text-red-500"
                          />
                        )}
                        {attempt.percentage}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </StaffCard>
        </>
      )}
    </div>
  );
}
