import { useEffect, useState } from "react";
import { Link, useBlocker, useParams } from "react-router";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import QueryState from "@/components/staff/query-state";
import { CardGridSkeleton } from "@/components/staff/skeletons";
import { StaffCard } from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import type { EditableLesson } from "@/api/teacher-api";
import { useTeacherLesson } from "@/hooks/use-teacher-lesson";
import { useUpdateTeacherLesson } from "@/hooks/use-update-teacher-lesson";
import { plural } from "@/lib/format";
import { signMeaningText, signWhenToUseText } from "@/lib/lesson-text";

const MAX_TEXT_LENGTH = 500;

const toDraft = (lesson: EditableLesson) => ({
  description: lesson.description ?? "",
  signs: lesson.signs.map((sign) => ({
    id: sign.id,
    label: sign.label,
    meaning: sign.meaning ?? "",
    exampleUsage: sign.exampleUsage ?? "",
    referenceImageUrl: sign.referenceImageUrl ?? "",
    referenceVideoUrl: sign.referenceVideoUrl ?? "",
  })),
});

type Draft = ReturnType<typeof toDraft>;
type DraftSign = Draft["signs"][number];

/** A text field paired with exactly what learners will read from it. */
function TeachingText({
  id,
  label,
  helper,
  value,
  learnerText,
  onChange,
}: {
  id: string;
  label: string;
  helper?: string;
  value: string;
  learnerText: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="font-bold">
          {label}
        </Label>
        {!value.trim() && (
          <Badge className="bg-amber-100 text-amber-900">
            <TriangleAlert aria-hidden="true" />
            Using placeholder text
          </Badge>
        )}
      </div>
      <Textarea
        id={id}
        rows={2}
        maxLength={MAX_TEXT_LENGTH}
        value={value}
        aria-describedby={helper ? `${id}-helper` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper && (
        <p id={`${id}-helper`} className="text-sm text-muted-foreground">
          {helper}
        </p>
      )}
      <div className="rounded-xl bg-muted p-3 text-sm">
        <p className="font-bold text-muted-foreground">Learners read:</p>
        <p className="[overflow-wrap:anywhere]">{learnerText}</p>
      </div>
    </div>
  );
}

function SignCard({
  sign,
  onChange,
}: {
  sign: DraftSign;
  onChange: (changes: Partial<DraftSign>) => void;
}) {
  return (
    <StaffCard className="space-y-5 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-foreground">{sign.label}</h2>

      <div className="grid gap-5 lg:grid-cols-2">
        <TeachingText
          id={`${sign.id}-meaning`}
          label="Meaning"
          helper="Shared with any other lesson that uses this sign."
          value={sign.meaning}
          learnerText={signMeaningText(sign.label, sign.meaning)}
          onChange={(meaning) => onChange({ meaning })}
        />
        <TeachingText
          id={`${sign.id}-usage`}
          label="When to use"
          value={sign.exampleUsage}
          learnerText={signWhenToUseText(sign.label, sign.exampleUsage)}
          onChange={(exampleUsage) => onChange({ exampleUsage })}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${sign.id}-image`} className="font-bold">
            Image link or path
          </Label>
          <Input
            id={`${sign.id}-image`}
            value={sign.referenceImageUrl}
            onChange={(e) => onChange({ referenceImageUrl: e.target.value })}
            className="h-10"
          />
          {sign.referenceImageUrl && (
            <img
              src={sign.referenceImageUrl}
              alt={`${sign.label} reference`}
              loading="lazy"
              className="max-h-40 rounded-lg border border-border object-contain"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${sign.id}-video`} className="font-bold">
            Video link or path
          </Label>
          <Input
            id={`${sign.id}-video`}
            value={sign.referenceVideoUrl}
            onChange={(e) => onChange({ referenceVideoUrl: e.target.value })}
            className="h-10"
          />
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
      </div>
      <p className="text-sm text-muted-foreground">
        Image and video links are also shared with any other lesson that uses
        this sign.
      </p>
    </StaffCard>
  );
}

