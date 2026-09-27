import { lessonPresentation } from "./lesson-presentation";
import { cn } from "@/lib/utils";

export default function LessonIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { icon: Icon, theme } = lessonPresentation(name);

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        theme.bg,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("size-5", theme.icon)} />
    </span>
  );
}
