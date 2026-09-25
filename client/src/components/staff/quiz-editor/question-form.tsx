import { useState } from "react";
import { ArrowDown, ArrowUp, Lock, Plus, Trash2, X } from "lucide-react";

import { StaffCard, StaffCardHeader } from "@/components/staff/staff-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AuthoringQuestion,
  Gesture,
  QuestionInput,
  QuestionType,
} from "@/api/teacher-api";
import { useCreateQuestion } from "@/hooks/use-create-question";
import { useUpdateQuestion } from "@/hooks/use-update-question";
import FeedbackMessage from "./feedback-message";
import {
  MAX_CHOICES,
  MIN_CHOICES,
  QUESTION_TYPES,
  QUESTION_TYPE_ITEMS,
  choiceLetter,
  errorMessage,
  type Feedback,
} from "./question-types";

/* =========================================================
 * Question form (add / edit)
 * ======================================================= */

type QuestionFormProps = {
  categoryId: string;
  gestures: Gesture[];
  question?: AuthoringQuestion;
  questionNumber: number;
  isLocked: boolean;
  onDone: () => void;
};

export default function QuestionForm({
  categoryId,
  gestures,
  question,
  questionNumber,
  isLocked,
  onDone,
}: QuestionFormProps) {
  const createMutation = useCreateQuestion(categoryId);
  const updateMutation = useUpdateQuestion(categoryId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Once learners have attempted the quiz, only the wording of an
  // existing question can change (the server enforces this too).
  const wordingOnly = isLocked && Boolean(question);

  const [questionText, setQuestionText] = useState(question?.questionText ?? "");
  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.questionType ?? "IMAGE_GESTURE",
  );
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [referenceMediaUrl, setReferenceMediaUrl] = useState(
    question?.referenceMediaUrl ?? "",
  );
  const [choiceIds, setChoiceIds] = useState<string[]>(
    question?.choices.map((choice) => choice.gesture.id) ?? [],
  );
  const [correctId, setCorrectId] = useState<string | null>(
    question?.gesture.id ?? null,
  );
  const [pendingGestureId, setPendingGestureId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const gestureById = new Map(gestures.map((gesture) => [gesture.id, gesture]));
  const availableGestures = gestures.filter(
    (gesture) => !choiceIds.includes(gesture.id),
  );
  const availableItems = Object.fromEntries(
    availableGestures.map((gesture) => [gesture.id, gesture.label]),
  );

  const markCorrect = (gestureId: string) => {
    setCorrectId(gestureId);

    const label = gestureById.get(gestureId)?.label;
    if (!questionText.trim() && label) {
      setQuestionText(`Which one is the correct sign for "${label}"?`);
    }
  };

  const addChoice = () => {
    if (!pendingGestureId || choiceIds.length >= MAX_CHOICES) return;

    setChoiceIds((current) => [...current, pendingGestureId]);
    // The first choice added becomes the correct answer by default.
    if (!correctId) markCorrect(pendingGestureId);
    setPendingGestureId(null);
  };

  const removeChoice = (gestureId: string) => {
    setChoiceIds((current) => current.filter((id) => id !== gestureId));
    if (correctId === gestureId) setCorrectId(null);
  };

  const moveChoice = (index: number, offset: -1 | 1) => {
    setChoiceIds((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!questionText.trim()) {
      setFeedback({ type: "error", message: "Question text is required." });
      return;
    }

    // A locked question only accepts new wording (see the server's
    // lock rules); everything that affects scoring stays as-is.
    let data: QuestionInput = { questionText: questionText.trim() };

    if (!wordingOnly) {
      const pointsValue = Number(points);
      if (!(pointsValue > 0)) {
        setFeedback({ type: "error", message: "Points must be greater than 0." });
        return;
      }
      if (choiceIds.length < MIN_CHOICES) {
        setFeedback({
          type: "error",
          message: `Add at least ${MIN_CHOICES} answer choices.`,
        });
        return;
      }
      if (!correctId || !choiceIds.includes(correctId)) {
        setFeedback({ type: "error", message: "Mark which choice is correct." });
        return;
      }

      data = {
        ...data,
        referenceMediaUrl: referenceMediaUrl.trim() || null,
        questionType,
        points: pointsValue,
        gestureId: correctId,
        choiceGestureIds: choiceIds,
      };
    }

    try {
      if (question) {
        await updateMutation.mutateAsync({ questionId: question.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onDone();
    } catch (error) {
      setFeedback({
        type: "error",
        message: errorMessage(error, "Unable to save this question."),
      });
    }
  };

  const fieldId = (name: string) => `${question?.id ?? "new"}-${name}`;

  return (
    <StaffCard
      id={question ? `question-${question.id}` : "question-new"}
      className="scroll-mt-24 ring-2 ring-ring/40"
    >
      <form onSubmit={handleSubmit}>
        <StaffCardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
              {questionNumber}
            </span>
            <h3 className="font-bold text-foreground">
              {question ? `Edit question ${questionNumber}` : "New question"}
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel editing"
            onClick={onDone}
          >
            <X aria-hidden="true" />
          </Button>
        </StaffCardHeader>

        <div className="space-y-6 p-5 sm:p-6">
          {wordingOnly && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Learners have already taken this quiz, so only the wording can
              change. Choices, points, type and media are locked.
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-[1fr_140px_120px]">
            <div className="space-y-2">
              <Label htmlFor={fieldId("text")} className="font-bold">
                Question <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id={fieldId("text")}
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. Which one is the correct sign for “A”?"
                className="bg-muted/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("type")} className="font-bold">
                Type
              </Label>
              <Select
                items={QUESTION_TYPE_ITEMS}
                value={questionType}
                disabled={wordingOnly}
                onValueChange={(value) =>
                  value && setQuestionType(value as QuestionType)
                }
              >
                <SelectTrigger id={fieldId("type")} className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPES).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("points")} className="font-bold">
                Points
              </Label>
              <Input
                id={fieldId("points")}
                type="number"
                min={1}
                value={points}
                disabled={wordingOnly}
                onChange={(e) => setPoints(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <fieldset className="space-y-3" disabled={wordingOnly}>
            <legend className="text-sm font-bold text-foreground">
              Choices <span className="text-red-600">*</span>{" "}
              <span className="font-normal text-muted-foreground">
                Learners see them in this order. Select the correct one.
              </span>
            </legend>

            {choiceIds.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Add between {MIN_CHOICES} and {MAX_CHOICES} signs from this
                lesson.
              </p>
            )}

            <ol className="space-y-2">
              {choiceIds.map((gestureId, index) => {
                const gesture = gestureById.get(gestureId);
                const label = gesture?.label ?? "Unknown sign";
                const isCorrect = correctId === gestureId;

                return (
                  <li
                    key={gestureId}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2 pr-3 transition-colors",
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-transparent bg-muted/60",
                    )}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name={fieldId("correct")}
                        checked={isCorrect}
                        onChange={() => markCorrect(gestureId)}
                        className="ml-1 size-4 accent-emerald-600"
                      />
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                        {gesture?.referenceImageUrl ? (
                          <img
                            src={gesture.referenceImageUrl}
                            alt=""
                            loading="lazy"
                            className="size-full object-contain p-0.5"
                          />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {choiceLetter(index)}
                          </span>
                        )}
                      </span>
                      <span className="truncate font-bold text-foreground">
                        {choiceLetter(index)}. {label}
                      </span>
                      {isCorrect && (
                        <Badge className="bg-emerald-600 text-white">
                          Correct
                        </Badge>
                      )}
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveChoice(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${label} up`}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveChoice(index, 1)}
                      disabled={index === choiceIds.length - 1}
                      aria-label={`Move ${label} down`}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeChoice(gestureId)}
                      aria-label={`Remove ${label}`}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ol>

            {choiceIds.length < MAX_CHOICES && availableGestures.length > 0 && (
              <div className="flex gap-2">
                <Select
                  items={availableItems}
                  value={pendingGestureId}
                  onValueChange={setPendingGestureId}
                >
                  <SelectTrigger
                    aria-label="Sign to add as a choice"
                    className="h-9 w-full max-w-60"
                  >
                    <SelectValue placeholder="Choose a sign…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGestures.map((gesture) => (
                      <SelectItem key={gesture.id} value={gesture.id}>
                        {gesture.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={!pendingGestureId}
                  onClick={addChoice}
                >
                  <Plus aria-hidden="true" />
                  Add answer
                </Button>
              </div>
            )}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor={fieldId("media")} className="font-bold">
              Reference media URL{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={fieldId("media")}
              value={referenceMediaUrl}
              disabled={wordingOnly}
              onChange={(e) => setReferenceMediaUrl(e.target.value)}
              placeholder="https://…"
              className="h-10"
            />
          </div>

          <FeedbackMessage feedback={feedback} />
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-5"
            disabled={isPending}
            onClick={onDone}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-10 rounded-full px-5"
            disabled={isPending}
          >
            {isPending ? "Saving..." : question ? "Save question" : "Add question"}
          </Button>
        </div>
      </form>
    </StaffCard>
  );
}
