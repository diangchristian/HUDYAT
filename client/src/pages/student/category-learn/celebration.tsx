/* eslint-disable react-refresh/only-export-components -- CHEER_MS is shared with the lesson session */
/*
 * Shown for a moment after each sign, sized to what happened, so 26 letters don't get 26 identical bursts:
 *  - sign:      a small pop of confetti and "You learned K!"
 *  - milestone: every 5th sign signed, the full confetti burst and "5 signs learned!"
 *  - finale:    the lesson's last sign, the full burst and "You finished Alphabet!"
 *  - skip:      no confetti, just a gentle "We'll practise K later", since nothing was signed
 * Confetti fires from the bottom corners (up, then fluttering down). With reduced motion only the badge shows.
 */
import type { CSSProperties } from "react";
import { Star } from "lucide-react";

export type CheerKind = "sign" | "milestone" | "finale" | "skip";

export const CHEER_MS: Record<CheerKind, number> = { sign: 1400, milestone: 2200, finale: 2800, skip: 1400 };

const PIECE_COUNT: Record<CheerKind, number> = { sign: 20, milestone: 70, finale: 70, skip: 0 };

const COLORS = ["#FF4B4B", "#FFC145", "#1CB0F6", "#58CC02", "#CE82FF", "#FF86D0", "#FF9600"];
const SHAPES = ["h-3.5 w-2 rounded-[2px]", "size-2.5 rounded-full", "h-5 w-1 rounded-full", "size-3 rounded-[3px]"];

// Fixed at load (not per render): each piece's colour, shape and flight path.
const PIECES = Array.from({ length: 70 }, (_, i) => {
  const side = i % 2 ? -1 : 1; // even pieces fire from the left corner, odd from the right
  return {
    side,
    color: COLORS[i % COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    style: {
      "--x": `${side * (12 + Math.random() * 55)}vw`,
      "--peak": `${-(45 + Math.random() * 45)}vh`,
      "--r": `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540)}deg`,
      "--d": `${1.6 + Math.random() * 0.8}s`,
      animationDelay: `${Math.floor(i / 2) * 12}ms`,
    } as CSSProperties,
  };
});

type Props = { kind?: CheerKind; label: string; count?: number; durationMs: number };

function message({ kind, label, count }: Required<Props>) {
  if (kind === "milestone") return `${count} signs learned!`;
  if (kind === "finale") return `You finished ${label}!`;
  if (kind === "skip") return <>We'll practise <span className="uppercase">{label}</span> later</>;
  return <>You learned <span className="uppercase">{label}</span>!</>;
}

export default function Celebration({ kind = "sign", label, count = 0, durationMs }: Props) {
  const skip = kind === "skip";
  const big = kind === "milestone" || kind === "finale";
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div className="motion-reduce:hidden">
        {PIECES.slice(0, PIECE_COUNT[kind]).map((piece, i) => (
          <span key={i} className="ls-piece absolute bottom-0" style={{ ...piece.style, [piece.side > 0 ? "left" : "right"]: "4%" }}>
            <span className={`ls-flutter block ${piece.shape}`} style={{ background: piece.color }} />
          </span>
        ))}
      </div>

      <div className="absolute inset-x-0 top-[28%] flex justify-center px-4">
        <div className="ls-badge relative" style={{ "--d": `${durationMs}ms` } as CSSProperties}>
          {big && <span className="ls-rays absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />}
          <p
            className={
              skip
                ? "relative rounded-3xl border-4 border-white bg-[#F2F2F2] px-5 py-3 text-lg font-extrabold text-[#4B4B4B] shadow-[0_6px_0_#CECECE] sm:text-xl"
                : `relative flex items-center gap-2 rounded-3xl border-4 border-white bg-hudyat-gold px-5 py-3 font-black text-[#3C3C3C] shadow-[0_6px_0_#B87800] ${big ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`
            }
          >
            {!skip && <Star className={`shrink-0 fill-white text-white ${big ? "size-8" : "size-7"}`} />}
            <span>{message({ kind, label, count, durationMs })}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
