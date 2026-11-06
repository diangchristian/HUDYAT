/* eslint-disable react-refresh/only-export-components -- PALETTE is shared with the card */
/*
 * Living lesson characters for the Learn page cards: flat fills with a
 * bottom-right shade rim, eyes that blink and glance around, idle motion.
 * Hover (on the `.group` card) → hop + happy ^^ eyes + open mouth.
 * `asleep` → closed eyes, floating Zs, no idle motion (locked lessons).
 * Motion lives in learn-card.css.
 */
import { useId } from "react";

import type { CategoryColor } from "@/components/common/categories.constants";

export const PALETTE: Record<CategoryColor, { main: string; light: string; dark: string }> = {
  green: { main: "#84CC16", light: "#ECFCCB", dark: "#4D7C0F" },
  yellow: { main: "#FACC15", light: "#FEF9C3", dark: "#A16207" },
  blue: { main: "#38BDF8", light: "#E0F2FE", dark: "#0369A1" },
  purple: { main: "#C084FC", light: "#F3E8FF", dark: "#7E22CE" },
  orange: { main: "#FB923C", light: "#FFEDD5", dark: "#C2410C" },
  red: { main: "#F87171", light: "#FEE2E2", dark: "#B91C1C" },
};

const PUPIL = "#3C3C3C";
const SKIN = { main: "#FFC89E", dark: "#D9895A" };
const GOLD = { main: "#FFC145", dark: "#C98A00" };
const SKY = { main: "#1CB0F6", dark: "#1480B3" };
const PINK = { main: "#FF86D0", dark: "#C2549A" };
const HAIR = { main: "#5B3A29", dark: "#3E2619" };

// Rounded-rect as a path, so shapes can be merged into one body `d`.
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;

type Tone = { main: string; dark: string };

