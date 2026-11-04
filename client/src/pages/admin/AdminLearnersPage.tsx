import { useState } from "react";
import { Power, Search } from "lucide-react";

import {
  AccountStatusDialog,
  StatusBadge,
} from "@/components/staff/account-status";
import InitialsAvatar from "@/components/staff/initials-avatar";
import QueryState from "@/components/staff/query-state";
import { TableSkeleton } from "@/components/staff/skeletons";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import TablePagination from "@/components/staff/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { AdminLearner } from "@/api/admin-api";
import { useAdminLearners } from "@/hooks/use-admin-learners";
import { useSetAdminLearnerStatus } from "@/hooks/use-set-admin-learner-status";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

const STATUS_ITEMS = {
  all: "All statuses",
  active: "Active",
  deactivated: "Deactivated",
};

type StatusFilter = keyof typeof STATUS_ITEMS;

export default function AdminLearnersPage() {
  const { data: learners, isLoading, error, refetch } = useAdminLearners();
  const setLearnerStatus = useSetAdminLearnerStatus();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [statusTarget, setStatusTarget] = useState<AdminLearner | null>(null);

  const query = search.trim().toLowerCase();
  const filtered = (learners ?? []).filter(
    (learner) =>
      (status === "all" || learner.isActive === (status === "active")) &&
      (!query ||
        learner.fullName.toLowerCase().includes(query) ||
        learner.username.toLowerCase().includes(query)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const closeStatus = () => {
    setLearnerStatus.reset();
    setStatusTarget(null);
  };

  const confirmStatus = () => {
    if (!statusTarget) return;
    setLearnerStatus.mutate(
      { id: statusTarget.id, isActive: !statusTarget.isActive },
      {
        onSuccess: () => {
          setNotice(
            `${statusTarget.isActive ? "Deactivated" : "Reactivated"} ${statusTarget.fullName}.`,
          );
          closeStatus();
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Learners"
        description="View learner accounts and manage their access. Teachers create accounts and reset learner passwords."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading learners..."
        skeleton={<TableSkeleton />}
        errorText="Unable to load learners."
        onRetry={() => void refetch()}
      />

      {learners && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search learners"
                placeholder="Search learners..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl bg-white pl-9 shadow-[var(--shadow-card)]"
              />
            </div>

            <Select
              items={STATUS_ITEMS}
              value={status}
              onValueChange={(value) => {
                if (value) {
                  setStatus(value as StatusFilter);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="h-11 w-full rounded-xl bg-white sm:w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-staff">
                {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p role="status" className="text-sm font-bold text-emerald-700 empty:hidden">
            {notice}
          </p>

          <StaffCard className="overflow-hidden">
            <StaffCardHeader>
              <StaffCardTitle>
                Learners{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  ({filtered.length})
                </span>
              </StaffCardTitle>
            </StaffCardHeader>

            {filtered.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                {learners.length === 0
                  ? "No learners yet. Teachers create learner accounts."
                  : "No learners match your filters."}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Learner</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Username
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Date joined
                      </TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((learner) => (
                      <TableRow key={learner.id}>
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={learner.fullName}
                              avatarKey={learner.avatarKey}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {learner.fullName}
                              </p>
                              {/* On phones status moves here, keeping the actions on screen. */}
                              <div className="mt-1 sm:hidden">
                                <StatusBadge isActive={learner.isActive} />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {learner.username}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <StatusBadge isActive={learner.isActive} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {formatDate(learner.dateJoined)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${learner.isActive ? "Deactivate" : "Reactivate"} ${learner.fullName}`}
                            onClick={() => setStatusTarget(learner)}
                            className={learner.isActive ? "text-red-700" : undefined}
                          >
                            <Power aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={currentPage}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  noun="learners"
                  onPageChange={setPage}
                />
              </>
            )}
          </StaffCard>
        </>
      )}

      <AccountStatusDialog
        account={statusTarget}
        isPending={setLearnerStatus.isPending}
        error={setLearnerStatus.error}
        onCancel={closeStatus}
        onConfirm={confirmStatus}
      />
    </div>
  );
}
