/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE — throwaway. Question: how should the duo-card's background
 * and hover feel? Sky won round 1; night/sea/meadow are its siblings.
 * Same card body as `duo-card`; only the stage behind
 * the character and the hover choreography differ.
 *   duo-card-spot    · spotlight stage, confetti burst on hover
 *   duo-card-sky     · little sky scene (sun, clouds, hills), 3D tilt on hover
 *   duo-card-pattern · scrolling doodle pattern + morphing blob, sparkles on hover
 * Shared hover: card lifts onto a category-coloured edge, ground shadow
 * squashes in time with the hop, button shine sweeps across.
 */
import { cn } from "@/lib/utils";
import type { CategoryStatus } from "@/components/common/category-card";
import { DuoCharacter, PALETTE } from "./duo-characters";
import type { LearnCardProps } from "./learn-card-variants";

type Pal = (typeof PALETTE)[keyof typeof PALETTE];
type Stage = "spot" | "sky" | "pattern" | "night" | "sea" | "meadow";
const SCENES: Stage[] = ["sky", "night", "sea", "meadow"];

const LOCKED: Pal = { main: "#D7D7D7", light: "#F2F2F2", dark: "#AFAFAF" };
const CONFETTI = ["#FF4B4B", "#FFC145", "#1CB0F6", "#58CC02", "#CE82FF", "#FF86D0", "#FF9600", "#1CB0F6"];

const actionLabel = (status: CategoryStatus, progress: number) =>
  status === "locked" ? "Locked" : status === "completed" ? "Review" : progress > 0 ? "Continue" : "Start";

function SpotStage({ p }: { p: Pal }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 50% 0%, #fff 0%, ${p.light} 55%, ${p.main}55 100%)` }} />
      {/* Spotlight cone fades in on hover */}
      <span
        className="absolute inset-x-0 top-0 h-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(#ffffffcc, #ffffff00 85%)", clipPath: "polygon(38% 0, 62% 0, 85% 100%, 15% 100%)" }}
      />
      <span className="absolute inset-x-6 bottom-2 h-6 rounded-[50%]" style={{ background: `${p.main}66` }} />
      {CONFETTI.map((c, i) => {
        const a = (i / CONFETTI.length) * Math.PI * 2;
        return (
          <span
            key={i}
            className="dcs-confetti absolute left-1/2 top-1/2 size-2.5 rounded-[3px] opacity-0"
            style={{ background: c, "--x": `${Math.cos(a) * 90}px`, "--y": `${Math.sin(a) * 60 - 20}px`, "--r": `${i * 70}deg` } as React.CSSProperties}
          />
        );
      })}
    </>
  );
}

function SkyStage({ p }: { p: Pal }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: `linear-gradient(${p.light}, #fff)` }} />
      <span
        className="dcs-sun absolute -right-6 -top-6 size-28 rounded-full opacity-60"
        style={{ background: `repeating-conic-gradient(#FFC14555 0 12deg, transparent 12deg 24deg)` }}
      />
      <span className="absolute right-5 top-5 size-9 rounded-full bg-[#FFC145] shadow-[0_0_0_6px_#FFC14533]" />
      <span className="dcs-cloud absolute left-2 top-6 h-5 w-14 rounded-full bg-white shadow-[10px_-6px_0_-2px_#fff]" />
      <span className="dcs-cloud absolute left-24 top-14 h-4 w-10 rounded-full bg-white/90 shadow-[8px_-5px_0_-2px_#ffffffe6] [animation-delay:-4s]" />
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full">
        <path d="M0 22 Q50 2 100 18 T200 14 V40 H0z" fill={p.main} opacity={0.45} />
        <path d="M0 30 Q60 14 120 28 T200 26 V40 H0z" fill={p.main} />
      </svg>
    </>
  );
}

function PatternStage({ p }: { p: Pal }) {
  return (
    <>
      <span
        className="dcs-pattern absolute inset-0"
        style={{
          backgroundColor: p.light,
          backgroundImage: `radial-gradient(${p.main}66 2.5px, transparent 3px), radial-gradient(${p.main}33 2.5px, transparent 3px)`,
          backgroundSize: "28px 28px",
          backgroundPosition: "0 0, 14px 14px",
        }}
      />
      <span
        className="dcs-blob absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-[42%] transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]"
        style={{ background: p.main, opacity: 0.35 }}
      />
      {[
        "left-[18%] top-[22%]",
        "right-[18%] top-[16%]",
        "left-[24%] bottom-[18%]",
        "right-[22%] bottom-[26%]",
      ].map((pos, i) => (
        <span
          key={pos}
          className={cn("dcs-sparkle absolute text-lg leading-none text-[#FFC145] opacity-0", pos)}
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          ✦
        </span>
      ))}
    </>
  );
}

