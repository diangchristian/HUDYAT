import { BookOpen, GraduationCap, UserX, Users } from "lucide-react";

import ProgressBar from "@/components/staff/progress-bar";
import QueryState from "@/components/staff/query-state";
import { StatGridSkeleton, TableSkeleton } from "@/components/staff/skeletons";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import StatCard from "@/components/staff/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVITY_ACTION_LABELS } from "@/api/admin-api";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { formatRelativeTime } from "@/lib/format";

export default function AdminOverviewPage() {
  const { data, isLoading, error, refetch } = useAdminOverview();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Overview"
        description="Accounts and recent activity across HUDYAT."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading overview..."
        skeleton={
          <>
            <StatGridSkeleton
              count={4}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            />
            <TableSkeleton />
          </>
        }
        errorText="Unable to load the overview."
        onRetry={() => void refetch()}
      />

      {data && (
        <>
          <section
            aria-label="System totals"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              icon={GraduationCap}
              label="Active teachers"
              value={data.teachers.active}
              suffix={`of ${data.teachers.total}`}
              color="primary"
            />
            <StatCard
              icon={Users}
              label="Active learners"
              value={data.learners.active}
              suffix={`of ${data.learners.total}`}
              color="sky"
            />
            <StatCard
              icon={UserX}
              label="Deactivated accounts"
              value={data.deactivatedAccounts}
              color="amber"
            />
            <StatCard
              icon={BookOpen}
              label="Active lessons"
              value={data.lessons.active}
              suffix={`of ${data.lessons.total}`}
              color="emerald"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <StaffCard className="overflow-hidden">
              <StaffCardHeader>
                <StaffCardTitle>Quiz pass rate by lesson</StaffCardTitle>
              </StaffCardHeader>
              {data.passRates.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No completed quizzes yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Lesson</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead className="pr-6">Pass rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.passRates.map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell className="pl-6 font-bold">
                          {row.lesson}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.attempts}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={row.passRate}
                              max={100}
                              label={`${row.lesson} pass rate`}
                              className="hidden h-2 w-20 sm:block"
                            />
                            <span className="font-semibold tabular-nums">
                              {row.passRate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </StaffCard>

            <StaffCard>
              <StaffCardHeader>
                <StaffCardTitle>Recent activity</StaffCardTitle>
              </StaffCardHeader>
              {data.recentActivity.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentActivity.map((entry) => (
                    <li key={entry.id} className="px-5 py-3 sm:px-6">
                      <p className="text-sm font-bold text-foreground [overflow-wrap:anywhere]">
                        {ACTIVITY_ACTION_LABELS[entry.action]}: {entry.target}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.actor} · {formatRelativeTime(entry.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </StaffCard>
          </div>
        </>
      )}
    </div>
  );
}
