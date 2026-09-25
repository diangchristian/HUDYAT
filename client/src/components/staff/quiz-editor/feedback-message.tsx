import { cn } from "@/lib/utils";
import type { Feedback } from "./question-types";

export default function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;

  return (
    <p
      role="alert"
      className={cn(
        "text-sm font-bold",
        feedback.type === "success" ? "text-emerald-700" : "text-red-600",
      )}
    >
      {feedback.message}
    </p>
  );
}
