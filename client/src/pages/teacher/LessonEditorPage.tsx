import { useEffect, useState } from "react";
import { Link, useBlocker, useParams } from "react-router";
import { useIsMutating } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  Lightbulb,
  MessageCircle,
  Settings2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import MediaDropzone from "@/components/staff/media-dropzone";
import QueryState from "@/components/staff/query-state";
import { CardGridSkeleton } from "@/components/staff/skeletons";
import { StaffCard } from "@/components/staff/staff-card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { EditableLesson } from "@/api/teacher-api";
import { useTeacherLesson } from "@/hooks/use-teacher-lesson";
import { lessonMediaUploadKey } from "@/hooks/use-upload-lesson-media";
import { useUpdateTeacherLesson } from "@/hooks/use-update-teacher-lesson";
import { plural } from "@/lib/format";
import { signMeaningText, signWhenToUseText } from "@/lib/lesson-text";
import { cn } from "@/lib/utils";

const MAX_TEXT_LENGTH = 500;

const toDraft = (lesson: EditableLesson) => ({
  description: lesson.description ?? "",
  displayOrder: String(lesson.displayOrder),
  isActive: lesson.isActive,
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

const isReady = (sign: DraftSign) =>
  Boolean(
    sign.meaning.trim() &&
      sign.exampleUsage.trim() &&
      (sign.referenceImageUrl || sign.referenceVideoUrl),
  );

function TextField({
  id,
  label,
  scope,
  icon: Icon,
  value,
  learnerText,
  onChange,
}: {
  id: string;
  label: string;
  scope: string;
  icon: LucideIcon;
  value: string;
  learnerText: string;
  onChange: (value: string) => void;
}) {
  const isEmpty = !value.trim();

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4 transition-colors focus-within:border-primary focus-within:bg-white">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <Label htmlFor={id} className="text-base font-bold">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{scope}</p>
        </div>
      </div>

      {/* The margin keeps a focused field clear of the sticky toolbar. */}
      <Textarea
        id={id}
        rows={2}
        maxLength={MAX_TEXT_LENGTH}
        value={value}
        aria-describedby={`${id}-status`}
        className="scroll-mt-48 bg-white text-base leading-relaxed md:text-base"
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="mt-2 flex items-start justify-between gap-3 text-sm">
        {/* The placeholder shows only while empty: otherwise it would repeat the box above. */}
        <p
          id={`${id}-status`}
          className={cn(
            "flex min-w-0 items-start gap-1.5",
            isEmpty ? "text-amber-900" : "text-emerald-800",
          )}
        >
          {isEmpty ? (
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span className="[overflow-wrap:anywhere]">
            {isEmpty
              ? `Learners see a placeholder: "${learnerText}"`
              : "Learners see this text"}
          </span>
        </p>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {value.length}/{MAX_TEXT_LENGTH}
        </span>
      </div>
    </div>
  );
}

function ReferenceMedia({
  sign,
  isSaving,
  onChange,
}: {
  sign: DraftSign;
  isSaving: boolean;
  onChange: (changes: Partial<DraftSign>) => void;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <h3 className="font-bold">Reference media</h3>

      {sign.referenceImageUrl && (
        <div className="space-y-2">
          <img
            src={sign.referenceImageUrl}
            alt={`${sign.label} reference`}
            loading="lazy"
            className="max-h-56 rounded-lg border border-border object-contain"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label={`Remove image for ${sign.label}`}
            onClick={() => onChange({ referenceImageUrl: "" })}
          >
            Remove image
          </Button>
        </div>
      )}

      {sign.referenceVideoUrl && (
        <div className="space-y-2">
          <video
            src={sign.referenceVideoUrl}
            controls
            preload="metadata"
            aria-label={`${sign.label} reference video`}
            className="max-h-56 max-w-full rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label={`Remove video for ${sign.label}`}
            onClick={() => onChange({ referenceVideoUrl: "" })}
          >
            Remove video
          </Button>
        </div>
      )}

      <MediaDropzone
        signLabel={sign.label}
        disabled={isSaving}
        onUploaded={(kind, url) =>
          onChange(
            kind === "image"
              ? { referenceImageUrl: url }
              : { referenceVideoUrl: url },
          )
        }
      />
      <p className="text-sm text-muted-foreground">
        A new file replaces the current one, here and in any other lesson that
        uses this sign. Learners see it after you save.
      </p>
    </div>
  );
}

function SignCard({
  sign,
  position,
  total,
  isSaving,
  onChange,
}: {
  sign: DraftSign;
  position: number;
  total: number;
  isSaving: boolean;
  onChange: (changes: Partial<DraftSign>) => void;
}) {
  return (
    <StaffCard className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Sign {position} of {total}
          </p>
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight text-foreground [overflow-wrap:anywhere]">
            {sign.label}
          </h2>
        </div>
        {isReady(sign) ? (
          <Badge className="h-7 bg-emerald-100 px-3 text-sm text-emerald-800">
            <CheckCircle2 aria-hidden="true" />
            Ready
          </Badge>
        ) : (
          <Badge className="h-7 bg-amber-100 px-3 text-sm text-amber-900">
            <TriangleAlert aria-hidden="true" />
            Needs content
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ReferenceMedia sign={sign} isSaving={isSaving} onChange={onChange} />
        <div className="min-w-0 space-y-4">
          <TextField
            id={`${sign.id}-meaning`}
            label="Meaning"
            scope="Shared with any lesson using this sign"
            icon={Lightbulb}
            value={sign.meaning}
            learnerText={signMeaningText(sign.label, sign.meaning)}
            onChange={(meaning) => onChange({ meaning })}
          />
          <TextField
            id={`${sign.id}-usage`}
            label="When to use"
            scope="For this lesson only"
            icon={MessageCircle}
            value={sign.exampleUsage}
            learnerText={signWhenToUseText(sign.label, sign.exampleUsage)}
            onChange={(exampleUsage) => onChange({ exampleUsage })}
          />
        </div>
      </div>
    </StaffCard>
  );
}

function LessonForm({ lesson }: { lesson: EditableLesson }) {
  const updateLesson = useUpdateTeacherLesson(lesson.id);
  const isUploading = useIsMutating({ mutationKey: lessonMediaUploadKey }) > 0;
  const [draft, setDraft] = useState(() => toDraft(lesson));
  const [saved, setSaved] = useState(() => toDraft(lesson));
  const [justSaved, setJustSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  // An upload in progress hasn't reached the draft yet, but leaving would lose it.
  const hasUnsavedWork = isDirty || isUploading;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedWork && currentLocation.pathname !== nextLocation.pathname,
  );

  // Covers closing the tab or reloading, which the router can't intercept.
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedWork]);

  const readyCount = draft.signs.filter(isReady).length;
  const needingContent = draft.signs.length - readyCount;

  const clearSaveMessages = () => {
    setJustSaved(false);
    updateLesson.reset();
  };

  const updateLessonFields = (changes: Partial<Draft>) => {
    clearSaveMessages();
    setDraft((current) => ({ ...current, ...changes }));
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
        // Only when changed: these affect everyone, so an older copy mustn't undo another teacher's change.
        ...(draft.displayOrder !== saved.displayOrder && {
          displayOrder: Number(draft.displayOrder),
        }),
        ...(draft.isActive !== saved.isActive && { isActive: draft.isActive }),
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
          setSaved(next);
          setJustSaved(true);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Edit {lesson.name}</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          {lesson.areaName} · {readyCount} of {draft.signs.length} signs ready
          {!saved.isActive && (
            <Badge variant="secondary">
              <CircleSlash aria-hidden="true" />
              Hidden from learners
            </Badge>
          )}
        </p>
      </header>

      {/* Sits below the mobile top bar, and at the very top once the sidebar takes over. */}
      <div className="sticky top-[69px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
        <div className="min-w-0 text-sm">
          {updateLesson.error ? (
            <p role="alert" className="font-bold text-red-600">
              {updateLesson.error.message}
            </p>
          ) : justSaved ? (
            <p role="status" className="font-bold text-emerald-700">
              {draft.isActive
                ? "Saved. Learners see these changes now."
                : "Saved. This lesson is hidden from learners."}
            </p>
          ) : needingContent > 0 ? (
            <p className="font-semibold text-amber-900">
              {plural(needingContent, "sign")} still{" "}
              {needingContent === 1 ? "needs" : "need"} content
            </p>
          ) : (
            <p className="font-semibold text-muted-foreground">
              All signs are ready
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="rounded-full px-3 font-semibold"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 aria-hidden="true" />
            Lesson settings
          </Button>
          <Button
            type="submit"
            size="lg"
            className="rounded-full px-5 font-bold"
            disabled={!isDirty || updateLesson.isPending || isUploading}
          >
            {updateLesson.isPending
              ? "Saving..."
              : isUploading
                ? "Uploading..."
                : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Locked while saving: the saved result replaces the draft, which would drop new typing. */}
      <fieldset disabled={updateLesson.isPending} className="min-w-0 space-y-6">
        {draft.signs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            This lesson has no signs yet. Signs are added with a trained
            recognition model.
          </p>
        ) : (
          draft.signs.map((sign, index) => (
            <SignCard
              key={sign.id}
              sign={sign}
              position={index + 1}
              total={draft.signs.length}
              isSaving={updateLesson.isPending}
              onChange={(changes) => updateSign(sign.id, changes)}
            />
          ))
        )}
      </fieldset>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="gap-0 font-staff sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Lesson settings</SheetTitle>
            <SheetDescription>
              These apply to every teacher's learners, once you save.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-description" className="font-bold">
                Lesson description
              </Label>
              <Textarea
                id="lesson-description"
                rows={3}
                maxLength={MAX_TEXT_LENGTH}
                value={draft.description}
                onChange={(e) =>
                  updateLessonFields({ description: e.target.value })
                }
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
                value={draft.displayOrder}
                aria-describedby="lesson-order-help"
                onChange={(e) =>
                  updateLessonFields({ displayOrder: e.target.value })
                }
                className="h-10 w-24"
              />
              <p id="lesson-order-help" className="text-sm text-muted-foreground">
                This lesson's number on the Lessons page. Choosing a number used
                in this learning area swaps the two lessons. This changes which
                lesson opens next for every teacher's learners. Finished lessons
                stay finished.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) =>
                  updateLessonFields({ isActive: e.target.checked })
                }
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="font-bold">Visible to learners</span>
                <span className="block text-muted-foreground">
                  Hidden lessons stay here for teachers to edit, but disappear
                  for every teacher's learners. Learner records are kept.
                </span>
              </span>
            </label>
          </div>
          <SheetFooter className="flex-row justify-end border-t border-border">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
              Your changes to this lesson haven't been saved, including any
              upload still in progress.
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