const Hills = ({ back, front }: { back: string; front: string }) => (
  <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full">
    <path d="M0 22 Q50 2 100 18 T200 14 V40 H0z" fill={back} />
    <path d="M0 30 Q60 14 120 28 T200 26 V40 H0z" fill={front} />
  </svg>
);

const STARS = [
  [8, 14], [22, 34], [34, 10], [48, 26], [58, 8], [70, 38], [14, 52], [86, 22], [42, 46], [78, 54],
];

function NightStage({ p }: { p: Pal }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: "linear-gradient(#1B2559, #3E4C94 75%)" }} />
      {STARS.map(([x, y], i) => (
        <span
          key={i}
          className="dcs-twinkle absolute size-1.5 rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 0.37}s` }}
        />
      ))}
      <span className="absolute right-6 top-4 size-10 rounded-full" style={{ boxShadow: "-9px 7px 0 0 #FFE58A" }} />
      <span className="dcs-shoot absolute left-0 top-4 h-0.5 w-16 rounded-full bg-gradient-to-l from-white to-transparent opacity-0" />
      <Hills back={`${p.main}88`} front={p.dark} />
    </>
  );
}

const WAVE = "M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V30 H0z";

function SeaStage({ p }: { p: Pal }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: `linear-gradient(${p.light}, #DDF4FF 80%)` }} />
      <span className="absolute bottom-8 left-8 size-14 rounded-full bg-[#FFC145] shadow-[0_0_0_8px_#FFC14533]" />
      <span className="dcs-cloud absolute left-2 top-5 h-4 w-12 rounded-full bg-white shadow-[9px_-5px_0_-2px_#fff]" />
      {[
        { c: "#1CB0F655", d: "9s", b: "bottom-6" },
        { c: "#1CB0F699", d: "6s", b: "bottom-3" },
        { c: "#1CB0F6", d: "4s", b: "-bottom-1" },
      ].map((w) => (
        <svg key={w.d} viewBox="0 0 400 30" preserveAspectRatio="none" className={cn("dcs-wave absolute left-0 h-8 w-[200%]", w.b)} style={{ animationDuration: w.d }}>
          <path d={WAVE} fill={w.c} />
        </svg>
      ))}
      {[30, 46, 62, 72].map((x, i) => (
        <span
          key={x}
          className="dcs-bubble absolute bottom-4 size-2.5 rounded-full border-2 border-white/80 opacity-0"
          style={{ left: `${x}%`, animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </>
  );
}

const FLOWERS = [
  { x: 8, c: "#FF86D0", s: "text-2xl" },
  { x: 20, c: "#FFC145", s: "text-xl" },
  { x: 74, c: "#CE82FF", s: "text-2xl" },
  { x: 86, c: "#FF86D0", s: "text-xl" },
  { x: 64, c: "#FFFFFF", s: "text-lg" },
];

function MeadowStage({ p }: { p: Pal }) {
  return (
    <>
      <span className="absolute inset-0" style={{ background: `linear-gradient(#DDF4FF, ${p.light} 90%)` }} />
      <span className="dcs-cloud absolute left-4 top-4 h-5 w-14 rounded-full bg-white shadow-[10px_-6px_0_-2px_#fff]" />
      <Hills back="#89E219" front="#58CC02" />
      {FLOWERS.map((f, i) => (
        <span
          key={f.x}
          className="dcs-flower absolute bottom-3 flex flex-col items-center"
          style={{ left: `${f.x}%`, animationDelay: `${-i * 0.5}s` }}
        >
          <span className={cn("dcs-bloom leading-none [text-shadow:0_1px_0_#0002]", f.s)} style={{ color: f.c }}>✿</span>
          <span className="h-4 w-0.5 rounded-full bg-[#3F8F00]" />
        </span>
      ))}
      <span className="dcs-fly absolute left-[22%] top-[18%]">
        <svg viewBox="0 0 20 14" className="dcs-flap h-3.5 w-5">
          <ellipse cx={5} cy={6} rx={5} ry={5.5} fill={p.main} />
          <ellipse cx={15} cy={6} rx={5} ry={5.5} fill={p.main} />
          <rect x={9} y={2} width={2} height={11} rx={1} fill="#4B4B4B" />
        </svg>
      </span>
    </>
  );
}

const STAGES = { spot: SpotStage, sky: SkyStage, pattern: PatternStage, night: NightStage, sea: SeaStage, meadow: MeadowStage };

function StageCard({ stage, title, color, progress, status, statusText, onClick }: LearnCardProps & { stage: Stage }) {
  const locked = status === "locked";
  const p = locked ? LOCKED : PALETTE[color];
  const StageBg = STAGES[stage];
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      style={{ "--edge": locked ? "#E5E5E5" : p.main, "--btn": p.dark } as React.CSSProperties}
      className={cn(
        "dcs-card group flex w-full flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white text-center",
        "shadow-[0_6px_0_#E5E5E5] transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
        "hover:-translate-y-1.5 hover:border-[var(--edge)] hover:shadow-[0_10px_0_var(--edge)]",
        "active:translate-y-0.5 active:shadow-[0_2px_0_var(--edge)] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hudyat-gold",
        SCENES.includes(stage) && "dcs-tilt",
        locked && "cursor-not-allowed hover:translate-y-0 hover:border-[#E5E5E5] hover:shadow-[0_6px_0_#E5E5E5]",
      )}
    >
      <div className={cn("relative flex h-44 items-end justify-center overflow-hidden", locked && "grayscale")}>
        {!locked ? <StageBg p={p} /> : <span className="absolute inset-0" style={{ background: LOCKED.light }} />}
        <span className="dcs-shadow absolute bottom-3 h-3 w-20 rounded-[50%] bg-black/20" />
        <DuoCharacter title={title} color={color} asleep={locked} className="relative mb-4 size-28" />
      </div>

      <div className="flex flex-col items-center px-5 pb-5 pt-3">
        <h3 className={cn("text-xl font-extrabold", locked ? "text-[#AFAFAF]" : "text-[#4B4B4B]")}>{title}</h3>
        <p className="text-sm font-bold text-[#AFAFAF]">{statusText}</p>
        <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
          <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: p.main }}>
            <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>
        <span
          className={cn(
            "relative mt-5 w-full overflow-hidden rounded-2xl py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-[0_4px_0_var(--btn)] transition-all duration-100",
            "group-active:translate-y-1 group-active:shadow-none",
            locked && "text-[#8A8A8A] group-active:translate-y-0 group-active:shadow-[0_4px_0_var(--btn)]",
          )}
          style={{ background: p.main }}
        >
          {!locked && <span className="dcs-shine absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40" />}
          <span className="relative">{actionLabel(status, progress)}</span>
        </span>
      </div>
    </button>
  );
}

