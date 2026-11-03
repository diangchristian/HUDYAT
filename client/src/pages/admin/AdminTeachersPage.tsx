import { useState } from "react";
import { Check, Copy, KeyRound, Pencil, Plus, Power, Search } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminTeacher, TeacherInput } from "@/api/admin-api";
import { useAdminTeachers } from "@/hooks/use-admin-teachers";
import { useCreateTeacher } from "@/hooks/use-create-teacher";
import { useResetTeacherPassword } from "@/hooks/use-reset-teacher-password";
import { useSetTeacherStatus } from "@/hooks/use-set-teacher-status";
import { useUpdateTeacher } from "@/hooks/use-update-teacher";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

type FormErrors = Partial<Record<keyof TeacherInput, string>>;

const FIELDS: Array<{
  key: keyof TeacherInput;
  label: string;
  type: string;
  required: boolean;
}> = [
  { key: "fullName", label: "Full name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "contactNumber", label: "Contact number", type: "tel", required: false },
];

function validate(values: TeacherInput): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter the teacher's full name.";
  if (!values.username.trim()) errors.username = "Enter a username for logging in.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email, like name@school.edu.";
  }
  return errors;
}

function TeacherForm({
  teacher,
  isSaving,
  serverError,
  onCancel,
  onSave,
}: {
  teacher: AdminTeacher | null;
  isSaving: boolean;
  serverError: Error | null;
  onCancel: () => void;
  onSave: (values: TeacherInput) => void;
}) {
  const [values, setValues] = useState<TeacherInput>({
    fullName: teacher?.fullName ?? "",
    username: teacher?.username ?? "",
    email: teacher?.email ?? "",
    contactNumber: teacher?.contactNumber ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSave(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {FIELDS.map(({ key, label, type, required }) => {
        const id = `teacher-${key}`;
        const error = errors[key];

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={id} className="font-bold">
              {label}
              {!required && (
                <span className="font-medium text-muted-foreground">
                  (optional)
                </span>
              )}
            </Label>
            <Input
              id={id}
              type={type}
              required={required}
              value={values[key]}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) =>
                setValues((current) => ({ ...current, [key]: e.target.value }))
              }
              className="h-10"
            />
            {error && (
              <p id={`${id}-error`} className="text-sm font-bold text-red-600">
                {error}
              </p>
            )}
          </div>
        );
      })}

      {serverError && (
        <p role="alert" className="text-sm font-bold text-red-600">
          {serverError.message}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={isSaving}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-full" disabled={isSaving}>
          {isSaving ? "Saving..." : teacher ? "Save changes" : "Add teacher"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TemporaryPasswordDialog({
  issued,
  onClose,
}: {
  issued: { name: string; password: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const close = () => {
    setCopied(false);
    onClose();
  };

  const copy = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.password);
    setCopied(true);
  };

  return (
    <Dialog
      open={Boolean(issued)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="font-staff">
        <DialogHeader>
          <DialogTitle>Temporary password for {issued?.name}</DialogTitle>
          <DialogDescription>
            This is only shown once. Give it to the teacher directly. They'll
            have to change it the next time they log in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
          <code className="min-w-0 flex-1 text-base font-bold [overflow-wrap:anywhere]">
            {issued?.password}
          </code>
          {/* The clipboard needs HTTPS, so it's missing on plain-http LAN testing. */}
          {navigator.clipboard && (
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button className="rounded-full" onClick={close}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTeachersPage() {
  const { data: teachers, isLoading, error, refetch } = useAdminTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const resetPassword = useResetTeacherPassword();
  const setStatus = useSetTeacherStatus();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [formTeacher, setFormTeacher] = useState<AdminTeacher | "new" | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<AdminTeacher | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminTeacher | null>(null);
  const [issued, setIssued] = useState<{
    name: string;
    password: string;
  } | null>(null);

  const query = search.trim().toLowerCase();
  const filtered = (teachers ?? []).filter(
    (teacher) =>
      !query ||
      teacher.fullName.toLowerCase().includes(query) ||
      teacher.username.toLowerCase().includes(query) ||
      teacher.email?.toLowerCase().includes(query),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const closeForm = () => {
    createTeacher.reset();
    updateTeacher.reset();
    setFormTeacher(null);
  };

  const saveTeacher = (values: TeacherInput) => {
    if (formTeacher === "new") {
      createTeacher.mutate(values, {
        onSuccess: ({ teacher, temporaryPassword }) => {
          setIssued({ name: teacher.fullName, password: temporaryPassword });
          setNotice(`Added ${teacher.fullName}.`);
          closeForm();
        },
      });
    } else if (formTeacher) {
      updateTeacher.mutate(
        { id: formTeacher.id, data: values },
        {
          onSuccess: (teacher) => {
            setNotice(`Saved changes to ${teacher.fullName}.`);
            closeForm();
          },
        },
      );
    }
  };

  const closeStatus = () => {
    setStatus.reset();
    setStatusTarget(null);
  };

  const confirmStatus = () => {
    if (!statusTarget) return;
    setStatus.mutate(
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

  const closeReset = () => {
    resetPassword.reset();
    setResetTarget(null);
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    resetPassword.mutate(resetTarget.id, {
      onSuccess: ({ temporaryPassword }) => {
        setIssued({ name: resetTarget.fullName, password: temporaryPassword });
        setNotice(`Reset the password for ${resetTarget.fullName}.`);
        closeReset();
      },
    });
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Teachers"
        description="Create teacher accounts, and manage their access."
        actions={
          <Button
            size="lg"
            className="rounded-full px-4"
            onClick={() => setFormTeacher("new")}
          >
            <Plus aria-hidden="true" />
            Add teacher
          </Button>
        }
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading teachers..."
        skeleton={<TableSkeleton />}
        errorText="Unable to load teachers."
        onRetry={() => void refetch()}
      />

      {teachers && (
        <>
          <div className="relative max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search teachers"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl bg-white pl-9 shadow-[var(--shadow-card)]"
            />
          </div>

          <p role="status" className="text-sm font-bold text-emerald-700 empty:hidden">
            {notice}
          </p>

          <StaffCard className="overflow-hidden">
            <StaffCardHeader>
              <StaffCardTitle>
                Teachers{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  ({filtered.length})
                </span>
              </StaffCardTitle>
            </StaffCardHeader>

            {filtered.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                {teachers.length === 0
                  ? "No teachers yet. Add the first teacher to get started."
                  : "No teachers match your search."}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Teacher</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden xl:table-cell">Contact</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Date joined
                      </TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={teacher.fullName} size="lg" />
                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {teacher.fullName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {teacher.username}
                              </p>
                              {/* On phones status moves here, keeping the actions on screen. */}
                              <div className="mt-1 sm:hidden">
                                <StatusBadge isActive={teacher.isActive} />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {teacher.email ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {teacher.contactNumber ?? "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <StatusBadge isActive={teacher.isActive} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {teacher.dateJoined ? formatDate(teacher.dateJoined) : "—"}
                        </TableCell>
                        <TableCell className="pr-6 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${teacher.fullName}`}
                            onClick={() => setFormTeacher(teacher)}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Reset password for ${teacher.fullName}`}
                            onClick={() => setResetTarget(teacher)}
                          >
                            <KeyRound aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${teacher.isActive ? "Deactivate" : "Reactivate"} ${teacher.fullName}`}
                            onClick={() => setStatusTarget(teacher)}
                            className={teacher.isActive ? "text-red-700" : undefined}
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
                  noun="teachers"
                  onPageChange={setPage}
                />
              </>
            )}
          </StaffCard>
        </>
      )}

      <Dialog
        open={formTeacher !== null}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="font-staff sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {formTeacher === "new" ? "Add teacher" : "Edit teacher"}
            </DialogTitle>
            <DialogDescription>
              {formTeacher === "new"
                ? "They'll get a temporary password to change when they first log in."
                : "Update this teacher's account details."}
            </DialogDescription>
          </DialogHeader>
          {/* Mounted only while open, so the fields start fresh each time. */}
          {formTeacher !== null && (
            <TeacherForm
              teacher={formTeacher === "new" ? null : formTeacher}
              isSaving={createTeacher.isPending || updateTeacher.isPending}
              serverError={createTeacher.error ?? updateTeacher.error}
              onCancel={closeForm}
              onSave={saveTeacher}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) closeReset();
        }}
      >
        <DialogContent className="font-staff">
          <DialogHeader>
            <DialogTitle>Reset password for {resetTarget?.fullName}?</DialogTitle>
            <DialogDescription>
              Their current password stops working right away, and you'll get a
              temporary one to give them.
            </DialogDescription>
          </DialogHeader>
          {resetPassword.error && (
            <p role="alert" className="text-sm font-bold text-red-600">
              {resetPassword.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={resetPassword.isPending}
              onClick={closeReset}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={resetPassword.isPending}
              onClick={confirmReset}
            >
              {resetPassword.isPending ? "Resetting..." : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccountStatusDialog
        account={statusTarget}
        isPending={setStatus.isPending}
        error={setStatus.error}
        onCancel={closeStatus}
        onConfirm={confirmStatus}
      />
      <TemporaryPasswordDialog issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}
