/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: can the CURRENT home layout (banner, continue card, stat tiles,
 * 3 mode cards) feel alive and Duolingo-inspired just by redesigning its cards with animated SVG?
 *   alive-scenes  · mode cards show animated SVG scenes (page-flipping book, waving hand at a camera, self-ticking clipboard)
 *   alive-mascots · mode cards are characters (book / camera / clipboard buddies) that blink and bounce
 * Both share the livelier banner (sky, sun, clouds, waving hand), continue card (lesson world + progress
 * shimmer) and stat tiles (filling ring, self-drawing tick). All motion stops under reduced motion.
 */
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

import type { LearningArea } from "@/api/learning-api";
import type { MyProgress } from "@/api/progress-api";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { CATEGORIES } from "@/components/common/categories.constants";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import { cn } from "@/lib/utils";

export const ALIVE_VARIANTS = [
  { key: "alive-scenes", name: "Home · alive, animated scenes" },
  { key: "alive-mascots", name: "Home · alive, mode mascots" },
];
export const isAliveVariant = (v: string | null) => ALIVE_VARIANTS.some((item) => item.key === v);

type Props = { variant: string; name: string; avatarKey: string | null; areas: LearningArea[]; progress?: MyProgress };

const firstName = (name: string) => name.split(" ")[0] || "friend";

/* ── Banner: little sky scene with a waving hand ─────────── */
function Banner({ name, avatarKey }: { name: string; avatarKey: string | null }) {
  return (
    <section className="relative h-44 overflow-hidden rounded-3xl border-4 border-white shadow-[0_6px_0_#0000000f] sm:h-48" style={{ background: "linear-gradient(#BDE7FF, #FFF6E0)" }}>
      <svg aria-hidden="true" viewBox="0 0 400 180" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
        <g className="ha-spin" style={{ transformOrigin: "340px 40px" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={337} y={0} width={6} height={18} rx={3} fill="#FFC145" opacity={0.55} transform={`rotate(${i * 30} 340 40)`} />
          ))}
        </g>
        <circle cx={340} cy={40} r={20} fill="#FFC145" />
        <g className="ha-cloud" style={{ "--dur": "16s" } as CSSProperties}>
          <ellipse cx={60} cy={40} rx={28} ry={11} fill="#fff" /><ellipse cx={74} cy={32} rx={16} ry={11} fill="#fff" />
        </g>
        <g className="ha-cloud" style={{ "--dur": "22s", animationDelay: "-9s" } as CSSProperties}>
          <ellipse cx={180} cy={62} rx={22} ry={8} fill="#fff" opacity={0.85} />
        </g>
        <path d="M0 150 Q100 110 200 140 T400 130 V180 H0z" fill="#9BE15D" />
        <path d="M0 165 Q120 140 240 160 T400 155 V180 H0z" fill="#6CC644" />
        {/* Waving hand: the app's own subject */}
        <g className="ha-wave" style={{ transformOrigin: "330px 168px" }}>
          <path d="M318 168 V128 a6 6 0 0 1 12 0 V112 a6 6 0 0 1 12 0 V116 a6 6 0 0 1 12 0 V124 a6 6 0 0 1 12 0 V150 q0 18 -18 18z" fill="#FFC89E" stroke="#D9895A" strokeWidth={3} />
          <path d="M318 150 l-10 -14 a6 6 0 0 1 10 -7 l8 10" fill="#FFC89E" stroke="#D9895A" strokeWidth={3} strokeLinejoin="round" />
        </g>
        <g fill="#FFC145" className="ha-twinkle"><path d="M290 96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" /></g>
      </svg>
      <div className="relative flex h-full flex-col justify-center gap-1 px-5 sm:px-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-2xl shadow-[0_3px_0_#0000001a]">{getAvatarEmoji(avatarKey)}</span>
        <h1 className="max-w-[65%] text-2xl leading-tight font-black text-[#3C3C3C] sm:text-3xl">Hi, {firstName(name)}!</h1>
        <p className="max-w-[60%] text-base font-bold text-[#4B4B4B]">Let's learn Filipino Sign Language!</p>
      </div>
    </section>
  );
}

