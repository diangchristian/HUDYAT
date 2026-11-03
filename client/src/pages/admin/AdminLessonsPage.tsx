import { useState } from "react";

import { StatusBadge } from "@/components/staff/account-status";
import LessonIcon from "@/components/staff/lesson-icon";
import QueryState from "@/components/staff/query-state";
import { TableSkeleton } from "@/components/staff/skeletons";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
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
import type { AdminLesson } from "@/api/admin-api";
import { useAdminLessons } from "@/hooks/use-admin-lessons";
import { useUpdateLesson } from "@/hooks/use-update-lesson";
import { plural } from "@/lib/format";

function LessonSettingsForm({
  lesson,
  onCancel,
  onSaved,
}: {
  lesson: AdminLesson;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const updateLesson = useUpdateLesson();
  const [displayOrder, setDisplayOrder] = useState(String(lesson.displayOrder));
  const [isActive, setIsActive] = useState(lesson.isActive);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateLesson.mutate(
      {
        id: lesson.id,
        data: { displayOrder: Number(displayOrder), isActive },
      },
      { onSuccess: onSaved },
    );
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="lesson-order" className="font-bold">
          Order
        </Label>
        <Input
          id="lesson-order"
          type="number"
          min={1}
          value={displayOrder}
          aria-describedby="lesson-order-help"
          onChange={(e) => setDisplayOrder(e.target.value)}
          className="h-10 w-24"
        />
        <p id="lesson-order-help" className="text-sm text-muted-foreground">
          Choosing a taken position swaps the two lessons.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="font-bold">Lesson is active</span>
          <span className="block text-muted-foreground">
            Inactive lessons are hidden from learners and teachers. Learner
            records are kept.
          </span>
        </span>
      </label>

      {updateLesson.error && (
        <p role="alert" className="text-sm font-bold text-red-600">
          {updateLesson.error.message}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={updateLesson.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={updateLesson.isPending}
        >
          {updateLesson.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminLessonsPage() {
  const { data: areas, isLoading, error, refetch } = useAdminLessons();
  const [editing, setEditing] = useState<AdminLesson | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Lessons"
        description="Set lesson order and which lessons are active. Teachers edit lesson content."
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading lessons..."
        skeleton={<TableSkeleton />}
        errorText="Unable to load lessons."
        onRetry={() => void refetch()}
      />

      <p role="status" className="text-sm font-bold text-emerald-700 empty:hidden">
        {notice}
      </p>

      {areas?.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No lessons yet. Lessons are added with the seed scripts.
        </p>
      )}

      {areas?.map((area) => (
        <StaffCard key={area.id}>
          <StaffCardHeader>
            <StaffCardTitle>{area.name}</StaffCardTitle>
          </StaffCardHeader>
          <ul className="divide-y divide-border">
            {area.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6"
              >
                <LessonIcon name={lesson.name} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {lesson.displayOrder}. {lesson.name}
                    <StatusBadge
                      isActive={lesson.isActive}
                      inactiveLabel="Inactive"
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lesson.description} {plural(lesson.signCount, "sign")}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  aria-label={`Change settings for ${lesson.name}`}
                  onClick={() => setEditing(lesson)}
                >
                  Settings
                </Button>
              </li>
            ))}
          </ul>
        </StaffCard>
      ))}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="font-staff sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editing?.name} settings
            </DialogTitle>
            <DialogDescription>
              These apply to every teacher and learner.
            </DialogDescription>
          </DialogHeader>
          {/* Mounted only while open, so a cancelled change doesn't carry over. */}
          {editing && (
            <LessonSettingsForm
              lesson={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setNotice(`Saved settings for ${editing.name}.`);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
