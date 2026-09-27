import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CheckCircle2,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
} from "lucide-react";

import QueryState from "@/components/staff/query-state";
import { lessonPresentation } from "@/components/staff/lesson-presentation";
import QuizStatusBadge from "@/components/staff/quiz-status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import StaffPageHeader from "@/components/staff/staff-page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  flattenLessons,
  lessonsWithoutQuiz,
  quizzesOf,
  type Lesson,
  type Quiz,
} from "@/lib/lessons";
import { cn } from "@/lib/utils";
import type { AssessmentStatus } from "@/api/teacher-api";
import { useCreateQuiz } from "@/hooks/use-create-quiz";
import { useSaveAssessment } from "@/hooks/use-save-assessment";
import { useTeacherAssessments } from "@/hooks/use-teacher-assessments";


type StatusFilter = "ALL" | AssessmentStatus;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/* =========================================================
 * Quiz card
 * ======================================================= */

function QuizCard({ quiz }: { quiz: Quiz }) {
  const saveMutation = useSaveAssessment(quiz.categoryId);
  const { theme } = lessonPresentation(quiz.categoryName);
  const { assessment } = quiz;

  const setStatus = (status: AssessmentStatus) =>
    saveMutation.mutate({ status });

  return (
    <StaffCard className="relative flex h-full flex-col overflow-hidden p-5">
      {/* Decorative corner in the lesson's color. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-60",
          theme.bg,
        )}
      />

      <div className="relative flex items-start justify-between gap-2">
        <QuizStatusBadge status={assessment.status} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions for ${assessment.title}`}
              />
            }
          >
            <MoreVertical aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem
              render={<Link to={`/teacher/quizzes/${quiz.categoryId}`} />}
            >
              <Pencil aria-hidden="true" />
              Edit quiz
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {assessment.status === "PUBLISHED" ? (
              <DropdownMenuItem onClick={() => setStatus("DRAFT")}>
                <EyeOff aria-hidden="true" />
                Unpublish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={assessment.questionCount === 0}
                onClick={() => setStatus("PUBLISHED")}
              >
                <CheckCircle2 aria-hidden="true" />
                Publish
              </DropdownMenuItem>
            )}
            {assessment.status === "ARCHIVED" ? (
              <DropdownMenuItem onClick={() => setStatus("DRAFT")}>
                <ArchiveRestore aria-hidden="true" />
                Restore to draft
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatus("ARCHIVED")}>
                <Archive aria-hidden="true" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h2 className="relative mt-4 text-xl font-bold text-foreground">
        {assessment.title}
      </h2>
      <p className="relative mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <BookOpen aria-hidden="true" className="size-4" />
        Linked to: {quiz.categoryName}
      </p>

      {saveMutation.error && (
        <p role="alert" className="mt-2 text-xs font-bold text-red-600">
          {errorMessage(saveMutation.error, "Unable to update this quiz.")}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 border-t border-border pt-4">
        <div>
          <p className="font-bold text-foreground">{assessment.questionCount}</p>
          <p className="text-xs text-muted-foreground">Questions</p>
        </div>
        <div className="border-l border-border pl-4">
          <p
            className={cn(
              "font-bold",
              assessment.attemptCount === 0
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {assessment.attemptCount}
          </p>
          <p className="text-xs text-muted-foreground">Submissions</p>
        </div>
        <div className="border-l border-border pl-4">
          <p className="font-bold text-foreground">{assessment.passingScore}%</p>
          <p className="text-xs text-muted-foreground">To pass</p>
        </div>

        <Link
          to={`/teacher/quizzes/${quiz.categoryId}`}
          aria-label={`Edit ${assessment.title}`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon-lg" }),
            "ml-auto rounded-full text-primary",
          )}
        >
          <Pencil aria-hidden="true" />
        </Link>
      </div>
    </StaffCard>
  );
}

/* =========================================================
 * Create quiz dialog
 * ======================================================= */

function CreateQuizDialog({
  lessons,
  open,
  onOpenChange,
}: {
  lessons: Lesson[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const createMutation = useCreateQuiz();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState("80");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lessonItems = Object.fromEntries(
    lessons.map((lesson) => [
      lesson.categoryId,
      `${lesson.categoryName} · ${lesson.areaName}`,
    ]),
  );

  const handleLessonChange = (value: string | null) => {
    setCategoryId(value);
    const lesson = lessons.find((item) => item.categoryId === value);
    if (lesson && !title.trim()) setTitle(`${lesson.categoryName} Quiz`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const score = Number(passingScore);
    if (!categoryId) return setError("Choose the lesson this quiz is for.");
    if (!title.trim()) return setError("Give the quiz a title.");
    if (passingScore === "" || !(score >= 0 && score <= 100)) {
      return setError("Passing score must be a percentage from 0 to 100.");
    }

    try {
      await createMutation.mutateAsync({
        categoryId,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          passingScore: score,
          status: "DRAFT",
        },
      });
      onOpenChange(false);
      navigate(`/teacher/quizzes/${categoryId}`);
    } catch (submitError) {
      setError(errorMessage(submitError, "Unable to create this quiz."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 font-staff sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle className="text-2xl font-bold">
              Quiz details
            </DialogTitle>
            <DialogDescription>
              Each lesson has one quiz. You can add questions next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6">
            {lessons.length === 0 ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Every lesson already has a quiz. Open a quiz from the list to
                edit it.
              </p>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="quiz-lesson" className="font-bold">
                      Linked lesson
                    </Label>
                    <Select
                      items={lessonItems}
                      value={categoryId}
                      onValueChange={handleLessonChange}
                    >
                      <SelectTrigger id="quiz-lesson" className="h-10 w-full">
                        <SelectValue placeholder="Choose a lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem
                            key={lesson.categoryId}
                            value={lesson.categoryId}
                          >
                            {lessonItems[lesson.categoryId]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                      onChange={(e) => setPassingScore(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description" className="font-bold">
                    Description / instructions{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="quiz-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="text-sm font-bold text-red-600">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="m-0 rounded-b-xl border-t border-border bg-muted/40 p-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-6"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-full px-6"
              disabled={lessons.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
 * Page
 * ======================================================= */

export default function QuizzesPage() {
  const { data: areas, isLoading, error, refetch } = useTeacherAssessments();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const lessons = flattenLessons(areas ?? []);
  const quizzes = quizzesOf(lessons);
  const lessonsMissingQuiz = lessonsWithoutQuiz(lessons);
  const visibleQuizzes = quizzes.filter(
    (quiz) => statusFilter === "ALL" || quiz.assessment.status === statusFilter,
  );

  const countFor = (status: StatusFilter) =>
    status === "ALL"
      ? quizzes.length
      : quizzes.filter((quiz) => quiz.assessment.status === status).length;

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Quizzes"
        description="Manage your assessments and track student performance."
        actions={
          <Button
            className="h-11 rounded-full px-5"
            onClick={() => setCreateOpen(true)}
            disabled={!areas}
          >
            <Plus aria-hidden="true" />
            Create quiz
          </Button>
        }
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        loadingText="Loading quizzes..."
        errorText="Unable to load quizzes."
        onRetry={() => void refetch()}
      />

      {areas && (
        <>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <TabsList className="h-10 rounded-xl bg-secondary p-1">
              {(
                [
                  ["ALL", "All"],
                  ["PUBLISHED", "Published"],
                  ["DRAFT", "Drafts"],
                  ["ARCHIVED", "Archived"],
                ] as const
              ).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-lg px-3 font-bold"
                >
                  {label}
                  <span className="text-xs text-muted-foreground">
                    {countFor(value)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visibleQuizzes.length === 0 ? (
            <StaffCard className="border-dashed p-10 text-center shadow-none">
              <p className="text-sm text-muted-foreground">
                {quizzes.length === 0
                  ? "No quizzes yet. Create one for a lesson to get started."
                  : "No quizzes match this filter."}
              </p>
            </StaffCard>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
              {visibleQuizzes.map((quiz) => (
                <li key={quiz.categoryId}>
                  <QuizCard quiz={quiz} />
                </li>
              ))}
            </ul>
          )}

          {/* Remount per open so the form starts empty each time. */}
          {createOpen && (
            <CreateQuizDialog
              lessons={lessonsMissingQuiz}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
