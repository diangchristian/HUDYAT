import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";

import QueryState from "@/components/staff/query-state";
import InitialsAvatar from "@/components/staff/initials-avatar";
import ProgressBar from "@/components/staff/progress-bar";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLearners } from "@/hooks/use-learners";

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data: learners, isLoading, error, refetch } = useLearners();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = search.trim().toLowerCase();
  const filtered = (learners ?? []).filter(
    (learner) =>
      !query ||
      learner.fullName.toLowerCase().includes(query) ||
      learner.username.toLowerCase().includes(query) ||
      learner.email?.toLowerCase().includes(query),
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Students"
        description="Track each learner's lesson progress and quiz results."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading students..."
        errorText="Unable to load students."
        onRetry={() => void refetch()}
      />

      {learners && (
        <>
          <div className="relative max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search students"
              placeholder="Search students..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl bg-white pl-9 shadow-[var(--shadow-card)]"
            />
          </div>

          <StaffCard className="overflow-hidden">
            <StaffCardHeader>
              <StaffCardTitle>
                Students{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  ({filtered.length})
                </span>
              </StaffCardTitle>
            </StaffCardHeader>

            {filtered.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                {learners.length === 0
                  ? "No students have signed up yet."
                  : "No students match your search."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Student</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Username
                    </TableHead>
                    <TableHead>Lessons done</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Quizzes
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Last quiz
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Date joined
                    </TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((learner) => {
                    const detailPath = `/teacher/students/${learner.id}`;

                    return (
                      <TableRow
                        key={learner.id}
                        className="cursor-pointer"
                        onClick={() => navigate(detailPath)}
                      >
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={learner.fullName}
                              avatarKey={learner.avatarKey}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground">
                                {learner.fullName}
                              </p>
                              {!learner.isActive && (
                                <Badge variant="secondary" className="mt-0.5">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {learner.username}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={learner.completedCategories}
                              max={learner.totalCategories}
                              label={`${learner.fullName} lessons completed`}
                              barClassName="bg-staff-nav"
                              className="hidden h-2 w-16 sm:block"
                            />
                            <span className="text-sm font-semibold">
                              {learner.completedCategories}/
                              {learner.totalCategories}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {learner.assessmentAttempts}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {learner.lastActivityAt
                            ? formatRelativeTime(learner.lastActivityAt)
                            : "—"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {formatDate(learner.dateJoined)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Link
                            to={detailPath}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`View ${learner.fullName}`}
                            className={cn(
                              buttonVariants({
                                variant: "ghost",
                                size: "icon",
                              }),
                              "text-primary",
                            )}
                          >
                            <Eye aria-hidden="true" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3 text-sm text-muted-foreground">
                <span>
                  Showing {pageStart + 1}–
                  {Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} students
                </span>

                {pageCount > 1 && (
                  <nav aria-label="Pagination" className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Previous page"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft aria-hidden="true" />
                    </Button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                      (pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === currentPage ? "default" : "ghost"}
                          size="icon-sm"
                          aria-current={
                            pageNumber === currentPage ? "page" : undefined
                          }
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Next page"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </nav>
                )}
              </div>
            )}
          </StaffCard>
        </>
      )}
    </div>
  );
}
