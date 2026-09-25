import { Archive, CheckCircle2, CircleDashed, PencilLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssessmentStatus } from "@/api/teacher-api";

const STATUS_PRESENTATION: Record<
  AssessmentStatus | "NONE",
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  PUBLISHED: {
    label: "Published",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800",
  },
  DRAFT: {
    label: "Draft",
    icon: PencilLine,
    className: "bg-slate-100 text-slate-700",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    className: "bg-amber-100 text-amber-800",
  },
  NONE: {
    label: "No quiz",
    icon: CircleDashed,
    className: "border-border bg-transparent text-muted-foreground",
  },
};

export default function QuizStatusBadge({
  status,
  className,
}: {
  status: AssessmentStatus | null;
  className?: string;
}) {
  const presentation = STATUS_PRESENTATION[status ?? "NONE"];
  const Icon = presentation.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("h-6 px-2.5 font-bold", presentation.className, className)}
    >
      <Icon aria-hidden="true" data-icon="inline-start" />
      {presentation.label}
    </Badge>
  );
}
