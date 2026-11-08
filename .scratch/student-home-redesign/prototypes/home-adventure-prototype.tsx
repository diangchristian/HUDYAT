/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: how should "Today's adventure" be improved without losing the
 * one-big-card idea? Three versions on /student/home via ?variant= (dev only), real data:
 *   adv-refined · same page, fixed: readable tiles, the Learn page's progress bar, a sticker album
 *   adv-poster  · the card IS the page: the world fills it, modes shrink to a slim row, fits one phone screen
 *   adv-quest   · the mode tiles become today's lesson as steps: Learn, Practice, Quiz, then win the sticker
 * Tapping a character makes it hop; tapping anything else on the card starts the lesson.
 * Idle motion stays on the character and the main button. All of it stops under reduced motion.
 */
import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, Hand, Lock, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { LearningArea } from "@/api/learning-api";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { CATEGORIES, type CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter, PALETTE } from "@/components/common/learn-card/characters";
import { LessonProgressBar } from "@/components/common/learn-card/learn-card";
import { WorldStage } from "@/components/common/learn-card/worlds";
import "@/components/common/learn-card/learn-card.css";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import CartoonNavIcon from "@/layouts/student-nav/cartoon-nav-icon";
import { categorySlug } from "@/lib/practice";
import { cn } from "@/lib/utils";

export const ADVENTURE_VARIANTS = [
  { key: "adv-refined", name: "Adventure · same page, fixed" },
  { key: "adv-poster", name: "Adventure · one big poster" },
  { key: "adv-quest", name: "Adventure · today's quest" },
];
export const isAdventureVariant = (v: string | null) => ADVENTURE_VARIANTS.some((item) => item.key === v);

type Lesson = LearningArea["categories"][number];
type Quiz = NonNullable<ReturnType<typeof useAssessmentList>["data"]>["learningAreas"][number]["categories"][number];
type Data = { name: string; avatarKey: string | null; all: Lesson[]; current: Lesson; quizzes: Quiz[] };

const colorOf = (title: string): CategoryColor => CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
const firstName = (name: string) => name.split(" ")[0] || "friend";
const started = (lesson: Lesson) => lesson.progress.status === "IN_PROGRESS" || lesson.progress.lastLessonStep !== null;
const readyCount = (quizzes: Quiz[]) => quizzes.filter((quiz) => quiz.isUnlocked && quiz.status === "not-started").length;

const INK = "text-[#3C3C3C]";
const SOFT = "text-[#5F5F5F]";
const CLAY = "shadow-[0_8px_0_#0000001a,inset_0_-5px_0_#0000000a]";
const focusRing = "focus-visible:ring-4 focus-visible:ring-hudyat-blue focus-visible:ring-offset-2 focus-visible:outline-none";
const press = "cursor-pointer touch-manipulation transition-transform duration-100 active:translate-y-1";
const CTA = "flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-hudyat-gold text-2xl font-black text-[#3C3C3C] shadow-[0_6px_0_#B87800]";

const MODES = [
  { key: "learn", title: "Learn", figure: "Learn", path: "/student/learn" },
  { key: "practice", title: "Practice", figure: "Practice", path: "/student/practice" },
  { key: "quiz", title: "Quiz", figure: "Assessment", path: "/student/assessment" },
];

function Friend({ lesson, className }: { lesson: Lesson; className: string }) {
  const [taps, setTaps] = useState(0);
  return (
    <button type="button" aria-label={`Say hi to ${lesson.name}`} onClick={() => setTaps((n) => n + 1)} className={cn("group relative z-10 block cursor-pointer touch-manipulation rounded-full", focusRing)}>
      <span key={taps} className={cn("block", taps > 0 && "adv-hop")}>
        <LessonCharacter title={lesson.name} color={colorOf(lesson.name)} className={className} />
      </span>
      {taps > 0 && (
        <span key={`stars-${taps}`} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <Star key={angle} className="adv-spark absolute -m-3 size-6 fill-hudyat-gold text-[#B87800]" style={{ "--a": `${angle}deg` } as CSSProperties} />
          ))}
        </span>
      )}
    </button>
  );
}