export function StageCardStyles() {
  return (
    <style>{`
      .dcs-card.dcs-tilt { transform-style: preserve-3d }
      .dcs-shadow { transition: transform .3s }
      .group:hover .dcs-shine { transform: translateX(450%); transition: transform .7s ease-out }
      .dcs-shine { transform: translateX(0) }
      .group:hover .dcs-blob { transform: translate(-50%, -42%) scale(1.25) rotate(25deg) }

      @keyframes dcs-burst { 0% { transform: translate(-50%,-50%) scale(.3); opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--r)) scale(1); opacity: 0 } }
      @keyframes dcs-shadow { 0%,100% { transform: scaleX(1) } 20% { transform: scaleX(1.15) } 50% { transform: scaleX(.6); opacity: .5 } 75% { transform: scaleX(1.08) } }
      @keyframes dcs-spin { to { transform: rotate(360deg) } }
      @keyframes dcs-cloud { 0% { transform: translateX(-20px) } 100% { transform: translateX(260px) } }
      @keyframes dcs-scroll { to { background-position: 28px 28px, 42px 42px } }
      @keyframes dcs-blob { 0%,100% { border-radius: 42% 58% 60% 40% / 45% 45% 55% 55% } 50% { border-radius: 60% 40% 38% 62% / 58% 42% 58% 42% } }
      @keyframes dcs-sparkle { 0% { opacity: 0; transform: scale(0) rotate(0) } 40% { opacity: 1; transform: scale(1.3) rotate(90deg) } 100% { opacity: 0; transform: scale(.6) rotate(180deg) } }
      @keyframes dcs-tilt { 0%,100% { transform: perspective(700px) rotateX(0) rotateY(0) } 50% { transform: perspective(700px) rotateX(4deg) rotateY(-4deg) } }

      @keyframes dcs-twinkle { 0%,100% { opacity: .25; transform: scale(.7) } 50% { opacity: 1; transform: scale(1.2) } }
      @keyframes dcs-shoot { 0% { transform: translate(-40px,0) rotate(18deg); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(320px,100px) rotate(18deg); opacity: 0 } }
      @keyframes dcs-wave { to { transform: translateX(-50%) } }
      @keyframes dcs-bubble { 0% { transform: translateY(0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(-90px) scale(1.1); opacity: 0 } }
      @keyframes dcs-sway { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
      @keyframes dcs-fly { 0%,100% { transform: translate(0,0) } 25% { transform: translate(30px,-8px) } 50% { transform: translate(60px,6px) } 75% { transform: translate(25px,12px) } }
      @keyframes dcs-flap { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(.3) } }

      .dcs-flower { transform-origin: 50% 100% }
      .dcs-bloom { display: inline-block; transition: transform .4s cubic-bezier(.34,1.56,.64,1) }
      .group:hover .dcs-bloom { transform: scale(1.5) rotate(20deg) }
      .dcs-blob { animation: dcs-blob 5s ease-in-out infinite }
      @media (prefers-reduced-motion: no-preference) {
        .group:hover .dcs-confetti { animation: dcs-burst .8s cubic-bezier(.2,.8,.3,1) both }
        .group:hover .dcs-shadow { animation: dcs-shadow .7s ease-in-out infinite }
        .dcs-sun { animation: dcs-spin 30s linear infinite }
        .group:hover .dcs-sun { animation-duration: 6s }
        .dcs-cloud { animation: dcs-cloud 14s linear infinite }
        .group:hover .dcs-pattern { animation: dcs-scroll 1.2s linear infinite }
        .group:hover .dcs-sparkle { animation: dcs-sparkle 1.1s ease-out infinite }
        .dcs-twinkle { animation: dcs-twinkle 2.2s ease-in-out infinite }
        .group:hover .dcs-twinkle { animation-duration: .8s }
        .group:hover .dcs-shoot { animation: dcs-shoot 1.1s ease-in .1s infinite }
        .dcs-wave { animation: dcs-wave 6s linear infinite }
        .group:hover .dcs-bubble { animation: dcs-bubble 1.6s ease-out infinite }
        .dcs-flower { animation: dcs-sway 3s ease-in-out infinite }
        .dcs-fly { animation: dcs-fly 6s ease-in-out infinite }
        .group:hover .dcs-fly { animation-duration: 2.5s }
        .dcs-flap { animation: dcs-flap .25s ease-in-out infinite; transform-origin: center }
        .group.dcs-tilt:not(:disabled):hover { animation: dcs-tilt 2.4s ease-in-out infinite }
      }
    `}</style>
  );
}

