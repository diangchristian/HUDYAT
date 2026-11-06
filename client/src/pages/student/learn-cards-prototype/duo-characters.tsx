/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE — throwaway. Duolingo-*inspired* (original, not copied)
 * living characters for each lesson: flat fills with a bottom-right
 * shade rim, big eyes that blink and glance around, idle breathing/bobbing.
 * Hover (on any `.group` ancestor) → hop + happy ^^ eyes + open mouth.
 * `asleep` → closed eyes, floating Zs, no idle motion (locked lessons).
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

// Rounded-rect as a path, so shapes can be merged into one body `d`.
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;

type Tone = { main: string; dark: string };

// Flat body + shade rim: dark copy under, main copy nudged up-left, both clipped to the shape.
function Body({ d, tone, children }: { d: string; tone: Tone; children?: React.ReactNode }) {
  const id = `duo${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
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
          <g className="duo-eyes">
            <g className="duo-blink">
              <ellipse cx={-8} cy={0} rx={6.5} ry={7.5} fill="#fff" />
              <ellipse cx={8} cy={0} rx={6.5} ry={7.5} fill="#fff" />
              <g className="duo-look">
                <circle cx={-7} cy={1} r={3.6} fill={PUPIL} />
                <circle cx={9} cy={1} r={3.6} fill={PUPIL} />
                <circle cx={-6} cy={-0.5} r={1.2} fill="#fff" />
                <circle cx={10} cy={-0.5} r={1.2} fill="#fff" />
              </g>
            </g>
          </g>
          <path className="duo-happy" d="M-13 2 q5 -8 10 0 M3 2 q5 -8 10 0" fill="none" stroke={PUPIL} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      <path className="duo-smile" d="M-4 10 q4 4 8 0" fill="none" stroke={PUPIL} strokeWidth={2.5} strokeLinecap="round" />
      {!asleep && <path className="duo-open" d="M-5 9 h10 a5 5 0 0 1 -10 0z" fill={PUPIL} />}
    </g>
  );
}

type Draw = (c: Tone, asleep: boolean) => React.ReactNode;

const tone = (color: CategoryColor): Tone => ({ main: PALETTE[color].main, dark: PALETTE[color].dark });

const CHARACTERS: Record<string, Draw> = {
  Alphabet: (c, z) => (
    <>
      <g className="duo-float" style={{ animationDelay: "-1s" }}>
        <Body d={rr(52, 4, 22, 22, 6)} tone={GOLD} />
        <text x={63} y={20.5} textAnchor="middle" fontSize={15} fontWeight={900} fill="#fff">A</text>
      </g>
      <g className="duo-idle">
        <Body d={rr(10, 26, 50, 46, 12)} tone={c} />
        <Face x={35} y={44} asleep={z} />
      </g>
    </>
  ),
  Numbers: (c, z) => (
    <>
      <path d="M40 60 q-6 6 0 10 q5 4 0 8" fill="none" stroke="#AFAFAF" strokeWidth={2} strokeLinecap="round" />
      <g className="duo-sway">
        <Body d="M40 6 C58 6 64 22 62 34 C60 48 50 58 40 58 C30 58 20 48 18 34 C16 22 22 6 40 6z M36 58 h8 l-4 5z" tone={c} />
        <Face x={40} y={30} asleep={z} />
      </g>
      <g className="duo-float" style={{ animationDelay: "-.6s" }}>
        <text x={68} y={22} textAnchor="middle" fontSize={16} fontWeight={900} fill={SKY.main}>1</text>
        <text x={10} y={20} textAnchor="middle" fontSize={13} fontWeight={900} fill={PINK.main}>2</text>
      </g>
    </>
  ),
  Greetings: (_c, z) => (
    <g className={z ? undefined : "duo-wave"}>
      <Body
        d={[rr(20, 14, 10, 34, 5), rr(31, 8, 10, 36, 5), rr(42, 10, 10, 34, 5), rr(53, 18, 9, 30, 4.5), rr(18, 34, 46, 38, 16), rr(6, 42, 22, 12, 6)].join(" ")}
        tone={SKIN}
      />
      <Face x={41} y={52} s={0.9} asleep={z} />
    </g>
  ),
  Family: (c, z) => (
    <>
      <g className="duo-idle" style={{ animationDelay: "-.3s" }}>
        <Body d="M6 72 V44 a16 16 0 0 1 32 0 V72z" tone={c} />
        <Face x={22} y={44} s={0.75} asleep={z} />
      </g>
      <g className="duo-idle" style={{ animationDelay: "-.9s" }}>
        <Body d="M42 72 V40 a16 16 0 0 1 32 0 V72z" tone={SKY} />
        <Face x={58} y={40} s={0.75} asleep={z} />
      </g>
      <g className="duo-idle" style={{ animationDelay: "-1.5s" }}>
        <Body d="M28 74 V60 a12 12 0 0 1 24 0 V74z" tone={GOLD} />
        <Face x={40} y={60} s={0.55} asleep={z} />
      </g>
    </>
  ),
  Colors: (c, z) => (
    <>
      <ellipse cx={40} cy={72} rx={24} ry={5} fill={c.main} opacity={0.35} />
      <g className="duo-idle">
        <Body d="M40 6 C40 6 16 36 16 50 a24 24 0 0 0 48 0 C64 36 40 6 40 6z" tone={c} />
        <Face x={40} y={50} asleep={z} />
      </g>
      <g className="duo-float">
        <Body d="M10 14 c0 0 -6 8 -6 12 a6 6 0 0 0 12 0 c0 -4 -6 -12 -6 -12z" tone={SKY} />
        <Body d="M70 26 c0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c0 -3 -5 -10 -5 -10z" tone={PINK} />
      </g>
    </>
  ),
  Shapes: (c, z) => (
    <>
      <g className="duo-idle" style={{ animationDelay: "-.2s" }}>
        <Body d="M40 4 L58 34 H22z" tone={GOLD} />
        <Face x={40} y={25} s={0.5} asleep={z} />
      </g>
      <g className="duo-idle" style={{ animationDelay: "-.8s" }}>
        <Body d="M22 38 a16 16 0 1 1 0.01 0z M22 38" tone={c} />
        <Face x={22} y={54} s={0.65} asleep={z} />
      </g>
      <g className="duo-idle" style={{ animationDelay: "-1.4s" }}>
        <Body d={rr(42, 40, 32, 32, 7)} tone={SKY} />
        <Face x={58} y={55} s={0.65} asleep={z} />
      </g>
    </>
  ),
  Calendar: (c, z) => (
    <g className="duo-idle">
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
      <g className={z ? undefined : "duo-tilt"}>
        <Body d={`${rr(8, 18, 62, 44, 16)} M20 56 L16 74 L36 58z`} tone={c} />
        <Face x={39} y={38} asleep={z} />
      </g>
      <text className="duo-float" x={70} y={16} textAnchor="middle" fontSize={20} fontWeight={900} fill={GOLD.main}>?</text>
    </>
  ),
  "Word Concepts": (c, z) => (
    <>
      <g className="duo-idle">
        <rect x={20} y={14} width={44} height={56} rx={8} fill="#fff" stroke="#E5E5E5" strokeWidth={2} />
        <Body d={rr(14, 12, 44, 58, 9)} tone={c} />
        <rect x={14} y={12} width={8} height={58} rx={4} fill={c.dark} opacity={0.4} />
        <Face x={38} y={38} s={0.9} asleep={z} />
      </g>
      <g className="duo-float" style={{ animationDelay: "-1.2s" }}>
        <Body d={rr(50, 0, 28, 16, 8)} tone={GOLD} />
        <text x={64} y={11.5} textAnchor="middle" fontSize={9} fontWeight={900} fill="#fff">abc</text>
      </g>
    </>
  ),
};

const FALLBACK: Draw = (c, z) => (
  <g className="duo-idle">
    <Body d="M40 6 l9.5 19 21 3 -15 15 3.6 21 -19 -10 -19 10 3.6 -21 -15 -15 21 -3z" tone={c} />
    <Face x={40} y={40} s={0.8} asleep={z} />
  </g>
);

export function DuoCharacter({
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
      <g className={asleep ? "duo-asleep" : "duo-char"}>{draw(tone(color), asleep)}</g>
      {asleep && (
        <g fill="#AFAFAF" fontWeight={900}>
          <text className="duo-z" x={66} y={18} fontSize={12}>z</text>
          <text className="duo-z" x={72} y={8} fontSize={9} style={{ animationDelay: "-1s" }}>z</text>
        </g>
      )}
    </svg>
  );
}

export function DuoStyles() {
  return (
    <style>{`
      .duo-char, .duo-idle, .duo-sway, .duo-wave, .duo-tilt, .duo-float, .duo-blink, .duo-z { transform-box: fill-box }
      .duo-char, .duo-idle, .duo-sway, .duo-wave, .duo-tilt { transform-origin: 50% 100% }
      .duo-blink { transform-origin: center }
      .duo-happy, .duo-open { opacity: 0 }
      .group:hover .duo-eyes, .group:hover .duo-smile, .group:focus-visible .duo-eyes { opacity: 0 }
      .group:hover .duo-happy, .group:hover .duo-open, .group:focus-visible .duo-happy { opacity: 1 }
      .duo-asleep { filter: grayscale(1) opacity(.7) }

      @keyframes duo-blink { 0%,90%,100% { transform: scaleY(1) } 94% { transform: scaleY(.1) } }
      @keyframes duo-look { 0%,30%,100% { transform: translate(0,0) } 40%,60% { transform: translate(2px,-1px) } 70%,85% { transform: translate(-2px,0) } }
      @keyframes duo-breathe { 0%,100% { transform: scale(1,1) } 50% { transform: scale(1.03,.97) } }
      @keyframes duo-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
      @keyframes duo-sway { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
      @keyframes duo-wave { 0%,60%,100% { transform: rotate(0) } 10%,30% { transform: rotate(-12deg) } 20%,40% { transform: rotate(10deg) } }
      @keyframes duo-tilt { 0%,40%,100% { transform: rotate(0) } 50%,80% { transform: rotate(-8deg) } }
      @keyframes duo-hop { 0%,100% { transform: translateY(0) scale(1,1) } 20% { transform: translateY(0) scale(1.12,.88) } 50% { transform: translateY(-12px) scale(.94,1.06) } 75% { transform: translateY(0) scale(1.06,.94) } }
      @keyframes duo-z { 0% { transform: translate(0,0); opacity: 0 } 30% { opacity: 1 } 100% { transform: translate(6px,-12px); opacity: 0 } }

      @media (prefers-reduced-motion: no-preference) {
        .duo-blink { animation: duo-blink 4s infinite }
        .duo-look { animation: duo-look 6s ease-in-out infinite }
        .duo-idle { animation: duo-breathe 2.4s ease-in-out infinite }
        .duo-float { animation: duo-float 2s ease-in-out infinite }
        .duo-sway { animation: duo-sway 3s ease-in-out infinite }
        .duo-wave { animation: duo-wave 2.6s ease-in-out infinite }
        .duo-tilt { animation: duo-tilt 4s ease-in-out infinite }
        .duo-z { animation: duo-z 2s ease-out infinite }
        .group:hover .duo-char { animation: duo-hop .7s ease-in-out infinite }
      }
    `}</style>
  );
}