function LessonForm({ lesson }: { lesson: EditableLesson }) {
  const updateLesson = useUpdateTeacherLesson(lesson.id);
  const [draft, setDraft] = useState(() => toDraft(lesson));
  const [saved, setSaved] = useState(() => JSON.stringify(toDraft(lesson)));
  const [justSaved, setJustSaved] = useState(false);

  const isDirty = JSON.stringify(draft) !== saved;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  // Covers closing the tab or reloading, which the router can't intercept.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const needingText = draft.signs.filter(
    (sign) => !sign.meaning.trim() || !sign.exampleUsage.trim(),
  ).length;

  const clearSaveMessages = () => {
    setJustSaved(false);
    updateLesson.reset();
  };

  const updateSign = (id: string, changes: Partial<DraftSign>) => {
    clearSaveMessages();
    setDraft((current) => ({
      ...current,
      signs: current.signs.map((sign) =>
        sign.id === id ? { ...sign, ...changes } : sign,
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateLesson.mutate(
      {
        description: draft.description,
        signs: draft.signs.map((sign) => ({
          id: sign.id,
          meaning: sign.meaning,
          exampleUsage: sign.exampleUsage,
          referenceImageUrl: sign.referenceImageUrl,
          referenceVideoUrl: sign.referenceVideoUrl,
        })),
      },
      {
        onSuccess: (updated) => {
          const next = toDraft(updated);
          setDraft(next);
          setSaved(JSON.stringify(next));
          setJustSaved(true);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Locked while saving: the saved result replaces the draft, which would drop new typing. */}
      <fieldset disabled={updateLesson.isPending} className="min-w-0 space-y-6">
        <StaffCard className="space-y-2 p-5 sm:p-6">
          <Label htmlFor="lesson-description" className="font-bold">
            Lesson description
          </Label>
          <Textarea
            id="lesson-description"
            rows={3}
            maxLength={MAX_TEXT_LENGTH}
            value={draft.description}
            onChange={(e) => {
              clearSaveMessages();
              setDraft((current) => ({
                ...current,
                description: e.target.value,
              }));
            }}
          />
        </StaffCard>

        {draft.signs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            This lesson has no signs yet. Signs are added with a trained
            recognition model.
          </p>
        ) : (
          draft.signs.map((sign) => (
            <SignCard
              key={sign.id}
              sign={sign}
              onChange={(changes) => updateSign(sign.id, changes)}
            />
          ))
        )}
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="min-w-0 text-sm">
          {updateLesson.error ? (
            <p role="alert" className="font-bold text-red-600">
              {updateLesson.error.message}
            </p>
          ) : justSaved ? (
            <p role="status" className="font-bold text-emerald-700">
              Saved. Learners see these changes now.
            </p>
          ) : needingText > 0 ? (
            <p className="font-semibold text-amber-900">
              {plural(needingText, "sign")} still using placeholder text
            </p>
          ) : (
            <p className="font-semibold text-muted-foreground">
              All signs have their own text
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="rounded-full px-5"
          disabled={!isDirty || updateLesson.isPending}
        >
          {updateLesson.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <DialogContent className="font-staff">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              Your changes to this lesson haven't been saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => blocker.proceed?.()}
            >
              Leave
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => blocker.reset?.()}
            >
              Keep editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export default function LessonEditorPage() {
  const { categoryId } = useParams();
  const { data, isLoading, error, refetch } = useTeacherLesson(categoryId);

  return (
    <div className="space-y-6">
      <Link
        to="/teacher/lessons"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Lessons
      </Link>

      <StaffPageHeader
        title={data ? `Edit ${data.name}` : "Edit lesson"}
        description={
          data
            ? `${data.areaName}. Saved changes reach learners right away.`
            : undefined
        }
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading lesson..."
        skeleton={<CardGridSkeleton count={2} className="grid gap-6" />}
        errorText="Unable to load this lesson."
        onRetry={() => void refetch()}
      />

      {/* Keeps the draft through background refetches, so typing isn't lost. */}
      {data && <LessonForm key={data.id} lesson={data} />}
    </div>
  );
}
