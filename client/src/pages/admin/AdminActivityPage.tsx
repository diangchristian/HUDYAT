import { useState } from "react";

import QueryState from "@/components/staff/query-state";
import { TableSkeleton } from "@/components/staff/skeletons";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import TablePagination from "@/components/staff/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACTIVITY_ACTION_LABELS,
  type ActivityAction,
} from "@/api/admin-api";
import { useAdminActivity } from "@/hooks/use-admin-activity";
import { formatRelativeTime } from "@/lib/format";

const ACTION_ITEMS = { all: "All actions", ...ACTIVITY_ACTION_LABELS };

const ROLE_LABELS = { ADMIN: "Admin", TEACHER: "Teacher" };

export default function AdminActivityPage() {
  const [action, setAction] = useState<ActivityAction | "all">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminActivity({
    ...(action !== "all" && { action }),
    page,
  });

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Activity log"
        description="Account changes and lesson edits by admins and teachers. Passwords are never recorded."
      />

      <Select
        items={ACTION_ITEMS}
        value={action}
        onValueChange={(value) => {
          if (value) {
            setAction(value);
            setPage(1);
          }
        }}
      >
        <SelectTrigger
          aria-label="Filter by action"
          className="h-11 w-full rounded-xl bg-white sm:w-56"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="font-staff">
          {Object.entries(ACTION_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading activity..."
        skeleton={<TableSkeleton />}
        errorText="Unable to load the activity log."
        onRetry={() => void refetch()}
      />

      {data && (
        <StaffCard className="overflow-hidden">
          <StaffCardHeader>
            <StaffCardTitle>
              Entries{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                ({data.total})
              </span>
            </StaffCardTitle>
          </StaffCardHeader>

          {data.entries.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              {action === "all"
                ? "No activity yet."
                : "No activity matches this filter."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="hidden md:table-cell">By</TableHead>
                    <TableHead className="hidden pr-6 sm:table-cell">
                      When
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="py-3 pl-6 font-bold">
                        {ACTIVITY_ACTION_LABELS[entry.action]}
                        {/* On phones the time moves here, so nothing needs sideways scrolling. */}
                        <p className="text-xs font-normal text-muted-foreground sm:hidden">
                          {formatRelativeTime(entry.at)}
                        </p>
                      </TableCell>
                      <TableCell>{entry.target}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {entry.actor} ({ROLE_LABELS[entry.actorRole]})
                      </TableCell>
                      <TableCell className="hidden pr-6 text-muted-foreground sm:table-cell">
                        {formatRelativeTime(entry.at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                noun="entries"
                onPageChange={setPage}
              />
            </>
          )}
        </StaffCard>
      )}
    </div>
  );
}