/* ── Continue card: the lesson's own world + shimmering progress ── */
function ContinueCard({ areas }: { areas: LearningArea[] }) {
  const navigate = useNavigate();
  const current = areas.flatMap((a) => a.categories).find((c) => c.learningStatus === "current");
  if (!current) {
    return (
      <section className="flex items-center gap-4 rounded-3xl border-4 border-[#B7F07A] bg-[#F1FFE2] p-5">
        <svg aria-hidden="true" viewBox="0 0 64 64" className="size-16 shrink-0">
          <path d="M18 8 h28 v12 a14 14 0 0 1 -28 0z" fill="#FFC145" /><rect x={28} y={34} width={8} height={12} fill="#FFC145" /><rect x={20} y={46} width={24} height={8} rx={3} fill="#C98A00" />
          <rect className="ha-shine" x={14} y={6} width={6} height={30} fill="#fff" opacity={0.6} transform="rotate(20 17 21)" />
        </svg>
        <div>
          <p className="text-xl font-black text-[#2F6B00]">All caught up!</p>
          <p className="text-base font-semibold text-[#3F7A1A]">You finished every lesson. Review any time.</p>
        </div>
      </section>
    );
  }
  const color = CATEGORIES.find((c) => c.title === current.name)?.color ?? "blue";
  const started = current.progressPercent > 0;
  return (
    <button
      type="button"
      onClick={() => navigate(`/student/learn/${current.id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border-4 border-white bg-white text-left shadow-[0_6px_0_#E5E5E5] transition-transform focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-1 sm:flex-row"
    >
      <LessonStage title={current.name} color={color} className="h-36 shrink-0 sm:h-auto sm:w-56" />
      <div className="flex flex-1 flex-col justify-center gap-2 p-5">
        <p className="text-sm font-extrabold tracking-widest text-[#B87800] uppercase">Continue learning</p>
        <h2 className="text-2xl font-black text-[#3C3C3C]">{current.name}</h2>
        <div className="relative h-4 overflow-hidden rounded-full bg-[#E5E5E5]">
          <div className="relative h-full overflow-hidden rounded-full bg-hudyat-gold" style={{ width: `${Math.max(current.progressPercent, 4)}%` }}>
            <span className="ha-shimmer absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
        <p className="text-sm font-bold text-[#6B6B6B]">{started ? `${current.progressPercent}% done` : "Let's get started!"}</p>
        <span className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-hudyat-gold font-black text-[#3C3C3C] shadow-[0_4px_0_#B87800] group-active:translate-y-1 group-active:shadow-none sm:w-fit sm:px-6">
          {started ? "CONTINUE" : "START"} <ArrowRight className="ha-nudge size-5" />
        </span>
      </div>
    </button>
  );
}

/* ── Stat tiles: filling ring + self-drawing tick ───────── */
function Stats({ progress }: { progress?: MyProgress }) {
  if (!progress) return null;
  const { completedCategories, totalCategories, assessmentAttempts } = progress.summary;
  const ratio = totalCategories ? completedCategories / totalCategories : 0;
  const C = 2 * Math.PI * 22;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <article className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_4px_0_#E5E5E5] sm:p-5">
        <svg aria-hidden="true" viewBox="0 0 56 56" className="size-14 shrink-0 -rotate-90">
          <circle cx={28} cy={28} r={22} fill="none" stroke="#FFF1C9" strokeWidth={8} />
          <circle cx={28} cy={28} r={22} fill="none" stroke="#FFC145" strokeWidth={8} strokeLinecap="round" strokeDasharray={C} className="ha-ring" style={{ "--to": `${C * (1 - ratio)}`, "--from": `${C}` } as CSSProperties} />
          <path className="ha-pop" d="M28 18 l3 6.5 7 1 -5 5 1.2 7 -6.2 -3.3 -6.2 3.3 1.2 -7 -5 -5 7 -1z" fill="#FFC145" transform="rotate(90 28 28)" />
        </svg>
        <div className="min-w-0">
          <p className="text-2xl font-black text-[#3C3C3C] sm:text-3xl">{completedCategories}/{totalCategories}</p>
          <p className="text-sm font-bold text-[#6B6B6B]">Lessons done</p>
        </div>
      </article>
      <article className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_4px_0_#E5E5E5] sm:p-5">
        <svg aria-hidden="true" viewBox="0 0 56 56" className="size-14 shrink-0">
          <rect x={12} y={8} width={32} height={42} rx={6} fill="#D1FAE5" stroke="#10B981" strokeWidth={3} />
          <rect x={21} y={4} width={14} height={8} rx={3} fill="#10B981" />
          <path className="ha-draw" d="M19 30 l6 6 12 -13" fill="none" stroke="#059669" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0">
          <p className="text-2xl font-black text-[#3C3C3C] sm:text-3xl">{assessmentAttempts}</p>
          <p className="text-sm font-bold text-[#6B6B6B]">Quizzes taken</p>
        </div>
      </article>
    </div>
  );
}

/* ── Mode art, version A: animated scenes ───────────────── */
const SCENES: Record<string, ReactNode> = {
  learn: (
    <svg aria-hidden="true" viewBox="0 0 120 90" className="h-28 w-36">
      <g className="ha-float-up" fill="#fff" fontWeight={900} fontFamily="Nunito, sans-serif">
        <text x={20} y={30} fontSize={14}>A</text>
        <text x={92} y={22} fontSize={12} style={{ animationDelay: "-1s" }}>b</text>
      </g>
      <path d="M60 30 C45 22 25 22 12 28 V78 C25 72 45 72 60 80z" fill="#fff" />
      <path d="M60 30 C75 22 95 22 108 28 V78 C95 72 75 72 60 80z" fill="#E0F2FE" />
      {/* the turning page */}
      <path className="ha-page" d="M60 30 C75 22 95 22 108 28 V78 C95 72 75 72 60 80z" fill="#fff" stroke="#BAE6FD" strokeWidth={1.5} />
      <g stroke="#7DD3FC" strokeWidth={3} strokeLinecap="round"><path d="M22 40 h28 M22 50 h24 M22 60 h28" /></g>
    </svg>
  ),
  practice: (
    <svg aria-hidden="true" viewBox="0 0 120 90" className="h-28 w-36">
      <rect x={10} y={26} width={66} height={46} rx={10} fill="#fff" />
      <rect x={28} y={18} width={24} height={12} rx={4} fill="#fff" />
      <circle cx={43} cy={49} r={15} fill="#FDE68A" stroke="#B45309" strokeWidth={4} />
      <circle cx={43} cy={49} r={6} fill="#B45309" className="ha-lens" />
      <circle cx={66} cy={34} r={4} fill="#FF4B4B" className="ha-blink" />
      <g className="ha-wave" style={{ transformOrigin: "95px 86px" }}>
        <path d="M84 86 V56 a5 5 0 0 1 10 0 V44 a5 5 0 0 1 10 0 V48 a5 5 0 0 1 10 0 V70 q0 16 -16 16z" fill="#FFC89E" stroke="#D9895A" strokeWidth={2.5} />
      </g>
    </svg>
  ),
  quiz: (
    <svg aria-hidden="true" viewBox="0 0 120 90" className="h-28 w-36">
      <rect x={30} y={10} width={60} height={76} rx={8} fill="#fff" />
      <rect x={48} y={5} width={24} height={10} rx={4} fill="#EDE9FE" stroke="#7C3AED" strokeWidth={2} />
      {[30, 48, 66].map((y, i) => (
        <g key={y}>
          <rect x={40} y={y - 6} width={12} height={12} rx={3} fill="#EDE9FE" />
          <path className="ha-tick" d={`M42 ${y} l3 3 6 -7`} fill="none" stroke="#7C3AED" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${i * 0.6}s` }} />
          <rect x={58} y={y - 2} width={24} height={4} rx={2} fill="#DDD6FE" />
        </g>
      ))}
      <g className="ha-scribble" style={{ transformOrigin: "100px 80px" }}>
        <path d="M96 30 l10 -4 4 10 -26 50 -8 2 0 -8z" fill="#FFC145" stroke="#B45309" strokeWidth={2} strokeLinejoin="round" />
      </g>
    </svg>
  ),
};

