import { Link } from "react-router";
import {
  BookOpen,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  Hand,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import QuickActionList, {
  type QuickAction,
} from "@/components/staff/dashboard/quick-action-list";
import QuizPerformanceTable from "@/components/staff/dashboard/quiz-performance-table";
import RecentActivityFeed from "@/components/staff/dashboard/recent-activity-feed";
import QueryState from "@/components/staff/query-state";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StatCard from "@/components/staff/stat-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTeacherAssessments } from "@/hooks/use-teacher-assessments";
import { useTeacherDashboard } from "@/hooks/use-teacher-dashboard";
import { plural } from "@/lib/format";
import {
  flattenLessons,
  lessonsWithoutQuiz,
  quizzesOf,
  type Lesson,
} from "@/lib/lessons";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Shortcuts with live hints drawn from the lessons' quiz status. */
function buildQuickActions(lessons: Lesson[]): QuickAction[] {
  const withoutQuiz = lessonsWithoutQuiz(lessons).length;
  const drafts = lessons.filter(
    (lesson) => lesson.assessment?.status === "DRAFT",
  ).length;

  return [
    {
      label: "Create quiz",
      description: withoutQuiz
        ? `${plural(withoutQuiz, "lesson")} still need one`
        : "Every lesson has a quiz",
      to: "/teacher/quizzes",
      icon: FilePlus2,
      color: "primary",
      badge: withoutQuiz,
    },
    {
      label: "Review drafts",
      description: drafts
        ? `${plural(drafts, "draft")} waiting to publish`
        : "No drafts waiting",
      to: "/teacher/quizzes",
      icon: ClipboardCheck,
      color: "amber",
      badge: drafts,
    },
    {
      label: "Browse lessons",
      description: "See the curriculum by area",
      to: "/teacher/lessons",
      icon: BookOpen,
      color: "emerald",
    },
    {
      label: "Student progress",
      description: "Check who needs a hand",
      to: "/teacher/students",
      icon: TrendingUp,
      color: "sky",
    },
  ];
}

export default function TeacherDashboardPage() {
  const { data: user } = useCurrentUser();
  const dashboardQuery = useTeacherDashboard();
  const assessmentsQuery = useTeacherAssessments();

  const dashboard = dashboardQuery.data;
  const areas = assessmentsQuery.data;
  // Counted from the active-lesson list (not the server's all-assessment
  // totals) so the stats agree with the table and quick actions.
  const lessons = areas ? flattenLessons(areas) : [];
  const quizzes = quizzesOf(lessons);
  const publishedCount = quizzes.filter(
    (quiz) => quiz.assessment.status === "PUBLISHED",
  ).length;
  const firstName = user?.fullName.split(" ")[0] ?? "Teacher";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-primary">
          {greeting()}, {firstName}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Class overview
        </h1>
      </header>

      <QueryState
        isLoading={dashboardQuery.isLoading || assessmentsQuery.isLoading}
        error={dashboardQuery.error ?? assessmentsQuery.error}
        loadingText="Loading dashboard..."
        errorText="Unable to load the dashboard."
        onRetry={() => {
          void dashboardQuery.refetch();
          void assessmentsQuery.refetch();
        }}
      />

      {dashboard && areas && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={Users}
                label="Active students"
                value={dashboard.activeLearnerCount}
                suffix={`of ${dashboard.learnerCount}`}
                color="sky"
                progress={{
                  value: dashboard.activeLearnerCount,
                  max: dashboard.learnerCount,
                }}
              />
              <StatCard
                icon={FileCheck2}
                label="Quizzes published"
                value={publishedCount}
                suffix={`of ${plural(lessons.length, "lesson")}`}
                color="emerald"
                progress={{ value: publishedCount, max: lessons.length }}
              />
              <StatCard
                icon={Star}
                label="Average score"
                value={
                  dashboard.averageQuizScore === null
                    ? "—"
                    : `${dashboard.averageQuizScore}%`
                }
                suffix="all submissions"
                color="amber"
                progress={{ value: dashboard.averageQuizScore ?? 0, max: 100 }}
              />
              <StatCard
                icon={Hand}
                label="Practiced today"
                value={dashboard.practicedTodayCount}
                suffix={`of ${dashboard.learnerCount}`}
                color="violet"
                progress={{
                  value: dashboard.practicedTodayCount,
                  max: dashboard.learnerCount,
                }}
              />
            </section>

            <StaffCard className="overflow-hidden">
              <StaffCardHeader>
                <StaffCardTitle className="text-base">
                  Quiz performance
                </StaffCardTitle>
                <Link
                  to="/teacher/quizzes"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Manage quizzes
                </Link>
              </StaffCardHeader>
              <QuizPerformanceTable quizzes={quizzes} />
            </StaffCard>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <StaffCard className="p-2">
              <h2 className="px-3 pt-2 pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Quick actions
              </h2>
              <QuickActionList actions={buildQuickActions(lessons)} />
            </StaffCard>

            <StaffCard>
              <StaffCardHeader>
                <StaffCardTitle className="text-base">
                  Recent activity
                </StaffCardTitle>
              </StaffCardHeader>
              <RecentActivityFeed
                attempts={dashboard.recentAttempts.slice(0, 5)}
              />
            </StaffCard>
          </aside>
        </div>
      )}
    </div>
  );
}
