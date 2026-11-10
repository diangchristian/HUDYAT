/*
 * Learn page lesson card: the lesson's living character standing in its
 * own cartoon world, a progress bar and a chunky action button.
 * Hover → card lifts onto a lesson-coloured edge and tilts, the character
 * hops, the world speeds up. Locked → character sleeps in a night-time world.
 */
import type { CategoryColor, CategoryStatus } from "@/components/common/category-card";
import { cn } from "@/lib/utils";

import { PALETTE } from "./characters";
import LessonStage from "./lesson-stage";

const LOCKED = { main: "#D7D7D7", dark: "#AFAFAF" };

const actionLabel = (status: CategoryStatus, progress: number) =>
  status === "locked" ? "Locked" : status === "completed" ? "Review" : progress > 0 ? "Continue" : "Start";

type LearnCardProps = {
  title: string;
  color: CategoryColor;
  progress: number;
  status: CategoryStatus;
  statusText: string;
  onClick: () => void;
  /** Replaces the progress bar (the quiz page shows stars there). */
  children?: React.ReactNode;
  /** Overrides the button text (the quiz page says QUIZ / SIGN TEST / PLAY AGAIN). */
  actionText?: string;
};

export function LessonProgressBar({ title, percent, fill, className }: { title: string; percent: number; fill: string; className?: string }) {
  return (
    <div
      className={cn("h-4 w-full overflow-hidden rounded-full bg-[#E5E5E5]", className)}
      role="progressbar"
      aria-label={`${title} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%`, background: fill }}>
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

export default function LearnCard({ title, color, progress, status, statusText, onClick, children, actionText }: LearnCardProps) {
  const locked = status === "locked";
  const p = locked ? LOCKED : PALETTE[color];
  const percent = Math.min(100, Math.max(0, progress));
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      style={{ "--edge": locked ? "#E5E5E5" : p.main, "--btn": p.dark } as React.CSSProperties}
      className={cn(
        "lc-card group flex w-full flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white text-center",
        "shadow-[0_6px_0_#E5E5E5] transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
        "hover:-translate-y-1.5 hover:border-[var(--edge)] hover:shadow-[0_10px_0_var(--edge)]",
        "active:translate-y-0.5 active:shadow-[0_2px_0_var(--edge)] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hudyat-gold",
        locked && "cursor-not-allowed hover:translate-y-0 hover:border-[#E5E5E5] hover:shadow-[0_6px_0_#E5E5E5]",
      )}
    >
      <LessonStage title={title} color={color} asleep={locked} />

      <div className="flex flex-col items-center px-5 pb-5 pt-3">
        <h3 className={cn("text-xl font-extrabold", locked ? "text-[#AFAFAF]" : "text-[#4B4B4B]")}>{title}</h3>
        <p className="text-sm font-bold text-[#AFAFAF]">{statusText}</p>
        {children ?? <LessonProgressBar title={title} percent={percent} fill={p.main} className="mt-4" />}
        <span
          className={cn(
            "relative mt-5 w-full overflow-hidden rounded-2xl py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-[0_4px_0_var(--btn)] transition-all duration-100",
            "group-active:translate-y-1 group-active:shadow-none",
            locked && "text-[#8A8A8A] group-active:translate-y-0 group-active:shadow-[0_4px_0_var(--btn)]",
          )}
          style={{ background: p.main }}
        >
          {!locked && <span className="lc-shine absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40" />}
          <span className="relative">{actionText ?? actionLabel(status, progress)}</span>
        </span>
      </div>
    </button>
  );
}
