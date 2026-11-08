/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: how little can the student home show and still feel friendly and
 * lively to a deaf elementary child? Three structures on /student/home, via ?variant= (dev only), real data:
 *   kid-stage   · game title screen: one huge character, one PLAY button, nothing else to read
 *   kid-town    · no cards: three living buildings ARE the navigation, finished lessons walk around town
 *   kid-friends · one lesson at a time: swipe between friends, the whole screen changes colour
 * All motion is visual only (no sound) and stops under reduced motion. Characters react when tapped.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Lock, Play, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { LearningArea } from "@/api/learning-api";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { CATEGORIES, type CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter, PALETTE } from "@/components/common/learn-card/characters";
import { WorldStage } from "@/components/common/learn-card/worlds";
import "@/components/common/learn-card/learn-card.css";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { cn } from "@/lib/utils";

export const KID_VARIANTS = [
  { key: "kid-stage", name: "Kid · One big PLAY" },
  { key: "kid-town", name: "Kid · Sign Town" },
  { key: "kid-friends", name: "Kid · One friend at a time" },
];
export const isKidVariant = (v: string | null) => KID_VARIANTS.some((item) => item.key === v);

type Lesson = LearningArea["categories"][number];
type KidData = { name: string; avatarKey: string | null; all: Lesson[]; current?: Lesson; quizzesReady: number };

const colorOf = (title: string): CategoryColor => CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
const firstName = (name: string) => name.split(" ")[0] || "friend";
const lessonPath = (lesson?: Lesson) => (lesson ? `/student/learn/${lesson.id}` : "/student/learn");
const focusRing = "focus-visible:ring-4 focus-visible:ring-hudyat-blue focus-visible:ring-offset-2 focus-visible:outline-none";

/* A character that hops and bursts stars when tapped; `onSelect` replaces that for carousel neighbours. */
function Friend({ lesson, asleep = false, label, className, onSelect }: { lesson: Lesson; asleep?: boolean; label: string; className: string; onSelect?: () => void }) {
  const [taps, setTaps] = useState(0);
  return (
    <button type="button" aria-label={label} onClick={() => (onSelect ? onSelect() : setTaps((n) => n + 1))} className={cn("group relative block rounded-full", focusRing)}>
      <span key={taps} className={cn("block", taps > 0 && "kp-hop")}>
        <LessonCharacter title={lesson.name} color={colorOf(lesson.name)} asleep={asleep} className={className} />
      </span>
      {taps > 0 && (
        <span key={`stars-${taps}`} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <Star key={angle} className="kp-spark absolute -m-4 size-8 fill-hudyat-gold text-hudyat-gold" style={{ "--a": `${angle}deg` } as CSSProperties} />
          ))}
        </span>
      )}
    </button>
  );
}