export const STAGE_VARIANTS = [
  { key: "duo-card-spot", name: "Duo card · Spotlight + confetti" },
  { key: "duo-card-sky", name: "Duo card · Sky scene + tilt" },
  { key: "duo-card-pattern", name: "Duo card · Pattern + sparkles" },
  { key: "duo-card-night", name: "Duo card · Night sky + shooting star" },
  { key: "duo-card-sea", name: "Duo card · Ocean waves + bubbles" },
  { key: "duo-card-meadow", name: "Duo card · Meadow + butterfly" },
];

const grid = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
export const STAGE_CARDS: Record<string, { Card: (props: LearnCardProps) => React.ReactNode; grid: string }> = {
  "duo-card-spot": { Card: (props) => <StageCard {...props} stage="spot" />, grid },
  "duo-card-sky": { Card: (props) => <StageCard {...props} stage="sky" />, grid },
  "duo-card-pattern": { Card: (props) => <StageCard {...props} stage="pattern" />, grid },
  "duo-card-night": { Card: (props) => <StageCard {...props} stage="night" />, grid },
  "duo-card-sea": { Card: (props) => <StageCard {...props} stage="sea" />, grid },
  "duo-card-meadow": { Card: (props) => <StageCard {...props} stage="meadow" />, grid },
};