/* ── Mode art, version B: mascots with faces ────────────── */
function Eyes({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ha-eyes">
        <ellipse cx={-9} cy={0} rx={6} ry={7.5} fill="#fff" /><ellipse cx={9} cy={0} rx={6} ry={7.5} fill="#fff" />
        <circle cx={-8} cy={1.5} r={3.5} fill="#3C3C3C" /><circle cx={10} cy={1.5} r={3.5} fill="#3C3C3C" />
      </g>
      <path className="ha-grin" d="M-6 13 q6 6 12 0" fill="none" stroke="#3C3C3C" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}
const MASCOTS: Record<string, ReactNode> = {
  learn: (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="ha-bounce size-32 overflow-visible">
      <path d="M50 22 C36 14 18 14 8 20 V80 C18 74 36 74 50 82z" fill="#fff" />
      <path d="M50 22 C64 14 82 14 92 20 V80 C82 74 64 74 50 82z" fill="#E0F2FE" />
      <Eyes x={50} y={46} />
      <path className="ha-wave" style={{ transformOrigin: "92px 60px" }} d="M92 60 l10 -14" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    </svg>
  ),
  practice: (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="ha-bounce size-32 overflow-visible" style={{ animationDelay: "-.3s" }}>
      <rect x={10} y={26} width={80} height={60} rx={14} fill="#fff" />
      <rect x={34} y={16} width={30} height={14} rx={5} fill="#fff" />
      <circle cx={50} cy={56} r={20} fill="#FDE68A" stroke="#B45309" strokeWidth={4} />
      <Eyes x={50} y={52} />
      <circle cx={80} cy={36} r={5} fill="#FF4B4B" className="ha-blink" />
    </svg>
  ),
  quiz: (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="ha-bounce size-32 overflow-visible" style={{ animationDelay: "-.6s" }}>
      <rect x={18} y={12} width={64} height={80} rx={10} fill="#fff" />
      <rect x={36} y={6} width={28} height={12} rx={4} fill="#DDD6FE" />
      <Eyes x={50} y={44} />
      <path className="ha-tick" d="M34 72 l7 7 14 -15" fill="none" stroke="#7C3AED" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const MODES = [
  { key: "learn", title: "Learn FSL", path: "/student/learn", bg: "bg-hudyat-blue", edge: "#004d85" },
  { key: "practice", title: "Practice", path: "/student/practice", bg: "bg-hudyat-gold", edge: "#b8860b" },
  { key: "quiz", title: "Assessment", path: "/student/assessment", bg: "bg-violet-400", edge: "#7c5cbf" },
];

function ModeCards({ art }: { art: Record<string, ReactNode> }) {
  const navigate = useNavigate();
  return (
    <section>
      <h2 className="text-xl font-black text-[#3C3C3C]">What do you want to do?</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => navigate(mode.path)}
            className={cn(
              "group relative flex items-center gap-4 overflow-hidden rounded-3xl px-5 py-4 text-left transition-transform duration-150 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-1 sm:flex-col sm:py-6 sm:text-center",
              mode.bg,
            )}
            style={{ boxShadow: `0 6px 0 ${mode.edge}` }}
          >
            {/* soft circle behind the art */}
            <span aria-hidden="true" className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15" />
            <div className="relative shrink-0">{art[mode.key]}</div>
            <h3 className="relative text-2xl font-black text-white [text-shadow:0_2px_0_#0003]">{mode.title}</h3>
          </button>
        ))}
      </div>
    </section>
  );
}

