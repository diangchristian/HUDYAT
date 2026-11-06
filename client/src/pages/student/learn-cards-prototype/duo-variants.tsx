/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE — throwaway. Duolingo-inspired learn-card variants
 * (`?variant=duo-card`), using the living characters
 * from duo-characters.tsx. Flat light-grey borders, chunky 3D press
 * buttons, uppercase action labels.
 */
import type { CategoryStatus } from "@/components/common/category-card";
import { cn } from "@/lib/utils";
import { DuoCharacter, PALETTE } from "./duo-characters";
import type { LearnCardProps } from "./learn-card-variants";

const LOCKED = { main: "#E5E5E5", dark: "#CECECE" };

const actionLabel = (status: CategoryStatus, progress: number) =>
  status === "locked" ? "Locked" : status === "completed" ? "Review" : progress > 0 ? "Continue" : "Start";

/* ── E · Mascot card ─────────────────────────────────────────────
 * Card is the character's stage: big living character, glossy
 * progress bar, chunky full-width action button (a span, since the
 * whole card is the button). Hover → character hops and grins. */
function MascotCard({ title, color, progress, status, statusText, onClick }: LearnCardProps) {
  const locked = status === "locked";
  const p = locked ? LOCKED : PALETTE[color];
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cn(
        "group flex w-full flex-col items-center rounded-2xl border-2 border-b-[6px] border-[#E5E5E5] bg-white p-5 text-center transition-colors",
        "hover:bg-[#F7F7F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hudyat-gold",
        locked && "cursor-not-allowed hover:bg-white",
      )}
    >
      <DuoCharacter title={title} color={color} asleep={locked} className="size-28" />
      <h3 className={cn("mt-3 text-xl font-extrabold", locked ? "text-[#AFAFAF]" : "text-[#4B4B4B]")}>{title}</h3>
      <p className="text-sm font-bold text-[#AFAFAF]">{statusText}</p>
      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
        <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: p.main }}>
          <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
        </div>
      </div>
      <span
        className={cn(
          "mt-5 w-full rounded-2xl py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-[0_4px_0_var(--edge)] transition-all duration-100",
          "group-active:translate-y-1 group-active:shadow-none",
          locked && "text-[#AFAFAF] group-active:translate-y-0 group-active:shadow-[0_4px_0_var(--edge)]",
        )}
        style={{ background: p.main, "--edge": p.dark } as React.CSSProperties}
      >
        {actionLabel(status, progress)}
      </span>
    </button>
  );
}

export const DUO_VARIANTS = [{ key: "duo-card", name: "Duo · Mascot card" }];

export const DUO_CARDS: Record<string, { Card: (props: LearnCardProps) => React.ReactNode; grid: string }> = {
  "duo-card": { Card: MascotCard, grid: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" },
};
