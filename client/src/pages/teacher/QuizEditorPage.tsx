import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AlertTriangle, ArrowLeft, Lock, Plus, Send } from "lucide-react";

import LessonIcon from "@/components/staff/lesson-icon";
import QueryState from "@/components/staff/query-state";
import { SidePanelSkeleton } from "@/components/staff/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import DeleteQuestionDialog from "@/components/staff/quiz-editor/delete-question-dialog";
import FeedbackMessage from "@/components/staff/quiz-editor/feedback-message";
import QuestionCard from "@/components/staff/quiz-editor/question-card";
import QuestionForm from "@/components/staff/quiz-editor/question-form";
import {
  QUESTION_TYPES,
  errorMessage,
  isMissingVideo,
  type Feedback,
} from "@/components/staff/quiz-editor/question-types";
import {
  StaffCard,
  StaffCardHeader,
  StaffCardTitle,
} from "@/components/staff/staff-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AssessmentStatus,
  AuthoringAssessment,
  AuthoringQuestion,
} from "@/api/teacher-api";
import { useCategoryGestures } from "@/hooks/use-category-gestures";
import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import * as BrandPanel from "./quiz-editor-prototype/ColorBrandPanel";
import * as LessonColor from "./quiz-editor-prototype/ColorLessonColor";
import * as TypeTint from "./quiz-editor-prototype/ColorTypeTint";
import type {
  CardProps,
  OutlineProps,
} from "./quiz-editor-prototype/outline-props";
import { useSaveAssessment } from "@/hooks/use-save-assessment";
import { useTeacherAssessment } from "@/hooks/use-teacher-assessment";

type Assessment = NonNullable<AuthoringAssessment["assessment"]>;

/* PROTOTYPE — throwaway: aside variants for `?variant=` (dev only). */
const PROTOTYPE_VARIANTS = [
  { key: "0", name: "Current (white)" },
  { key: "1", name: "Color · By question type" },
  { key: "2", name: "Color · Brand blue panel" },
  { key: "3", name: "Color · Lesson color" },
];
type PrototypeTheme = {
  Outline: (props: OutlineProps) => React.ReactNode;
  Card: (props: CardProps) => React.ReactNode;
  sectionClassName?: string;
};
const PROTOTYPE_THEMES: Record<string, PrototypeTheme> = {
  "1": TypeTint,
  "2": BrandPanel,
  "3": {
    ...LessonColor,
    sectionClassName: "rounded-3xl bg-slate-100 p-3 sm:p-4",
  },
};

/* =========================================================
 * Quiz details + status actions
 * ======================================================= */

