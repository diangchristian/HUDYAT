/*
 * Shown for a moment after each finished sign: two party poppers fire confetti from the
 * bottom corners (up, then fluttering down with gravity) and a badge names the sign just
 * learned, a visual "well done" that needs no sound. With reduced motion only the badge shows.
 */
import type { CSSProperties } from "react";
import { Star } from "lucide-react";

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

export default function Celebration({ label, durationMs }: { label: string; durationMs: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div className="motion-reduce:hidden">
        {PIECES.map((piece, i) => (
          <span key={i} className="ls-piece absolute bottom-0" style={{ ...piece.style, [piece.side > 0 ? "left" : "right"]: "4%" }}>
            <span className={`ls-flutter block ${piece.shape}`} style={{ background: piece.color }} />
          </span>
        ))}
      </div>

      <div className="absolute inset-x-0 top-[28%] flex justify-center px-4">
        <div className="ls-badge relative" style={{ "--d": `${durationMs}ms` } as CSSProperties}>
          <span className="ls-rays absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <p className="relative flex items-center gap-2 rounded-3xl border-4 border-white bg-hudyat-gold px-5 py-3 text-xl font-black text-[#3C3C3C] shadow-[0_6px_0_#B87800] sm:text-2xl">
            <Star className="size-7 shrink-0 fill-white text-white" />
            <span>
              You learned <span className="uppercase">{label}</span>!
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