/* The whole card starts the lesson; sits under the character so tapping the character stays playful. */
function CardTap({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  return <button type="button" aria-label={`${started(lesson) ? "Continue" : "Start"} ${lesson.name}`} onClick={() => navigate(`/student/learn/${lesson.id}`)} className="absolute inset-0 cursor-pointer touch-manipulation rounded-[inherit] focus-visible:ring-4 focus-visible:ring-hudyat-blue focus-visible:outline-none focus-visible:ring-inset" />;
}

/* The Learn page's own bar, in the lesson's colour, so progress looks the same everywhere. */
const LessonBar = ({ lesson, className }: { lesson: Lesson; className?: string }) => (
  <LessonProgressBar title={lesson.name} percent={lesson.progressPercent} fill={PALETTE[colorOf(lesson.name)].main} className={className} />
);

function Hello({ name, avatarKey }: { name: string; avatarKey: string | null }) {
  return (
    <header className="flex items-center gap-3">
      <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/30 text-3xl">{getAvatarEmoji(avatarKey)}</span>
      <h1 className={cn("flex items-center gap-2 text-3xl font-black", INK)}>
        Hi, {firstName(name)}! <Hand aria-hidden="true" className="adv-wave size-8 fill-hudyat-gold text-[#B87800]" strokeWidth={2.2} />
      </h1>
    </header>
  );
}

function ModeTiles({ quizzes }: { quizzes: Quiz[] }) {
  const navigate = useNavigate();
  const ready = readyCount(quizzes);
  return (
    <nav aria-label="Modes" className="grid grid-cols-3 gap-3 sm:gap-4">
      {MODES.map((mode) => {
        const badge = mode.key === "quiz" ? ready : 0;
        return (
          <button key={mode.key} type="button" onClick={() => navigate(mode.path)} data-nav-name={mode.figure} aria-label={badge ? `${mode.title}, ${badge} ready` : mode.title} className={cn("adv-tile relative flex flex-col items-center gap-1 rounded-3xl border-2 border-[var(--nav-edge)] bg-[var(--nav-paper)] [background-image:var(--nav-pattern)] [background-size:42px_42px] py-3 shadow-[0_5px_0_var(--nav-edge)] sm:py-4", press, focusRing)}>
            <span className="size-16 sm:size-20"><CartoonNavIcon name={mode.figure} /></span>
            <span className={cn("text-lg font-black sm:text-xl", INK)}>{mode.title}</span>
            {badge > 0 && <span aria-hidden="true" className="absolute -top-2 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#D92D2D] text-sm font-black text-white">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/* ── adv-refined ───────────────────────────────────────── */
function Refined({ name, avatarKey, all, current, quizzes }: Data) {
  const earned = all.filter((lesson) => lesson.learningStatus === "completed").length;
  return (
    <div className="space-y-7">
      <Hello name={name} avatarKey={avatarKey} />

      <article className={cn("adv-in relative flex flex-col overflow-hidden rounded-[2rem] border-4 border-white bg-white md:flex-row", CLAY)}>
        <CardTap lesson={current} />
        <div className="pointer-events-none relative flex h-60 shrink-0 items-end justify-center overflow-hidden sm:h-72 md:h-auto md:min-h-80 md:w-1/2">
          <WorldStage title={current.name} p={PALETTE[colorOf(current.name)]} locked={false} />
          <span className="absolute bottom-3 h-4 w-32 rounded-[50%] bg-black/20" />
          <span className="pointer-events-auto relative mb-4"><Friend lesson={current} className="size-40 sm:size-52" /></span>
        </div>
        <div className="pointer-events-none relative flex flex-1 flex-col justify-center gap-3 p-5 sm:p-7">
          <p className="w-fit rounded-full bg-[#FFEFC2] px-3 py-1 text-base font-extrabold text-[#6B4A00]">Today's adventure</p>
          <h2 className={cn("text-4xl font-black", INK)}>{current.name}</h2>
          <LessonBar lesson={current} />
          <span className={cn(CTA, "mt-3")}>{started(current) ? "CONTINUE" : "START"} <ArrowRight aria-hidden="true" className="adv-nudge size-7" strokeWidth={3} /></span>
        </div>
      </article>

      <ModeTiles quizzes={quizzes} />

      {/* Album: every slot is the same size, so the page reads as one collection to fill. */}
      <section aria-labelledby="adv-stickers" className="rounded-[2rem] bg-white p-4 shadow-[0_5px_0_#0000001a] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="adv-stickers" className={cn("text-2xl font-black", INK)}>My stickers</h2>
          <p className={cn("flex items-center gap-1.5 rounded-full bg-[#FFEFC2] px-3 py-1 text-lg font-black", INK)}>
            <Star aria-hidden="true" className="size-5 fill-hudyat-gold text-[#B87800]" />
            {earned}<span className="sr-only"> of </span><span aria-hidden="true">/</span>{all.length}
          </p>
        </div>
        <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-3">
          {all.map((lesson, index) => {
            const done = lesson.learningStatus === "completed";
            const next = lesson.id === current.id;
            const slot = "relative flex aspect-square w-full max-w-24 items-center justify-center justify-self-center rounded-3xl";
            if (!done && !next) return <li key={lesson.id} role="img" aria-label="Sticker to find later" className={cn(slot, "border-4 border-dashed border-[#DDD1BA] bg-[#F8F3E8] text-3xl font-black text-[#6B5F4A]")}>?</li>;
            return (
              <li key={lesson.id} role="img" aria-label={`${lesson.name}${done ? ", sticker earned" : ", next sticker"}`} className={cn(slot, done ? cn("border-4 border-white shadow-[0_3px_8px_#0000003d]", index % 2 ? "rotate-3" : "-rotate-3") : "border-4 border-dashed border-[#B87800] bg-[#FFF8E5]")} style={done ? { backgroundColor: PALETTE[colorOf(lesson.name)].light } : undefined}>
                <span className={cn("block size-[74%]", next && "adv-float")}><LessonCharacter title={lesson.name} color={colorOf(lesson.name)} className="size-full" /></span>
                {done && <Star aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 size-7 fill-hudyat-gold text-[#B87800]" strokeWidth={2.5} />}
                {next && <span aria-hidden="true" className={cn("absolute -bottom-2.5 rounded-full bg-hudyat-gold px-2 text-sm font-black", INK)}>Next</span>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ── adv-poster ────────────────────────────────────────── */
function Poster({ name, avatarKey, all, current, quizzes }: Data) {
  const navigate = useNavigate();
  const earned = all.filter((lesson) => lesson.learningStatus === "completed").length;
  const ready = readyCount(quizzes);
  return (
    <div className="space-y-4">
      <article className={cn("adv-in relative flex h-[min(70dvh,620px)] min-h-[500px] flex-col overflow-hidden rounded-[2.5rem] border-4 border-white", CLAY)}>
        <WorldStage title={current.name} p={PALETTE[colorOf(current.name)]} locked={false} />
        <CardTap lesson={current} />

        <header className="pointer-events-none relative flex items-center justify-between gap-2 p-3 sm:p-4">
          <h1 className={cn("flex items-center gap-2 rounded-full bg-white py-1 pr-5 pl-1 text-xl font-black sm:text-2xl", INK)}>
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-hudyat-gold/30 text-2xl">{getAvatarEmoji(avatarKey)}</span>
            Hi, {firstName(name)}!
          </h1>
          <button type="button" onClick={() => navigate("/student/progress")} aria-label={`My stickers, ${earned} of ${all.length}`} className={cn("pointer-events-auto relative z-10 flex min-h-13 items-center gap-1.5 rounded-full bg-white px-4 text-xl font-black", INK, press, focusRing)}>
            <Star aria-hidden="true" className="size-7 fill-hudyat-gold text-[#B87800]" /> {earned}/{all.length}
          </button>
        </header>

        <div className="pointer-events-none relative flex flex-1 items-end justify-center">
          <span className="absolute bottom-1 h-5 w-40 rounded-[50%] bg-black/20" />
          <span className="pointer-events-auto relative"><Friend lesson={current} className="size-44 sm:size-60" /></span>
        </div>

        <div className="pointer-events-none relative m-3 flex flex-col gap-2 rounded-[2rem] bg-white p-4 sm:m-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-[#6B4A00]">Today's adventure</p>
            <h2 className={cn("text-3xl font-black sm:text-4xl", INK)}>{current.name}</h2>
            <LessonBar lesson={current} className="mt-2" />
          </div>
          <span className={cn(CTA, "mt-2 px-8 sm:mt-0 sm:min-h-20 sm:text-3xl")}>{started(current) ? "CONTINUE" : "START"} <ArrowRight aria-hidden="true" className="adv-nudge size-7" strokeWidth={3} /></span>
        </div>
      </article>

      <nav aria-label="Modes" className="grid grid-cols-3 gap-2 sm:gap-3">
        {MODES.map((mode) => {
          const badge = mode.key === "quiz" ? ready : 0;
          return (
            <button key={mode.key} type="button" onClick={() => navigate(mode.path)} aria-label={badge ? `${mode.title}, ${badge} ready` : mode.title} className={cn("adv-tile relative flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-white shadow-[0_4px_0_#0000001a]", press, focusRing)}>
              <span className="size-11 shrink-0"><CartoonNavIcon name={mode.figure} /></span>
              <span className={cn("text-base font-black sm:text-xl", INK)}>{mode.title}</span>
              {badge > 0 && <span aria-hidden="true" className="absolute -top-2 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#D92D2D] text-sm font-black text-white">{badge}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── adv-quest ─────────────────────────────────────────── */
function Quest({ name, avatarKey, current, quizzes }: Data) {
  const navigate = useNavigate();
  const quiz = quizzes.find((item) => item.categoryId === current.id);
  const quizDone = quiz?.status === "completed";
  const quizOpen = Boolean(quiz?.isUnlocked);
  const stepBase = "adv-tile relative flex min-h-20 w-full items-center gap-3 rounded-3xl p-3 text-left sm:h-full sm:flex-col sm:gap-2 sm:p-4 sm:text-center";
  const joiner = "absolute z-0 border-dashed border-[#B87800] max-sm:top-full max-sm:left-11 max-sm:h-3 max-sm:border-l-4 sm:top-1/2 sm:left-full sm:w-4 sm:border-t-4";
  const disc = "flex size-16 shrink-0 items-center justify-center rounded-full";

  return (
    <div className="space-y-5">
      <Hello name={name} avatarKey={avatarKey} />

      <article className={cn("adv-in relative h-56 overflow-hidden rounded-[2rem] border-4 border-white sm:h-72", CLAY)}>
        <WorldStage title={current.name} p={PALETTE[colorOf(current.name)]} locked={false} />
        <CardTap lesson={current} />
        <div className="pointer-events-none relative flex h-full items-end justify-between gap-2 p-4 sm:p-6">
          <div className="min-w-0 self-start rounded-3xl bg-white px-4 py-2 sm:px-5 sm:py-3">
            <p className="text-base font-extrabold text-[#6B4A00]">Today's adventure</p>
            <h2 className={cn("text-3xl font-black sm:text-4xl", INK)}>{current.name}</h2>
          </div>
          <span className="pointer-events-auto"><Friend lesson={current} className="size-36 sm:size-52" /></span>
        </div>
      </article>

      <ol className="grid gap-3 sm:grid-cols-4 sm:gap-4">
        <li className="adv-in relative" style={{ animationDelay: "60ms" }}>
          <button type="button" onClick={() => navigate(`/student/learn/${current.id}`)} className={cn(stepBase, "bg-hudyat-gold shadow-[0_6px_0_#B87800]", press, focusRing)}>
            <span className="size-16 shrink-0"><CartoonNavIcon name="Learn" /></span>
            <span className={cn("flex-1 text-2xl font-black", INK)}>Learn</span>
            <ArrowRight aria-hidden="true" className={cn("adv-nudge size-8 sm:hidden", INK)} strokeWidth={3} />
            <span className="sr-only">{started(current) ? ", keep going" : ", start here"}</span>
          </button>
          <span aria-hidden="true" className={joiner} />
        </li>
        <li className="adv-in relative" style={{ animationDelay: "120ms" }}>
          <button type="button" onClick={() => navigate(`/student/practice/${categorySlug(current.name)}`)} className={cn(stepBase, "bg-white shadow-[0_5px_0_#0000001a]", press, focusRing)}>
            <span className="size-16 shrink-0"><CartoonNavIcon name="Practice" /></span>
            <span className={cn("flex-1 text-2xl font-black", INK)}>Practice</span>
          </button>
          <span aria-hidden="true" className={joiner} />
        </li>
        <li className="adv-in relative" style={{ animationDelay: "180ms" }}>
          {quizOpen ? (
            <button type="button" onClick={() => navigate(`/student/assessment/${current.id}`)} className={cn(stepBase, "bg-white shadow-[0_5px_0_#0000001a]", press, focusRing)}>
              <span className="size-16 shrink-0"><CartoonNavIcon name="Assessment" /></span>
              <span className={cn("flex-1 text-2xl font-black", INK)}>Quiz</span>
              {quizDone && <span className="flex size-9 items-center justify-center rounded-full bg-[#2E7D00] text-white"><Check aria-label="Done" className="size-6" strokeWidth={4} /></span>}
            </button>
          ) : (
            <div className={cn(stepBase, "border-4 border-dashed border-[#D5D5D5] bg-white/60")}>
              <span className={cn(disc, "bg-[#EFEFEF]")}><Lock aria-hidden="true" className="size-7 text-[#5F5F5F]" /></span>
              <span className={cn("flex-1 text-2xl font-black", SOFT)}>Quiz<span className="sr-only">, locked until you finish Learn</span></span>
            </div>
          )}
          <span aria-hidden="true" className={joiner} />
        </li>
        <li className="adv-in" style={{ animationDelay: "240ms" }}>
          <div className={cn(stepBase, "border-4 border-hudyat-gold bg-[#FFF8E5]")}>
            <span className="adv-float flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-[#B87800] bg-white">
              <LessonCharacter title={current.name} color={colorOf(current.name)} asleep className="size-11" />
            </span>
            <span className={cn("flex-1 text-2xl font-black", INK)}>Win me!<span className="sr-only"> The {current.name} sticker is your prize</span></span>
          </div>
        </li>
      </ol>
    </div>
  );
}

const VARIANTS = { "adv-refined": Refined, "adv-poster": Poster, "adv-quest": Quest } as const;

export function AdventureHome({ variant, name, avatarKey, areas, isLoading }: { variant: string; name: string; avatarKey: string | null; areas: LearningArea[]; isLoading: boolean }) {
  const navigate = useNavigate();
  const quizzes = useAssessmentList().data?.learningAreas.flatMap((area) => area.categories) ?? [];
  const all = areas.flatMap((area) => area.categories);
  const current = all.find((lesson) => lesson.learningStatus === "current");
  const Variant = VARIANTS[variant as keyof typeof VARIANTS];
  return (
    <div className="mx-auto max-w-5xl font-body">
      {isLoading ? (
        <div role="status" aria-label="Loading your lessons" className="h-[520px] animate-pulse rounded-[2rem] bg-[#F2E8D5] motion-reduce:animate-none" />
      ) : current ? (
        <Variant name={name} avatarKey={avatarKey} all={all} current={current} quizzes={quizzes} />
      ) : (
        <section className={cn("flex flex-col items-center gap-4 rounded-[2rem] border-4 border-hudyat-gold bg-white p-8 text-center", CLAY)}>
          <Star aria-hidden="true" className="adv-float size-20 fill-hudyat-gold text-[#B87800]" />
          <h1 className={cn("text-3xl font-black", INK)}>{all.length ? "You did every lesson!" : "No lessons yet"}</h1>
          {all.length > 0 && <button type="button" onClick={() => navigate("/student/learn")} className={cn(CTA, "px-8", press, focusRing)}>PLAY AGAIN <ArrowRight aria-hidden="true" className="size-7" strokeWidth={3} /></button>}
        </section>
      )}
      <style>{`
        .adv-spark { opacity: 0 }
        .adv-wave { transform-origin: 70% 90% }
        .adv-tile .student-nav-scene { opacity: 1 }
        .adv-tile:is(:hover, :focus-visible, :active) .student-nav-eyes { opacity: 0 }
        .adv-tile:is(:hover, :focus-visible, :active) .student-nav-happy { opacity: 1 }
        @keyframes adv-in { from { opacity: 0; transform: translateY(16px) scale(.96) } to { opacity: 1; transform: none } }
        @keyframes adv-hop { 0%,100% { transform: translateY(0) scale(1,1) } 25% { transform: scale(1.15,.85) } 55% { transform: translateY(-34px) scale(.92,1.08) } 85% { transform: scale(1.08,.92) } }
        @keyframes adv-spark { 0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scale(.4) } 100% { opacity: 0; transform: rotate(var(--a)) translateY(-120px) scale(1.2) } }
        @keyframes adv-nudge { 0%,100% { transform: translateX(0) } 50% { transform: translateX(6px) } }
        @keyframes adv-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes adv-wave { 0%,55%,100% { transform: rotate(0) } 10%,30% { transform: rotate(-16deg) } 20%,40% { transform: rotate(14deg) } }
        @media (prefers-reduced-motion: no-preference) {
          .adv-in { animation: adv-in .42s cubic-bezier(.3,1.4,.5,1) both }
          .adv-hop { animation: adv-hop .6s ease-in-out }
          .adv-spark { animation: adv-spark .7s ease-out both }
          .adv-nudge { animation: adv-nudge 1.1s ease-in-out infinite }
          .adv-float { animation: adv-float 2.2s ease-in-out infinite }
          .adv-wave { animation: adv-wave 3s ease-in-out infinite }
          .adv-tile:is(:hover, :focus-visible, :active) .student-nav-page { animation: student-nav-page-flip .85s ease }
          .adv-tile:is(:hover, :focus-visible, :active) .student-nav-hand { animation: student-nav-wave 1s ease }
          .adv-tile:is(:hover, :focus-visible, :active) .student-nav-pencil { animation: student-nav-write .85s ease }
        }
      `}</style>
    </div>
  );
}