function QuizDetails({ data }: { data: AuthoringAssessment }) {
  const { category, assessment } = data;
  const saveMutation = useSaveAssessment(category.id);

  const [title, setTitle] = useState(
    assessment?.title ?? `${category.name} Quiz`,
  );
  const [description, setDescription] = useState(
    assessment?.description ?? "",
  );
  const [passingScore, setPassingScore] = useState(
    String(assessment?.passingScore ?? 80),
  );
  const [feedback, setFeedback] = useState<Feedback>(null);

  const status = assessment?.status ?? null;
  const hasQuestions = (assessment?.questions.length ?? 0) > 0;

  const save = async (nextStatus: AssessmentStatus, successMessage: string) => {
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Title is required." });
      return;
    }

    const score = Number(passingScore);
    if (passingScore === "" || !(score >= 0 && score <= 100)) {
      setFeedback({
        type: "error",
        message: "Passing score must be a percentage from 0 to 100.",
      });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        passingScore: score,
        status: nextStatus,
      });
      setFeedback({ type: "success", message: successMessage });
    } catch (error) {
      setFeedback({
        type: "error",
        message: errorMessage(error, "Unable to save this quiz."),
      });
    }
  };

  const isSaving = saveMutation.isPending;
  const pill = "h-10 rounded-full px-5";

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <LessonIcon name={category.name} className="size-12" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground sm:text-[32px] sm:leading-10">
                {assessment ? "Edit quiz" : "Create quiz"}
              </h1>
              {status && <QuizStatusBadge status={status} />}
            </div>
            <p className="text-sm text-muted-foreground">
              {category.learningArea.name} · {category.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!assessment && (
            <Button
              className={pill}
              disabled={isSaving}
              onClick={() => void save("DRAFT", "Quiz created! Add questions below.")}
            >
              <Plus aria-hidden="true" />
              Create quiz
            </Button>
          )}

          {status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                className={pill}
                disabled={isSaving}
                onClick={() => void save("DRAFT", "Draft saved.")}
              >
                Save as draft
              </Button>
              <Button
                className={pill}
                disabled={isSaving || !hasQuestions}
                title={hasQuestions ? undefined : "Add a question first"}
                onClick={() =>
                  void save("PUBLISHED", "Published! Learners can take it now.")
                }
              >
                <Send aria-hidden="true" />
                Publish
              </Button>
            </>
          )}

          {status === "PUBLISHED" && (
            <>
              <Button
                variant="outline"
                className={pill}
                disabled={isSaving}
                onClick={() =>
                  void save("DRAFT", "Unpublished. Learners can no longer see it.")
                }
              >
                Unpublish
              </Button>
              <Button
                className={pill}
                disabled={isSaving}
                onClick={() => void save("PUBLISHED", "Changes saved.")}
              >
                Save changes
              </Button>
            </>
          )}

          {status === "ARCHIVED" && (
            <Button
              className={pill}
              disabled={isSaving}
              onClick={() => void save("DRAFT", "Restored to draft.")}
            >
              Restore to draft
            </Button>
          )}
        </div>
      </header>

      <StaffCard>
        <StaffCardHeader className="flex-col items-start gap-0.5">
          <StaffCardTitle className="text-2xl">Quiz details</StaffCardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the core settings for your assessment.
          </p>
        </StaffCardHeader>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="quiz-title" className="font-bold">
                Quiz title
              </Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quiz-lesson" className="font-bold">
                  Linked lesson
                </Label>
                <Input
                  id="quiz-lesson"
                  value={category.name}
                  readOnly
                  className="h-10 text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-passing" className="font-bold">
                  Passing score (%)
                </Label>
                <Input
                  id="quiz-passing"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  disabled={assessment?.isLocked}
                  aria-describedby={
                    assessment?.isLocked ? "quiz-passing-locked" : undefined
                  }
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="h-10"
                />
                {assessment?.isLocked && (
                  <p
                    id="quiz-passing-locked"
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <Lock aria-hidden="true" className="size-3" />
                    Locked: learners were graded against it.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="quiz-description" className="font-bold">
              Description / instructions
            </Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell learners what this quiz covers."
              className="min-h-24 flex-1"
            />
          </div>

          <div className="lg:col-span-2">
            <FeedbackMessage feedback={feedback} />
          </div>
        </div>
      </StaffCard>
    </>
  );
}

/* =========================================================
 * Questions section (list + outline sidebar)
 * ======================================================= */

