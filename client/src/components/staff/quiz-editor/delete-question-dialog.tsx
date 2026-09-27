import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthoringQuestion } from "@/api/teacher-api";
import { useDeleteQuestion } from "@/hooks/use-delete-question";
import { errorMessage } from "./question-types";

/* =========================================================
 * Delete confirmation
 * ======================================================= */

export default function DeleteQuestionDialog({
  categoryId,
  question,
  onClose,
}: {
  categoryId: string;
  question: AuthoringQuestion | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteQuestion(categoryId);

  // Clear any failed-delete error so it can't reappear on the next
  // question's dialog.
  const close = () => {
    deleteMutation.reset();
    onClose();
  };

  const handleDelete = async () => {
    if (!question) return;
    try {
      await deleteMutation.mutateAsync(question.id);
      close();
    } catch {
      // Shown below via deleteMutation.error.
    }
  };

  return (
    <Dialog
      open={Boolean(question)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="font-staff">
        <DialogHeader>
          <DialogTitle>Delete question {question?.questionNumber}?</DialogTitle>
          <DialogDescription>
            This removes the question and its choices. Later questions are
            renumbered.
          </DialogDescription>
        </DialogHeader>

        {deleteMutation.error && (
          <p role="alert" className="text-sm font-bold text-red-600">
            {errorMessage(deleteMutation.error, "Unable to delete this question.")}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={deleteMutation.isPending}
            onClick={close}
          >
            Keep it
          </Button>
          <Button
            variant="destructive"
            className="rounded-full bg-red-600 text-white hover:bg-red-700"
            disabled={deleteMutation.isPending}
            onClick={() => void handleDelete()}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