export function AliveHome({ variant, name, avatarKey, areas, progress }: Props) {
  return (
    <div className="space-y-6 font-body sm:space-y-8">
      <Banner name={name} avatarKey={avatarKey} />
      <ContinueCard areas={areas} />
      <Stats progress={progress} />
      <ModeCards art={variant === "alive-mascots" ? MASCOTS : SCENES} />
      <style>{`
        .ha-spin, .ha-cloud, .ha-wave, .ha-float-up text, .ha-page, .ha-lens, .ha-scribble, .ha-bounce, .ha-eyes { transform-box: fill-box }
        .ha-page { transform-origin: left center }
        .ha-lens, .ha-eyes { transform-origin: center }
        .ha-grin { opacity: .9 }
        .ha-ring { stroke-dashoffset: var(--to) }
        @keyframes ha-spin { to { transform: rotate(360deg) } }
        @keyframes ha-cloud { from { transform: translateX(-120px) } to { transform: translateX(420px) } }
        @keyframes ha-wave { 0%,60%,100% { transform: rotate(0) } 10%,30% { transform: rotate(-14deg) } 20%,40% { transform: rotate(12deg) } }
        @keyframes ha-twinkle { 0%,100% { opacity: .3; transform: scale(.7) } 50% { opacity: 1; transform: scale(1.1) } }
        @keyframes ha-shimmer { to { transform: translateX(300%) } }
        @keyframes ha-nudge { 0%,100% { transform: translateX(0) } 50% { transform: translateX(5px) } }
        @keyframes ha-shine { 0%,70% { transform: translateX(-20px) rotate(20deg); opacity: 0 } 80% { opacity: .7 } 100% { transform: translateX(40px) rotate(20deg); opacity: 0 } }
        @keyframes ha-ring { from { stroke-dashoffset: var(--from) } to { stroke-dashoffset: var(--to) } }
        @keyframes ha-pop { 0%,100% { transform: rotate(90deg) scale(1) } 50% { transform: rotate(90deg) scale(1.2) } }
        @keyframes ha-draw { 0% { stroke-dashoffset: 40 } 40%,100% { stroke-dashoffset: 0 } }
        @keyframes ha-float-up { 0% { transform: translateY(10px); opacity: 0 } 30%,70% { opacity: 1 } 100% { transform: translateY(-14px); opacity: 0 } }
        @keyframes ha-page { 0%,30% { transform: scaleX(1) } 55% { transform: scaleX(-1) } 80%,100% { transform: scaleX(1) } }
        @keyframes ha-lens { 0%,100% { transform: scale(1) } 50% { transform: scale(1.25) } }
        @keyframes ha-blink { 0%,45% { opacity: 1 } 50%,95% { opacity: .15 } }
        @keyframes ha-tick { 0% { stroke-dashoffset: 30 } 25%,85% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: 30 } }
        @keyframes ha-scribble { 0%,100% { transform: rotate(0) translate(0,0) } 25% { transform: rotate(-6deg) translate(-3px,2px) } 75% { transform: rotate(5deg) translate(2px,-2px) } }
        @keyframes ha-bounce { 0%,100% { transform: translateY(0) scale(1,1) } 45% { transform: translateY(-6px) scale(.97,1.03) } 60% { transform: translateY(0) scale(1.04,.96) } }
        @keyframes ha-eyes { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
        .ha-draw, .ha-tick { stroke-dasharray: 40 }
        @media (prefers-reduced-motion: no-preference) {
          .ha-spin { animation: ha-spin 24s linear infinite }
          .ha-cloud { animation: ha-cloud var(--dur) linear infinite }
          .ha-wave { animation: ha-wave 2.4s ease-in-out infinite }
          .ha-twinkle { animation: ha-twinkle 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center }
          .ha-shimmer { animation: ha-shimmer 2.2s ease-in-out infinite }
          .ha-nudge { animation: ha-nudge 1.2s ease-in-out infinite }
          .ha-shine { animation: ha-shine 3s ease-in-out infinite }
          .ha-ring { animation: ha-ring 1.4s cubic-bezier(.2,.8,.3,1) both }
          .ha-pop { animation: ha-pop 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center }
          .ha-draw { animation: ha-draw 2.6s ease-out infinite }
          .ha-float-up text { animation: ha-float-up 3s ease-in-out infinite }
          .ha-page { animation: ha-page 3.2s ease-in-out infinite }
          .ha-lens { animation: ha-lens 2s ease-in-out infinite }
          .ha-blink { animation: ha-blink 1.2s steps(1) infinite }
          .ha-tick { animation: ha-tick 3s ease-out infinite }
          .ha-scribble { animation: ha-scribble 1s ease-in-out infinite }
          .ha-bounce { animation: ha-bounce 2.2s ease-in-out infinite }
          .ha-eyes { animation: ha-eyes 4s infinite }
          .group:hover .ha-bounce { animation-duration: .7s }
          .group:hover .ha-wave { animation-duration: 1s }
        }
      `}</style>
    </div>
  );
}