/* PROTOTYPE: the aside is swappable via `?variant=` (dev only). */
function CurrentOutline({
  questions,
  editingId,
  canAdd,
  onAdd,
  onJump,
  totalPoints,
  attemptCount,
}: OutlineProps) {
  return (
    <StaffCard>
      <StaffCardHeader className="py-3">
        <h2 className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
          Questions ({questions.length})
        </h2>
        {canAdd && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add question"
            onClick={onAdd}
          >
            <Plus aria-hidden="true" />
          </Button>
        )}
      </StaffCardHeader>

      {questions.length > 0 ? (
        <ol className="max-h-[50vh] space-y-1 overflow-y-auto p-2">
          {questions.map((question) => {
            const TypeIcon = QUESTION_TYPES[question.questionType].icon;
            const missingVideo = isMissingVideo(
              question.questionType,
              question.gesture,
            );
            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onJump(question.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted",
                    editingId === question.id && "bg-accent",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-xs font-bold">
                    {question.questionNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {question.questionText}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <TypeIcon aria-hidden="true" className="size-3" />
                      {QUESTION_TYPES[question.questionType].shortLabel} ·{" "}
                      {question.gesture.label}
                    </span>
                  </span>
                  {missingVideo && (
                    <AlertTriangle
                      aria-label="No video for this sign"
                      className="size-4 shrink-0 text-amber-600"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">
          Questions you add appear here.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-2 border-t border-border p-4 text-center">
        <div className="rounded-xl bg-muted/60 p-2">
          <dt className="text-xs text-muted-foreground">Total points</dt>
          <dd className="font-bold text-foreground">{totalPoints}</dd>
        </div>
        <div className="rounded-xl bg-muted/60 p-2">
          <dt className="text-xs text-muted-foreground">Submissions</dt>
          <dd className="font-bold text-foreground">
            {attemptCount}
          </dd>
        </div>
      </dl>
    </StaffCard>
  );
}

/* PROTOTYPE: adapter so the current card fits the variant contract. */
function CurrentCard(props: CardProps) {
  return (
    <QuestionCard
      question={props.question}
      canEdit={props.canEdit}
      canDelete={props.canDelete}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  );
}

function QuestionsSection({
  categoryId,
  categoryName,
  assessment,
}: {
  categoryId: string;
  categoryName: string;
  assessment: Assessment;
}) {
  const { data: gestures = [], isLoading: gesturesLoading } =
    useCategoryGestures(categoryId);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<AuthoringQuestion | null>(null);

  const { isLocked, questions } = assessment;
  const canAdd = !isLocked && editing === null && !gesturesLoading;
  const [searchParams] = useSearchParams();
  const theme = import.meta.env.DEV
    ? PROTOTYPE_THEMES[searchParams.get("variant") ?? ""]
    : undefined;
  const Outline = theme?.Outline ?? CurrentOutline;
  const Card = theme?.Card ?? CurrentCard;
  const totalPoints = questions.reduce((total, q) => total + q.points, 0);

  const startAdding = () => {
    setEditing("new");
    requestAnimationFrame(() =>
      document
        .getElementById("question-new")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const jumpTo = (questionId: string) =>
    document
      .getElementById(`question-${questionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section
        aria-label="Questions"
        className={cn("space-y-4", theme?.sectionClassName)}
      >
        {isLocked && (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {assessment.attemptCount} submission
            {assessment.attemptCount === 1 ? " has" : "s have"} been made, so
            questions can't be added, removed or re-scored. You can still fix
            their wording.
          </p>
        )}

        {questions.length === 0 && editing !== "new" && (
          <StaffCard className="border-dashed p-10 text-center shadow-none">
            <p className="text-sm text-muted-foreground">
              No questions yet. Add one to be able to publish this quiz.
            </p>
            {canAdd && (
              <Button className="mt-4 rounded-full" onClick={startAdding}>
                <Plus aria-hidden="true" />
                Add question
              </Button>
            )}
          </StaffCard>
        )}

        {questions.map((question) =>
          editing === question.id ? (
            <QuestionForm
              key={question.id}
              categoryId={categoryId}
              gestures={gestures}
              question={question}
              questionNumber={question.questionNumber}
              isLocked={isLocked}
              onDone={() => setEditing(null)}
            />
          ) : (
            <Card
              key={question.id}
              categoryName={categoryName}
              question={question}
              canEdit={editing === null}
              canDelete={editing === null && !isLocked}
              onEdit={() => setEditing(question.id)}
              onDelete={() => setDeleting(question)}
            />
          ),
        )}

        {editing === "new" && (
          <QuestionForm
            categoryId={categoryId}
            gestures={gestures}
            questionNumber={questions.length + 1}
            isLocked={isLocked}
            onDone={() => setEditing(null)}
          />
        )}

        {canAdd && questions.length > 0 && (
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-dashed"
            onClick={startAdding}
          >
            <Plus aria-hidden="true" />
            Add question
          </Button>
        )}
      </section>

      <aside className="lg:sticky lg:top-6">
        <Outline
          questions={questions}
          editingId={editing}
          canAdd={canAdd}
          onAdd={startAdding}
          onJump={jumpTo}
          totalPoints={totalPoints}
          attemptCount={assessment.attemptCount}
          passingScore={assessment.passingScore}
          categoryName={categoryName}
        />
      </aside>

      <DeleteQuestionDialog
        categoryId={categoryId}
        question={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

/* =========================================================
 * Page
 * ======================================================= */

export default function QuizEditorPage() {
  const { categoryId } = useParams();
  const { data, isLoading, error, refetch } = useTeacherAssessment(categoryId);
  const prototypeVariant = useSearchParams()[0].get("variant");

  return (
    <div className="space-y-6">
      <Link
        to="/teacher/quizzes"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Quizzes
      </Link>

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading quiz..."
        skeleton={
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <SidePanelSkeleton rows={6} />
          </div>
        }
        errorText="Unable to load this quiz."
        onRetry={() => void refetch()}
      />

      {data && categoryId && (
        <>
          {/* Keyed per lesson: the form's local state matches what the
              server echoes back after a save, and status comes from props. */}
          <QuizDetails key={data.category.id} data={data} />

          {data.assessment && (
            <QuestionsSection
              categoryId={categoryId}
              categoryName={data.category.name}
              assessment={data.assessment}
            />
          )}
        </>
      )}
      {import.meta.env.DEV && prototypeVariant && (
        <>
          <div className="h-16" />
          <PrototypeSwitcher
            variants={PROTOTYPE_VARIANTS}
            current={prototypeVariant}
          />
        </>
      )}
    </div>
  );
}
