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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AdminLesson } from "@/api/admin-api";
import { useAdminLessons } from "@/hooks/use-admin-lessons";
import { useUpdateLesson } from "@/hooks/use-update-lesson";
import { plural } from "@/lib/format";

function LessonEditor({
  lesson,
  onCancel,
  onSaved,
}: {
  lesson: AdminLesson;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const updateLesson = useUpdateLesson();
  const [description, setDescription] = useState(lesson.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(lesson.displayOrder));
  const [isActive, setIsActive] = useState(lesson.isActive);
  const [signs, setSigns] = useState(
    lesson.signs.map((sign) => ({
      ...sign,
      referenceImageUrl: sign.referenceImageUrl ?? "",
      referenceVideoUrl: sign.referenceVideoUrl ?? "",
    })),
  );

  const updateSign = (
    id: string,
    changes: { referenceImageUrl?: string; referenceVideoUrl?: string },
  ) =>
    setSigns((current) =>
      current.map((sign) => (sign.id === id ? { ...sign, ...changes } : sign)),
    );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateLesson.mutate(
      {
        id: lesson.id,
        data: {
          description,
          displayOrder: Number(displayOrder),
          isActive,
          signs: signs.map(({ id, referenceImageUrl, referenceVideoUrl }) => ({
            id,
            referenceImageUrl,
            referenceVideoUrl,
          })),
        },
      },
      { onSuccess: onSaved },
    );
  };

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="lesson-description" className="font-bold">
            Description
          </Label>
          <Textarea
            id="lesson-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

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

        <fieldset className="space-y-4">
          <legend className="font-bold">Reference media</legend>
          <p className="text-sm text-muted-foreground">
            Enter a link or path for each sign. A sign's media also changes in
            any other lesson that uses it. New signs are added with a trained
            recognition model, not here.
          </p>

          {signs.map((sign) => (
            <div
              key={sign.id}
              className="space-y-3 rounded-xl border border-border p-3"
            >
              <p className="font-bold">{sign.label}</p>
              <div className="space-y-2">
                <Label htmlFor={`${sign.id}-image`}>Image link or path</Label>
                <Input
                  id={`${sign.id}-image`}
                  value={sign.referenceImageUrl}
                  onChange={(e) =>
                    updateSign(sign.id, { referenceImageUrl: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              {sign.referenceImageUrl && (
                <img
                  src={sign.referenceImageUrl}
                  alt={`${sign.label} reference`}
                  loading="lazy"
                  className="max-h-32 rounded-lg border border-border object-contain"
                />
              )}
              <div className="space-y-2">
                <Label htmlFor={`${sign.id}-video`}>Video link or path</Label>
                <Input
                  id={`${sign.id}-video`}
                  value={sign.referenceVideoUrl}
                  onChange={(e) =>
                    updateSign(sign.id, { referenceVideoUrl: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              {sign.referenceVideoUrl && (
                <video
                  src={sign.referenceVideoUrl}
                  controls
                  preload="none"
                  aria-label={`${sign.label} reference video`}
                  className="max-h-40 w-full rounded-lg border border-border"
                />
              )}
            </div>
          ))}
        </fieldset>
      </div>

      {updateLesson.error && (
        <p role="alert" className="px-4 pt-3 text-sm font-bold text-red-600">
          {updateLesson.error.message}
        </p>
      )}

      <SheetFooter className="flex-row justify-end border-t border-border">
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
      </SheetFooter>
    </form>
  );
}

export default function AdminLessonsPage() {
  const { data: areas, isLoading, error, refetch } = useAdminLessons();
  const [editing, setEditing] = useState<{
    lesson: AdminLesson;
    areaName: string;
  } | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Lessons"
        description="Edit lesson details and reference media. Quizzes stay with teachers."
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
                    {lesson.description} {plural(lesson.signs.length, "sign")}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  aria-label={`Edit ${lesson.name}`}
                  onClick={() => setEditing({ lesson, areaName: area.name })}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        </StaffCard>
      ))}

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <SheetContent className="gap-0 font-staff sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">
              Edit {editing?.lesson.name}
            </SheetTitle>
            <SheetDescription>{editing?.areaName}</SheetDescription>
          </SheetHeader>
          {/* Mounted only while open, so a cancelled draft doesn't carry over. */}
          {editing && (
            <LessonEditor
              lesson={editing.lesson}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setNotice(`Saved changes to ${editing.lesson.name}.`);
                setEditing(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