// Flat body + shade rim: dark copy under, main copy nudged up-left, both clipped to the shape.
function Body({ d, tone, children }: { d: string; tone: Tone; children?: React.ReactNode }) {
  const id = `lc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={tone.dark} />
        <path d={d} fill={tone.main} transform="translate(-3 -4)" />
        {children}
      </g>
    </g>
  );
}

function Face({ x, y, s = 1, asleep }: { x: number; y: number; s?: number; asleep?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {asleep ? (
        <path d="M-12 0 q4 4 8 0 M4 0 q4 4 8 0" fill="none" stroke={PUPIL} strokeWidth={2.5} strokeLinecap="round" />
      ) : (
        <>
          <g className="lc-eyes">
            <g className="lc-blink">
              <ellipse cx={-8} cy={0} rx={6.5} ry={7.5} fill="#fff" />
              <ellipse cx={8} cy={0} rx={6.5} ry={7.5} fill="#fff" />
              <g className="lc-look">
                <circle cx={-7} cy={1} r={3.6} fill={PUPIL} />
                <circle cx={9} cy={1} r={3.6} fill={PUPIL} />
                <circle cx={-6} cy={-0.5} r={1.2} fill="#fff" />
                <circle cx={10} cy={-0.5} r={1.2} fill="#fff" />
              </g>
            </g>
          </g>
          <path className="lc-happy" d="M-13 2 q5 -8 10 0 M3 2 q5 -8 10 0" fill="none" stroke={PUPIL} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      <path className="lc-smile" d="M-4 10 q4 4 8 0" fill="none" stroke={PUPIL} strokeWidth={2.5} strokeLinecap="round" />
      {!asleep && <path className="lc-open" d="M-5 9 h10 a5 5 0 0 1 -10 0z" fill={PUPIL} />}
    </g>
  );
}

type Draw = (c: Tone, asleep: boolean) => React.ReactNode;

const tone = (color: CategoryColor): Tone => ({ main: PALETTE[color].main, dark: PALETTE[color].dark });

const CHARACTERS: Record<string, Draw> = {
  Alphabet: (c, z) => (
    <>
      <g className="lc-float" style={{ animationDelay: "-1s" }}>
        <Body d={rr(52, 4, 22, 22, 6)} tone={GOLD} />
        <text x={63} y={20.5} textAnchor="middle" fontSize={15} fontWeight={900} fill="#fff">A</text>
      </g>
      <g className="lc-idle">
        <Body d={rr(10, 26, 50, 46, 12)} tone={c} />
        <Face x={35} y={44} asleep={z} />
      </g>
    </>
  ),
  Numbers: (c, z) => (
    <>
      <path d="M40 60 q-6 6 0 10 q5 4 0 8" fill="none" stroke="#AFAFAF" strokeWidth={2} strokeLinecap="round" />
      <g className="lc-sway">
        <Body d="M40 6 C58 6 64 22 62 34 C60 48 50 58 40 58 C30 58 20 48 18 34 C16 22 22 6 40 6z M36 58 h8 l-4 5z" tone={c} />
        <Face x={40} y={30} asleep={z} />
      </g>
      <g className="lc-float" style={{ animationDelay: "-.6s" }}>
        <text x={68} y={22} textAnchor="middle" fontSize={16} fontWeight={900} fill={SKY.main}>1</text>
        <text x={10} y={20} textAnchor="middle" fontSize={13} fontWeight={900} fill={PINK.main}>2</text>
      </g>
    </>
  ),
  Colors: (c, z) => (
    <>
      <ellipse cx={40} cy={72} rx={24} ry={5} fill={c.main} opacity={0.35} />
      <g className="lc-idle">
        <Body d="M40 6 C40 6 16 36 16 50 a24 24 0 0 0 48 0 C64 36 40 6 40 6z" tone={c} />
        <Face x={40} y={50} asleep={z} />
      </g>
      <g className="lc-float">
        <Body d="M10 14 c0 0 -6 8 -6 12 a6 6 0 0 0 12 0 c0 -4 -6 -12 -6 -12z" tone={SKY} />
        <Body d="M70 26 c0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c0 -3 -5 -10 -5 -10z" tone={PINK} />
      </g>
    </>
  ),
  Shapes: (c, z) => (
    <>
      <g className="lc-idle" style={{ animationDelay: "-.2s" }}>
        <Body d="M40 4 L58 34 H22z" tone={GOLD} />
        <Face x={40} y={25} s={0.5} asleep={z} />
      </g>
      <g className="lc-idle" style={{ animationDelay: "-.8s" }}>
        <Body d="M22 38 a16 16 0 1 1 0.01 0z M22 38" tone={c} />
        <Face x={22} y={54} s={0.65} asleep={z} />
      </g>
      <g className="lc-idle" style={{ animationDelay: "-1.4s" }}>
        <Body d={rr(42, 40, 32, 32, 7)} tone={SKY} />
        <Face x={58} y={55} s={0.65} asleep={z} />
      </g>
    </>
  ),
  Calendar: (c, z) => (
    <g className="lc-idle">
      <Body d={rr(12, 16, 56, 56, 12)} tone={{ main: "#FFFFFF", dark: "#D7D7D7" }}>
        <rect x={0} y={0} width={80} height={32} fill={c.main} />
      </Body>
      <rect x={24} y={8} width={7} height={16} rx={3.5} fill="#AFAFAF" />
      <rect x={49} y={8} width={7} height={16} rx={3.5} fill="#AFAFAF" />
      <Face x={40} y={50} asleep={z} />
    </g>
  ),
  "WH Questions": (c, z) => (
    <>
      <g className={z ? undefined : "lc-tilt"}>
        <Body d={`${rr(8, 18, 62, 44, 16)} M20 56 L16 74 L36 58z`} tone={c} />
        <Face x={39} y={38} asleep={z} />
      </g>
      <text className="lc-float" x={70} y={16} textAnchor="middle" fontSize={20} fontWeight={900} fill={GOLD.main}>?</text>
    </>
  ),
  "Word Concepts": (c, z) => (
    <>
      <g className="lc-idle">
        <rect x={20} y={14} width={44} height={56} rx={8} fill="#fff" stroke="#E5E5E5" strokeWidth={2} />
        <Body d={rr(14, 12, 44, 58, 9)} tone={c} />
        <rect x={14} y={12} width={8} height={58} rx={4} fill={c.dark} opacity={0.4} />
        <Face x={38} y={38} s={0.9} asleep={z} />
      </g>
      <g className="lc-float" style={{ animationDelay: "-1.2s" }}>
        <Body d={rr(50, 0, 28, 16, 8)} tone={GOLD} />
        <text x={64} y={11.5} textAnchor="middle" fontSize={9} fontWeight={900} fill="#fff">abc</text>
      </g>
    </>
  ),
  // Student (left) and teacher (right) greet each other; talk bobs sync with the scene's speech bubbles.
  Greetings: (c, z) => (
    <>
      <g className={z ? undefined : "lc-talk"}>
        <Body d={rr(9, 54, 26, 22, 10)} tone={c} />
        <rect x={13} y={54} width={4} height={20} rx={2} fill={GOLD.dark} opacity={0.7} />
        <Body d="M22 30 a12 12 0 1 1 -0.01 0z" tone={SKIN} />
        <Body d="M10 40 a12 12 0 0 1 24 0 q-5 -5 -12 -3 q-7 -2 -12 3z" tone={HAIR} />
        <Face x={22} y={44} s={0.6} asleep={z} />
        <g className={z ? undefined : "lc-wave"}>
          <rect x={31} y={44} width={6} height={14} rx={3} fill={c.main} />
          <circle cx={34} cy={43} r={4} fill={SKIN.main} />
        </g>
      </g>
      <g className={z ? undefined : "lc-talk"} style={{ animationDelay: "2.5s" }}>
        <Body d={rr(44, 44, 30, 32, 11)} tone={SKY} />
        <path d="M56 44 h6 l-1 4 2 12 -4 4 -4 -4 2 -12z" fill="#FF4B4B" />
        <Body d="M59 18 a13 13 0 1 1 -0.01 0z" tone={SKIN} />
        <Body d="M46 29 a13 13 0 0 1 26 0 q-2 -3 -13 -4 q-11 1 -13 4z" tone={HAIR} />
        <Face x={59} y={33} s={0.65} asleep={z} />
        <g fill="none" stroke={PUPIL} strokeWidth={1.4}>
          <circle cx={53.8} cy={33} r={5} />
          <circle cx={64.2} cy={33} r={5} />
          <path d="M58.8 33 h0.4" />
        </g>
      </g>
    </>
  ),
  // Dad (left), mom (right) and the kid in the middle holding both their hands.
  Family: (c, z) => (
    <>
      <g className="lc-idle" style={{ animationDelay: "-.3s" }}>
        <Body d={rr(4, 46, 24, 30, 10)} tone={SKY} />
        <Body d="M16 21 a11 11 0 1 1 -0.01 0z" tone={SKIN} />
        <Body d="M5 31 a11 11 0 0 1 22 0 q-5 -4 -11 -3 q-6 -1 -11 3z" tone={HAIR} />
        <Face x={16} y={35} s={0.55} asleep={z} />
      </g>
      <g className="lc-idle" style={{ animationDelay: "-.9s" }}>
        <Body d={rr(51, 24, 26, 28, 12)} tone={HAIR} />
        <Body d={rr(52, 46, 24, 30, 10)} tone={PINK} />
        <Body d="M64 21 a11 11 0 1 1 -0.01 0z" tone={SKIN} />
        <Body d="M53 31 a11 11 0 0 1 22 0 q-8 -6 -14 -1 q-4 -2 -8 1z" tone={HAIR} />
        <Face x={64} y={35} s={0.55} asleep={z} />
      </g>
      <path d="M26 56 q4 8 8 9 M54 56 q-4 8 -8 9" fill="none" stroke={SKIN.main} strokeWidth={3.5} strokeLinecap="round" />
      <g className="lc-idle" style={{ animationDelay: "-1.5s" }}>
        <Body d={rr(31, 58, 18, 18, 7)} tone={c} />
        <Body d="M40 39 a9 9 0 1 1 -0.01 0z" tone={SKIN} />
        <Body d="M31 47 a9 9 0 0 1 18 0 q-4 -4 -9 -2 q-5 -2 -9 2z M40 40 q2 -5 5 -4 q-3 1 -3 5z" tone={HAIR} />
        <Face x={40} y={50} s={0.45} asleep={z} />
      </g>
    </>
  ),
};

const FALLBACK: Draw = (c, z) => (
  <g className="lc-idle">
    <Body d="M40 6 l9.5 19 21 3 -15 15 3.6 21 -19 -10 -19 10 3.6 -21 -15 -15 21 -3z" tone={c} />
    <Face x={40} y={40} s={0.8} asleep={z} />
  </g>
);

export function LessonCharacter({
  title,
  color,
  asleep = false,
  className,
}: {
  title: string;
  color: CategoryColor;
  asleep?: boolean;
  className?: string;
}) {
  const draw = CHARACTERS[title] ?? FALLBACK;
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true" overflow="visible" fontFamily="Nunito, sans-serif">
      <g className={asleep ? "lc-asleep" : "lc-char"}>{draw(tone(color), asleep)}</g>
      {asleep && (
        <g fill="#AFAFAF" fontWeight={900}>
          <text className="lc-z" x={66} y={18} fontSize={12}>z</text>
          <text className="lc-z" x={72} y={8} fontSize={9} style={{ animationDelay: "-1s" }}>z</text>
        </g>
      )}
    </svg>
  );
}