/* ── kid-stage · game title screen ─────────────────────── */
function StageHome({ name, avatarKey, all, current, quizzesReady }: KidData) {
  const navigate = useNavigate();
  const star = current ?? all[all.length - 1];
  const side = [
    { label: "Practice", image: "/icons/practice.png", path: "/student/practice", badge: 0 },
    { label: "Quiz", image: "/icons/assessment.png", path: "/student/assessment", badge: quizzesReady },
  ];
  return (
    <section className="relative flex h-[min(74dvh,660px)] min-h-[500px] flex-col overflow-hidden rounded-[2.5rem] border-4 border-white shadow-[0_8px_0_#0000001a]">
      <WorldStage title={star.name} p={PALETTE[colorOf(star.name)]} locked={false} />

      <header className="relative flex items-start justify-between p-3 sm:p-5">
        <h1 className="flex items-center gap-2 rounded-full bg-white/95 py-1 pr-5 pl-1 text-xl font-black text-[#3C3C3C] sm:text-2xl">
          <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-hudyat-gold/30 text-2xl">{getAvatarEmoji(avatarKey)}</span>
          Hi, {firstName(name)}!
        </h1>
        <div className="flex gap-2">
          {side.map((item) => (
            <button key={item.label} type="button" onClick={() => navigate(item.path)} aria-label={item.badge ? `${item.label}, ${item.badge} ready` : item.label} className={cn("relative flex size-16 items-center justify-center rounded-full bg-white shadow-[0_4px_0_#0000002e] transition-transform active:translate-y-1", focusRing)}>
              <img src={item.image} alt="" width={40} height={40} />
              {item.badge > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#D92D2D] text-sm font-black text-white">{item.badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-end">
        <p className="kp-float relative mb-1 rounded-3xl bg-white px-6 py-2 text-center text-2xl font-black text-[#3C3C3C] shadow-[0_4px_0_#0000001f] sm:text-3xl">
          {current ? star.name : "You did them all!"}
          <span aria-hidden="true" className="absolute -bottom-2 left-1/2 size-5 -translate-x-1/2 rotate-45 bg-white" />
        </p>
        <Friend lesson={star} label={`Say hi to ${star.name}`} className="size-52 sm:size-64" />
      </div>

      <div className="relative flex justify-center p-4 sm:p-6">
        <button type="button" onClick={() => navigate(lessonPath(current))} className={cn("kp-pulse flex min-h-20 w-full max-w-sm items-center justify-center gap-3 rounded-3xl bg-hudyat-gold text-4xl font-black text-[#3C3C3C] shadow-[0_7px_0_#B87800] transition-transform active:translate-y-1.5 active:shadow-none", focusRing)}>
          <Play aria-hidden="true" className="size-9 fill-current" /> {current ? "PLAY" : "AGAIN"}
        </button>
      </div>
    </section>
  );
}

/* ── kid-town · the buildings are the navigation ───────── */
const Face = ({ cx, cy }: { cx: number; cy: number }) => (
  <g>
    <g className="kp-blink">
      <circle cx={cx - 15} cy={cy} r={11} fill="#fff" /><circle cx={cx + 15} cy={cy} r={11} fill="#fff" />
      <circle cx={cx - 14} cy={cy + 2} r={5.5} fill="#3C3C3C" /><circle cx={cx + 16} cy={cy + 2} r={5.5} fill="#3C3C3C" />
    </g>
    <path d={`M${cx - 12} ${cy + 20} q12 13 24 0`} fill="#3C3C3C" />
  </g>
);

const HOUSES: Record<string, ReactNode> = {
  learn: (
    <>
      <g className="kp-flag" fill="#D92D2D"><rect x={59} y={2} width={3} height={32} fill="#7A4B21" /><path d="M62 4 l26 8 -26 9z" /></g>
      <path d="M8 74 L60 28 112 74z" fill="#D92D2D" />
      <rect x={16} y={72} width={88} height={86} rx={8} fill="#0077CE" />
      <Face cx={60} cy={104} />
    </>
  ),
  practice: (
    <>
      <rect x={40} y={34} width={40} height={24} rx={7} fill="#B87800" />
      <rect x={8} y={52} width={104} height={106} rx={18} fill="#FFC145" />
      <circle cx={60} cy={102} r={40} fill="#FFF3D1" stroke="#B87800" strokeWidth={6} />
      <Face cx={60} cy={94} />
      <circle className="kp-rec" cx={97} cy={68} r={7} fill="#D92D2D" />
    </>
  ),
  quiz: (
    <>
      <path className="kp-star" d="M60 2 l8 16 18 3 -13 13 3 18 -16 -9 -16 9 3 -18 -13 -13 18 -3z" fill="#FFC145" stroke="#B87800" strokeWidth={3} strokeLinejoin="round" />
      <rect x={22} y={56} width={76} height={102} rx={12} fill="#8B5CF6" />
      <path d="M22 76 v-14 h13 v8 h11 v-8 h14 v8 h14 v-8 h11 v8 h13 v6z" fill="#6D3FDB" />
      <Face cx={60} cy={108} />
    </>
  ),
};

function TownHome({ name, avatarKey, all, current, quizzesReady }: KidData) {
  const navigate = useNavigate();
  const friends = all.filter((lesson) => lesson.learningStatus === "completed");
  const places = [
    { key: "learn", label: "Learn", path: lessonPath(current), grow: "flex-[1.25]", aria: current ? `Learn, next is ${current.name}` : "Learn" },
    { key: "practice", label: "Practice", path: "/student/practice", grow: "flex-1", aria: "Practice" },
    { key: "quiz", label: "Quiz", path: "/student/assessment", grow: "flex-1", aria: quizzesReady ? `Quiz, ${quizzesReady} ready` : "Quiz" },
  ];
  return (
    <section className="relative h-[min(76dvh,660px)] min-h-[520px] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-[0_8px_0_#0000001a]" style={{ background: "linear-gradient(#8FD6FF, #E5F6FF 70%)" }}>
      <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="none" className="absolute inset-x-0 bottom-20 h-3/5 w-full">
        <path d="M0 170 Q100 90 210 150 T400 120 V300 H0z" fill="#B5E86F" />
        <path d="M0 215 Q130 150 260 200 T400 185 V300 H0z" fill="#7ED13F" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 400 110" className="absolute inset-x-0 top-14 w-full">
        <g className="kp-drift"><ellipse cx={70} cy={40} rx={38} ry={14} fill="#fff" /><ellipse cx={92} cy={28} rx={22} ry={14} fill="#fff" /></g>
        <g className="kp-drift" style={{ animationDelay: "-11s" }}><ellipse cx={270} cy={62} rx={30} ry={10} fill="#fff" opacity={0.9} /></g>
      </svg>

      <h1 className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-white/95 py-1 pr-5 pl-1 text-xl font-black text-[#3C3C3C] sm:text-2xl">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-hudyat-gold/30 text-2xl">{getAvatarEmoji(avatarKey)}</span>
        Hi, {firstName(name)}!
      </h1>

      <nav aria-label="Places" className="absolute inset-x-1 bottom-20 flex items-end justify-around gap-1 sm:inset-x-8">
        {places.map((place, index) => (
          <button key={place.key} type="button" onClick={() => navigate(place.path)} aria-label={place.aria} className={cn("group relative flex min-w-0 flex-col items-center rounded-3xl", place.grow, focusRing)}>
            {place.key === "learn" && current && (
              <span aria-hidden="true" className="kp-float mb-1 flex flex-col items-center">
                <span className="flex size-16 items-center justify-center rounded-full border-4 border-hudyat-gold bg-white sm:size-20">
                  <LessonCharacter title={current.name} color={colorOf(current.name)} className="size-12 sm:size-14" />
                </span>
                <span className="size-4 -translate-y-2 rotate-45 border-r-4 border-b-4 border-hudyat-gold bg-white" />
              </span>
            )}
            {place.key === "quiz" && quizzesReady > 0 && <span aria-hidden="true" className="kp-float absolute top-8 right-1 z-10 flex size-9 items-center justify-center rounded-full border-4 border-white bg-[#D92D2D] text-base font-black text-white">{quizzesReady}</span>}
            <svg aria-hidden="true" viewBox="0 0 120 160" className="kp-house w-full max-w-44 overflow-visible" style={{ animationDelay: `${index * -0.5}s` }}>{HOUSES[place.key]}</svg>
            <span className="-mt-3 rounded-full bg-white px-3 py-1 text-base font-black text-[#3C3C3C] shadow-[0_3px_0_#0000002a] sm:px-5 sm:text-xl">{place.label}</span>
          </button>
        ))}
      </nav>

      {/* The road: every finished lesson's character comes to live in town. */}
      <div className="absolute inset-x-0 bottom-0 h-20 border-t-4 border-[#D8B878] bg-[#F2D9A6]">
        <p className="sr-only">{friends.length} of {all.length} friends live in your town</p>
        {friends.map((lesson, index) => (
          <span key={lesson.id} aria-hidden="true" className="kp-wander absolute bottom-3" style={{ left: `${((index + 0.5) / friends.length) * 88 + 2}%`, animationDelay: `${index * -1.3}s` }}>
            <LessonCharacter title={lesson.name} color={colorOf(lesson.name)} className="size-11 sm:size-14" />
          </span>
        ))}
        {friends.length === 0 && <p aria-hidden="true" className="pt-6 text-center text-lg font-black text-[#7A5A1F]">New friends come here!</p>}
      </div>
    </section>
  );
}

/* ── kid-friends · one lesson at a time ────────────────── */
function FriendsHome({ name, all, current }: KidData) {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<number | null>(null);
  const swipeStart = useRef(0);
  const index = picked ?? (current ? all.indexOf(current) : all.length - 1);
  const lesson = all[index];
  const go = (to: number) => setPicked(Math.min(all.length - 1, Math.max(0, to)));
  const locked = lesson.learningStatus === "locked";
  const done = lesson.learningStatus === "completed";
  const action = done ? "AGAIN" : lesson.progressPercent > 0 ? "KEEP GOING" : "PLAY";
  const arrow = cn("absolute top-1/2 z-10 flex size-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3C3C3C] shadow-[0_4px_0_#0000002e] disabled:opacity-30", focusRing);

  return (
    <section className="flex min-h-[520px] flex-col items-center overflow-hidden rounded-[2.5rem] border-4 border-white py-5 shadow-[0_8px_0_#0000001a] transition-colors duration-500" style={{ backgroundColor: PALETTE[colorOf(lesson.name)].light }}>
      <h1 className="text-2xl font-black text-[#3C3C3C] sm:text-3xl">Hi, {firstName(name)}!</h1>

      <div
        className="relative mt-2 h-72 w-full touch-pan-y sm:h-96"
        onPointerDown={(event) => { swipeStart.current = event.clientX; }}
        onPointerUp={(event) => {
          const moved = event.clientX - swipeStart.current;
          if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1));
        }}
      >
        {all.map((item, i) => {
          const offset = i - index;
          const near = Math.abs(offset) <= 1;
          return (
            <div key={item.id} className={cn("absolute top-1/2 left-1/2 transition-[transform,opacity] duration-500 ease-out", !near && "pointer-events-none opacity-0", offset !== 0 && near && "opacity-70")} style={{ transform: `translate(-50%, -50%) translateX(calc(${offset} * min(60vw, 340px))) scale(${offset === 0 ? 1 : 0.5})` }} aria-hidden={!near}>
              <span className={cn("block rounded-full", offset === 0 && item.learningStatus === "completed" && "ring-8 ring-hudyat-gold/80")}>
                <Friend lesson={item} asleep={item.learningStatus === "locked"} label={offset === 0 ? `Say hi to ${item.name}` : `Go to ${item.name}`} className="size-60 sm:size-80" onSelect={offset === 0 ? undefined : () => go(i)} />
              </span>
            </div>
          );
        })}
        <button type="button" aria-label="Previous friend" disabled={index === 0} onClick={() => go(index - 1)} className={cn(arrow, "left-2")}><ChevronLeft aria-hidden="true" className="size-8" strokeWidth={3} /></button>
        <button type="button" aria-label="Next friend" disabled={index === all.length - 1} onClick={() => go(index + 1)} className={cn(arrow, "right-2")}><ChevronRight aria-hidden="true" className="size-8" strokeWidth={3} /></button>
      </div>

      <h2 className="text-4xl font-black text-[#3C3C3C] sm:text-5xl">{lesson.name}</h2>
      <div aria-hidden="true" className="mt-2 flex flex-wrap justify-center gap-1.5 px-4">
        {all.map((item, i) => <span key={item.id} className={cn("h-3 rounded-full transition-all", i === index ? "w-8 bg-[#3C3C3C]" : "w-3 bg-[#3C3C3C]/25")} />)}
      </div>
      <p className="sr-only">Friend {index + 1} of {all.length}</p>

      <div className="mt-4 w-full max-w-sm px-5">
        {locked ? (
          <p className="flex min-h-20 items-center justify-center gap-3 rounded-3xl bg-white/70 text-2xl font-black text-[#5B5B5B]"><Lock aria-hidden="true" className="size-7" /> Still sleeping</p>
        ) : (
          <button type="button" onClick={() => navigate(lessonPath(lesson))} className={cn("flex min-h-20 w-full items-center justify-center gap-3 rounded-3xl bg-hudyat-gold text-3xl font-black text-[#3C3C3C] shadow-[0_7px_0_#B87800] transition-transform active:translate-y-1.5 active:shadow-none", !done && "kp-pulse", focusRing)}>
            <Play aria-hidden="true" className="size-8 fill-current" /> {action}
          </button>
        )}
      </div>
    </section>
  );
}

const VARIANTS = { "kid-stage": StageHome, "kid-town": TownHome, "kid-friends": FriendsHome } as const;

export function KidHome({ variant, name, avatarKey, areas }: { variant: string; name: string; avatarKey: string | null; areas: LearningArea[] }) {
  const quizzes = useAssessmentList().data?.learningAreas.flatMap((area) => area.categories) ?? [];
  const all = areas.flatMap((area) => area.categories);
  const Variant = VARIANTS[variant as keyof typeof VARIANTS];
  return (
    <div className="mx-auto max-w-5xl font-body">
      {all.length === 0 ? (
        <div role="status" aria-label="Loading your lessons" className="h-[500px] animate-pulse rounded-[2.5rem] bg-[#F2E8D5] motion-reduce:animate-none" />
      ) : (
        <Variant name={name} avatarKey={avatarKey} all={all} current={all.find((c) => c.learningStatus === "current")} quizzesReady={quizzes.filter((q) => q.isUnlocked && q.status === "not-started").length} />
      )}
      <style>{`
        .kp-spark { opacity: 0 }
        .kp-house, .kp-blink, .kp-star, .kp-flag { transform-box: fill-box }
        .kp-house { transform-origin: 50% 100% }
        .kp-blink, .kp-star { transform-origin: center }
        .kp-flag { transform-origin: 0 100% }
        @keyframes kp-hop { 0%,100% { transform: translateY(0) scale(1,1) } 25% { transform: translateY(0) scale(1.15,.85) } 55% { transform: translateY(-40px) scale(.92,1.08) } 85% { transform: translateY(0) scale(1.08,.92) } }
        @keyframes kp-spark { 0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scale(.4) } 100% { opacity: 0; transform: rotate(var(--a)) translateY(-150px) scale(1.2) } }
        @keyframes kp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
        @keyframes kp-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.04) } }
        @keyframes kp-breathe { 0%,100% { transform: scale(1,1) } 50% { transform: scale(1.025,.975) } }
        @keyframes kp-squash { 0%,100% { transform: translateY(0) scale(1,1) } 30% { transform: scale(1.08,.9) } 60% { transform: translateY(-10px) scale(.96,1.05) } }
        @keyframes kp-blink { 0%,92%,100% { transform: scaleY(1) } 96% { transform: scaleY(.1) } }
        @keyframes kp-flag { 0%,100% { transform: skewY(0) } 50% { transform: skewY(-9deg) } }
        @keyframes kp-star { 0%,100% { transform: scale(1) rotate(-6deg) } 50% { transform: scale(1.12) rotate(6deg) } }
        @keyframes kp-rec { 0%,55% { opacity: 1 } 60%,95% { opacity: .2 } }
        @keyframes kp-drift { 0%,100% { transform: translateX(-30px) } 50% { transform: translateX(50px) } }
        @keyframes kp-wander { 0%,100% { transform: translate(-16px,0) } 25%,75% { transform: translate(0,-6px) } 50% { transform: translate(16px,0) } }
        @media (prefers-reduced-motion: no-preference) {
          .kp-hop { animation: kp-hop .65s ease-in-out }
          .kp-spark { animation: kp-spark .8s ease-out both }
          .kp-float { animation: kp-float 2.2s ease-in-out infinite }
          .kp-pulse { animation: kp-pulse 1.6s ease-in-out infinite }
          .kp-house { animation: kp-breathe 3s ease-in-out infinite }
          .group:hover .kp-house, .group:focus-visible .kp-house { animation: kp-squash .7s ease-in-out infinite }
          .kp-blink { animation: kp-blink 4s infinite }
          .kp-flag { animation: kp-flag 1.3s ease-in-out infinite }
          .kp-star { animation: kp-star 2.4s ease-in-out infinite }
          .kp-rec { animation: kp-rec 1.4s steps(1) infinite }
          .kp-drift { animation: kp-drift 22s ease-in-out infinite }
          .kp-wander { animation: kp-wander 5s ease-in-out infinite }
        }
      `}</style>
    </div>
  );
}
