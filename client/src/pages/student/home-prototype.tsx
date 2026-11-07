/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: what should the student home page look like for deaf
 * elementary learners? Three structurally different versions on /student, switchable via
 * ?variant= (dev only), all on real data and reusing the lesson worlds/characters:
 *   home-hero  · "Today's adventure": one big card for the current lesson + small mode tiles + sticker shelf
 *   home-map   · "Journey map": every lesson as a stop on a winding game path
 *   home-buddy · "Buddy says hi": the current lesson's character greets the child, big scene cards per mode
 */
import type { CSSProperties } from "react";
import { ArrowRight, Check, Lock, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { LearningArea } from "@/api/learning-api";
import type { MyProgress } from "@/api/progress-api";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { CATEGORIES, type CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import "@/components/common/learn-card/learn-card.css";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { cn } from "@/lib/utils";

export const HOME_VARIANTS = [
  { key: "home-hero", name: "Home · Today's adventure" },
  { key: "home-map", name: "Home · Journey map" },
  { key: "home-buddy", name: "Home · Buddy says hi" },
];
export const isHomeVariant = (v: string | null) => HOME_VARIANTS.some((item) => item.key === v);

type Category = LearningArea["categories"][number];
export type HomeData = {
  name: string;
  avatarKey: string | null;
  areas: LearningArea[];
  progress?: MyProgress;
  quizzesReady: number;
};

const colorOf = (title: string): CategoryColor => CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
const firstName = (name: string) => name.split(" ")[0] || "friend";

const MODES = [
  { key: "learn", title: "Learn", image: "/icons/learn.png", path: "/student/learn", bg: "bg-hudyat-blue", edge: "#004d85" },
  { key: "practice", title: "Practice", image: "/icons/practice.png", path: "/student/practice", bg: "bg-hudyat-gold", edge: "#b8860b" },
  { key: "quiz", title: "Quiz", image: "/icons/assessment.png", path: "/student/assessment", bg: "bg-violet-400", edge: "#7c5cbf" },
] as const;

function useLessons(areas: LearningArea[]) {
  const all = areas.flatMap((area) => area.categories);
  return {
    all,
    current: all.find((c) => c.learningStatus === "current"),
    done: all.filter((c) => c.learningStatus === "completed"),
  };
}

const actionText = (c: Category) => (c.progressPercent > 0 ? "CONTINUE" : "START");

/* ── A · Today's adventure ─────────────────────────────── */
function HeroHome({ name, avatarKey, areas, quizzesReady }: HomeData) {
  const navigate = useNavigate();
  const { all, current, done } = useLessons(areas);
  return (
    <div className="space-y-6 font-body">
      <header className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full bg-hudyat-gold/25 text-3xl">{getAvatarEmoji(avatarKey)}</span>
        <div>
          <h1 className="text-2xl font-black text-[#3C3C3C] sm:text-3xl">Hi, {firstName(name)}!</h1>
          <p className="text-base font-semibold text-[#6B6B6B]">Ready to sign today?</p>
        </div>
      </header>

      {current ? (
        <button
          type="button"
          onClick={() => navigate(`/student/learn/${current.id}`)}
          className="group block w-full overflow-hidden rounded-[2rem] border-4 border-white text-left shadow-[0_8px_0_#0000001a] transition-transform focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:translate-y-1"
        >
          <LessonStage title={current.name} color={colorOf(current.name)} className="h-52 sm:h-64" />
          <div className="bg-white p-5">
            <p className="text-sm font-extrabold tracking-widest text-[#6B6B6B] uppercase">Today's adventure</p>
            <h2 className="text-3xl font-black text-[#3C3C3C]">{current.name}</h2>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#E5E5E5]">
              <div className="h-full rounded-full bg-hudyat-gold" style={{ width: `${current.progressPercent}%` }} />
            </div>
            <span className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-hudyat-gold text-xl font-black text-[#3C3C3C] shadow-[0_5px_0_#B87800] group-active:translate-y-1 group-active:shadow-none">
              {actionText(current)} <ArrowRight className="size-6" />
            </span>
          </div>
        </button>
      ) : (
        <p className="rounded-3xl bg-white p-6 text-center text-xl font-black text-[#3C3C3C]">You finished every lesson! ★</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => navigate(mode.path)}
            className={cn("relative flex flex-col items-center gap-1 rounded-2xl py-3 text-white transition-transform active:translate-y-1", mode.bg)}
            style={{ boxShadow: `0 5px 0 ${mode.edge}` }}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white">
              <img src={mode.image} alt="" width={36} height={36} />
            </span>
            <span className="text-lg font-black">{mode.title}</span>
            {mode.key === "quiz" && quizzesReady > 0 && (
              <span className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#FF4B4B] text-sm font-black">{quizzesReady}</span>
            )}
          </button>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-black text-[#3C3C3C]">
          My lesson stickers <span className="text-[#6B6B6B]">· {done.length}/{all.length}</span>
        </h2>
        <div className="mt-3 flex flex-wrap gap-3 rounded-3xl border-4 border-dashed border-[#E8C98A] bg-white/60 p-3">
          {all.map((c) => {
            const earned = c.learningStatus === "completed";
            return (
              <span key={c.id} title={c.name} className={cn("flex size-16 items-center justify-center rounded-full border-4 bg-white", earned ? "border-hudyat-gold" : "border-[#E5E5E5] opacity-40")}>
                <LessonCharacter title={c.name} color={colorOf(c.name)} asleep={!earned} className="size-11" />
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ── B · Journey map ───────────────────────────────────── */
function MapHome({ name, avatarKey, areas, progress, quizzesReady }: HomeData) {
  const navigate = useNavigate();
  let n = 0;
  return (
    <div className="font-body">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-11 items-center justify-center rounded-full bg-hudyat-gold/25 text-2xl">{getAvatarEmoji(avatarKey)}</span>
          <h1 className="text-xl font-black text-[#3C3C3C]">{firstName(name)}'s journey</h1>
        </div>
        <span className="flex items-center gap-1 rounded-2xl bg-white px-3 py-2 font-black text-[#3C3C3C] shadow-[0_3px_0_#0000001a]">
          <Star className="size-5 fill-hudyat-gold text-hudyat-gold" />
          {progress?.summary.completedCategories ?? 0}
        </span>
      </header>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => navigate("/student/practice")} className="min-h-12 flex-1 rounded-2xl bg-hudyat-gold font-black text-[#3C3C3C] shadow-[0_4px_0_#b8860b]">Practice</button>
        <button type="button" onClick={() => navigate("/student/assessment")} className="min-h-12 flex-1 rounded-2xl bg-violet-400 font-black text-white shadow-[0_4px_0_#7c5cbf]">
          Quiz{quizzesReady > 0 ? ` · ${quizzesReady} ready` : ""}
        </button>
      </div>

      {areas.map((area) => (
        <section key={area.id} className="mt-8">
          <h2 className="mx-auto w-fit rounded-2xl bg-hudyat-blue px-5 py-2 text-center text-base font-black text-white shadow-[0_4px_0_#004d85]">{area.name}</h2>
          <ol className="mt-6 flex flex-col items-center gap-5">
            {area.categories.map((c) => {
              const swing = Math.sin(n++ * 1.1); // zig-zag path, scaled to the screen so phones don't overflow
              const locked = c.learningStatus === "locked";
              const current = c.learningStatus === "current";
              const done = c.learningStatus === "completed";
              return (
                <li key={c.id} className="relative" style={{ transform: `translateX(calc(${swing} * min(90px, 20vw)))` }}>
                  {current && (
                    <span className="lc-float absolute -top-11 left-1/2 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 text-sm font-black whitespace-nowrap text-[#3C3C3C] shadow-[0_3px_0_#0000001a]">
                      {actionText(c)}!
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => navigate(`/student/learn/${c.id}`)}
                    aria-label={`${c.name}${done ? ", done" : locked ? ", locked" : ", now"}`}
                    className={cn(
                      "group flex items-center justify-center rounded-full border-b-[6px] transition-transform active:translate-y-1 disabled:active:translate-y-0",
                      current ? "size-28 border-[#B87800] bg-hudyat-gold" : done ? "size-20 border-[#B87800] bg-[#FFE58A]" : "size-20 border-[#CECECE] bg-[#E5E5E5]",
                    )}
                    style={current ? ({ animation: "ls-home-pulse 1.6s ease-out infinite" } as CSSProperties) : undefined}
                  >
                    <LessonCharacter title={c.name} color={colorOf(c.name)} asleep={locked} className={current ? "size-20" : "size-14"} />
                  </button>
                  {done && <Check className="absolute -top-1 -right-1 size-7 rounded-full bg-[#58CC02] p-1 text-white" strokeWidth={4} />}
                  {locked && <Lock className="absolute -top-1 -right-1 size-7 rounded-full bg-[#AFAFAF] p-1.5 text-white" />}
                  <p className="mt-1 text-center text-sm font-black text-[#4B4B4B]">{c.name}</p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <style>{`@keyframes ls-home-pulse { 0%,100% { box-shadow: 0 0 0 0 #FFC14588 } 50% { box-shadow: 0 0 0 14px transparent } } @media (prefers-reduced-motion: reduce) { [style*="ls-home-pulse"] { animation: none !important } }`}</style>
    </div>
  );
}

/* ── C · Buddy says hi ─────────────────────────────────── */
function BuddyHome({ name, avatarKey, areas, progress, quizzesReady }: HomeData) {
  const navigate = useNavigate();
  const { current, done } = useLessons(areas);
  const buddy = current ?? done.at(-1);
  const practiceWorld = done.at(-1) ?? current;
  const total = progress?.summary.totalCategories ?? 0;
  const filled = total ? (progress?.summary.completedCategories ?? 0) / total : 0;

  const cards = [
    { mode: MODES[0], world: current, line: current ? `${current.name} · ${current.progressPercent}%` : "All lessons done!" },
    { mode: MODES[1], world: practiceWorld, line: "Sign with the camera" },
    { mode: MODES[2], world: buddy, line: quizzesReady ? `${quizzesReady} quiz${quizzesReady > 1 ? "zes" : ""} ready` : "Show what you know" },
  ];

  return (
    <div className="space-y-6 font-body">
      <section className="flex items-end gap-3">
        {buddy && (
          <div aria-hidden="true" className="w-28 shrink-0 sm:w-36">
            <LessonCharacter title={buddy.name} color={colorOf(buddy.name)} className="aspect-square h-auto w-full" />
          </div>
        )}
        <div className="relative mb-8 flex-1 rounded-3xl border-[3px] border-[#3C3C3C] bg-white p-4">
          <span aria-hidden="true" className="absolute -bottom-[11px] left-5 size-5 rotate-45 border-r-[3px] border-b-[3px] border-[#3C3C3C] bg-white" />
          <p className="text-xl leading-snug font-bold text-[#3C3C3C] sm:text-2xl">
            Hi {firstName(name)} {getAvatarEmoji(avatarKey)}! {current ? <>Let's learn <mark className="rounded-lg bg-hudyat-gold/35 px-1 font-black uppercase">{current.name}</mark> today!</> : "You did every lesson!"}
          </p>
        </div>
      </section>

      <div className="space-y-4">
        {cards.map(({ mode, world, line }) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => navigate(mode.key === "learn" && current ? `/student/learn/${current.id}` : mode.path)}
            className={cn("group flex w-full items-stretch overflow-hidden rounded-3xl text-left text-white transition-transform active:translate-y-1", mode.bg)}
            style={{ boxShadow: `0 6px 0 ${mode.edge}` }}
          >
            <div className="w-32 shrink-0 sm:w-44">
              {world && <LessonStage title={world.name} color={colorOf(world.name)} className="h-full min-h-28" />}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 p-4">
              <div>
                <p className="text-2xl font-black">{mode.title}</p>
                <p className="text-base font-bold opacity-90">{line}</p>
              </div>
              <ArrowRight className="size-8 shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {total > 0 && (
        <section className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_4px_0_#0000000f]">
          {/* Star jar: fills up as lessons are finished */}
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-b-3xl rounded-t-lg border-4 border-[#BFDBFE] bg-[#EFF6FF]">
            <div className="absolute inset-x-0 bottom-0 bg-hudyat-gold transition-[height] duration-700" style={{ height: `${filled * 100}%` }} />
            <Star className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
          </div>
          <div>
            <p className="text-3xl font-black text-[#3C3C3C]">{progress?.summary.completedCategories}/{total}</p>
            <p className="text-base font-bold text-[#6B6B6B]">lessons in your star jar</p>
          </div>
        </section>
      )}
    </div>
  );
}

const VARIANTS = { "home-hero": HeroHome, "home-map": MapHome, "home-buddy": BuddyHome } as const;

export function HomePrototype({ variant, ...data }: Omit<HomeData, "quizzesReady"> & { variant: string }) {
  const quizzes = useAssessmentList().data?.learningAreas.flatMap((area) => area.categories) ?? [];
  const quizzesReady = quizzes.filter((q) => q.isUnlocked && q.status === "not-started").length;
  const Variant = VARIANTS[variant as keyof typeof VARIANTS];
  return <Variant {...data} quizzesReady={quizzesReady} />;
}
