/*
 * Student home, "Today's adventure":
 *  1. a greeting with the child's avatar
 *  2. ONE big card for the lesson to do next: its world, a character that reacts to taps,
 *     the Learn page's progress bar and a big CONTINUE (the only gold thing on the page)
 *  3. tiles for the three modes, drawn with the sidebar's own figures and paper backgrounds
 *  4. a sticker album with one same-sized slot per lesson: earned, next, or still a mystery
 * Built from the same parts as the Learn page and the student nav. Motion is in student-home.css.
 */
import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, Hand, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { LearningArea } from "@/api/learning-api";
import { getAvatarEmoji } from "@/components/common/avatars.constants";
import { CATEGORIES, type CategoryColor } from "@/components/common/categories.constants";
import { LessonCharacter, PALETTE } from "@/components/common/learn-card/characters";
import { LessonProgressBar } from "@/components/common/learn-card/learn-card";
import { WorldStage } from "@/components/common/learn-card/worlds";
import "@/components/common/learn-card/learn-card.css";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLearningAreas } from "@/hooks/use-learning-areas";
import CartoonNavIcon from "@/layouts/student-nav/cartoon-nav-icon";
import { cn } from "@/lib/utils";

import "./student-home.css";

type Lesson = LearningArea["categories"][number];

const colorOf = (title: string): CategoryColor => CATEGORIES.find((item) => item.title === title)?.color ?? "blue";
const firstName = (name: string) => name.split(" ")[0] || "friend";
const isStarted = (lesson: Lesson) => lesson.progress.status === "IN_PROGRESS" || lesson.progress.lastLessonStep !== null;

const focusRing = "focus-visible:ring-4 focus-visible:ring-hudyat-blue focus-visible:ring-offset-2 focus-visible:outline-none";
const press = "cursor-pointer touch-manipulation transition-transform duration-100 active:translate-y-1";

// `figure` and `data-nav-name` pick the sidebar's drawing and its paper colours (student-nav.css).
const MODES = [
  { key: "learn", title: "Learn", figure: "Learn", path: "/student/learn" },
  { key: "practice", title: "Practice", figure: "Practice", path: "/student/practice" },
  { key: "quiz", title: "Quiz", figure: "Assessment", path: "/student/assessment" },
] as const;

function TapCharacter({ lesson }: { lesson: Lesson }) {
  const [taps, setTaps] = useState(0);
  return (
    <button type="button" aria-label={`Say hi to ${lesson.name}`} onClick={() => setTaps((n) => n + 1)} className={cn("group relative z-10 block cursor-pointer touch-manipulation rounded-full", focusRing)}>
      {/* Changing the key restarts the hop on every tap. */}
      <span key={taps} className={cn("block", taps > 0 && "home-hop")}>
        <LessonCharacter title={lesson.name} color={colorOf(lesson.name)} className="size-40 sm:size-52" />
      </span>
      {taps > 0 && (
        <span key={`stars-${taps}`} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <Star key={angle} className="home-spark absolute -m-3 size-6 fill-hudyat-gold text-[#B87800]" style={{ "--a": `${angle}deg` } as CSSProperties} />
          ))}
        </span>
      )}
    </button>
  );
}

function TodayCard({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const color = colorOf(lesson.name);
  const action = isStarted(lesson) ? "CONTINUE" : "START";
  return (
    <article className="home-enter relative flex flex-col overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_8px_0_#0000001a,inset_0_-5px_0_#0000000a] md:flex-row">
      {/* Fills the card so a tap anywhere starts the lesson; the character sits above it. */}
      <button
        type="button"
        aria-label={`${action === "START" ? "Start" : "Continue"} ${lesson.name}`}
        onClick={() => navigate(`/student/learn/${lesson.id}`)}
        className="absolute inset-0 cursor-pointer touch-manipulation rounded-[inherit] focus-visible:ring-4 focus-visible:ring-hudyat-blue focus-visible:outline-none focus-visible:ring-inset"
      />
      <div className="pointer-events-none relative flex h-60 shrink-0 items-end justify-center overflow-hidden sm:h-72 md:h-auto md:min-h-80 md:w-1/2">
        <WorldStage title={lesson.name} p={PALETTE[color]} locked={false} />
        <span className="absolute bottom-3 h-4 w-32 rounded-[50%] bg-black/20" />
        <span className="pointer-events-auto relative mb-4"><TapCharacter lesson={lesson} /></span>
      </div>
      <div className="pointer-events-none relative flex flex-1 flex-col justify-center gap-3 p-5 sm:p-7">
        <p className="w-fit rounded-full bg-[#FFEFC2] px-3 py-1 text-base font-extrabold text-[#6B4A00]">Today's adventure</p>
        <h2 className="text-4xl font-black text-[#3C3C3C]">{lesson.name}</h2>
        <LessonProgressBar title={lesson.name} percent={lesson.progressPercent} fill={PALETTE[color].main} />
        <span className="mt-3 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-hudyat-gold text-2xl font-black text-[#3C3C3C] shadow-[0_6px_0_#B87800]">
          {action} <ArrowRight aria-hidden="true" className="home-nudge size-7" strokeWidth={3} />
        </span>
      </div>
    </article>
  );
}

function ModeTiles({ quizzesReady }: { quizzesReady: number }) {
  const navigate = useNavigate();
  return (
    <nav aria-label="Modes" className="grid grid-cols-3 gap-3 sm:gap-4">
      {MODES.map((mode) => {
        const badge = mode.key === "quiz" ? quizzesReady : 0;
        return (
          <button
            key={mode.key}
            type="button"
            data-nav-name={mode.figure}
            onClick={() => navigate(mode.path)}
            aria-label={badge ? `${mode.title}, ${badge} ready` : mode.title}
            className={cn("home-tile relative flex flex-col items-center gap-1 rounded-3xl border-2 border-[var(--nav-edge)] bg-[var(--nav-paper)] [background-image:var(--nav-pattern)] [background-size:42px_42px] py-3 shadow-[0_5px_0_var(--nav-edge)] sm:py-4", press, focusRing)}
          >
            <span className="size-16 sm:size-20"><CartoonNavIcon name={mode.figure} /></span>
            <span className="text-lg font-black text-[#3C3C3C] sm:text-xl">{mode.title}</span>
            {badge > 0 && (
              <span aria-hidden="true" className="absolute -top-2 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#D92D2D] text-sm font-black text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function StickerAlbum({ lessons }: { lessons: Lesson[] }) {
  const earned = lessons.filter((lesson) => lesson.learningStatus === "completed").length;
  const slot = "relative flex aspect-square w-full max-w-24 items-center justify-center justify-self-center rounded-3xl border-4";
  return (
    <section aria-labelledby="sticker-heading" className="rounded-[2rem] bg-white p-4 shadow-[0_5px_0_#0000001a] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sticker-heading" className="text-2xl font-black text-[#3C3C3C]">My stickers</h2>
        <p className="flex items-center gap-1.5 rounded-full bg-[#FFEFC2] px-3 py-1 text-lg font-black text-[#3C3C3C]">
          <Star aria-hidden="true" className="size-5 fill-hudyat-gold text-[#B87800]" />
          {earned}<span className="sr-only"> of </span><span aria-hidden="true">/</span>{lessons.length}
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-3">
        {lessons.map((lesson, index) => {
          const color = colorOf(lesson.name);
          const character = <LessonCharacter title={lesson.name} color={color} className="size-full" />;
          if (lesson.learningStatus === "completed") {
            return (
              <li key={lesson.id} role="img" aria-label={`${lesson.name}, sticker earned`} className={cn(slot, "border-white shadow-[0_3px_8px_#0000003d]", index % 2 ? "rotate-3" : "-rotate-3")} style={{ backgroundColor: PALETTE[color].light }}>
                <span className="block size-[74%]">{character}</span>
                <Star aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 size-7 fill-hudyat-gold text-[#B87800]" strokeWidth={2.5} />
              </li>
            );
          }
          if (lesson.learningStatus === "current") {
            return (
              <li key={lesson.id} role="img" aria-label={`${lesson.name}, next sticker`} className={cn(slot, "border-dashed border-[#B87800] bg-[#FFF8E5]")}>
                <span className="home-float block size-[74%]">{character}</span>
                <span aria-hidden="true" className="absolute -bottom-2.5 rounded-full bg-hudyat-gold px-2 text-sm font-black text-[#3C3C3C]">Next</span>
              </li>
            );
          }
          return <li key={lesson.id} role="img" aria-label="Sticker to find later" className={cn(slot, "border-dashed border-[#DDD1BA] bg-[#F8F3E8] text-3xl font-black text-[#6B5F4A]")}>?</li>;
        })}
      </ul>
    </section>
  );
}

const StudentHomePage = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: learningAreas = [], isLoading } = useLearningAreas();
  const quizzes = useAssessmentList().data?.learningAreas.flatMap((area) => area.categories) ?? [];

  const lessons = learningAreas.flatMap((area) => area.categories);
  const current = lessons.find((lesson) => lesson.learningStatus === "current");
  // Unlocked quizzes not tried yet: shown as a badge so the child knows one is waiting.
  const quizzesReady = quizzes.filter((quiz) => quiz.isUnlocked && quiz.status === "not-started").length;
  const avatar = getAvatarEmoji(user?.avatarKey);

  return (
    <div className="mx-auto max-w-5xl space-y-7 font-body">
      <header className="flex items-center gap-3">
        {avatar && <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/30 text-3xl">{avatar}</span>}
        <h1 className="flex items-center gap-2 text-3xl font-black text-[#3C3C3C]">
          Hi, {firstName(user?.fullName ?? "")}! <Hand aria-hidden="true" className="home-wave size-8 fill-hudyat-gold text-[#B87800]" strokeWidth={2.2} />
        </h1>
      </header>

      {isLoading ? (
        <div role="status" aria-label="Loading your lessons" className="h-80 animate-pulse rounded-[2rem] bg-[#F2E8D5] motion-reduce:animate-none" />
      ) : current ? (
        <TodayCard lesson={current} />
      ) : lessons.length > 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border-4 border-hudyat-gold bg-white p-6 text-center shadow-[0_8px_0_#0000001a] sm:p-8">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#2E7D00] text-white">
            <Check aria-hidden="true" className="size-9" strokeWidth={4} />
          </span>
          <p className="text-2xl font-black text-[#3C3C3C] sm:text-3xl">You finished every lesson!</p>
          <p className="text-base font-semibold text-[#5F5F5F]">Practice your signs or look at any lesson again.</p>
          <button
            type="button"
            onClick={() => navigate("/student/learn")}
            className={cn("flex min-h-14 items-center gap-2 rounded-2xl bg-hudyat-gold px-8 text-xl font-black text-[#3C3C3C] shadow-[0_5px_0_#B87800] active:shadow-none", press, focusRing)}
          >
            SEE LESSONS <ArrowRight aria-hidden="true" className="size-6" />
          </button>
        </div>
      ) : null}

      <ModeTiles quizzesReady={quizzesReady} />

      {lessons.length > 0 && <StickerAlbum lessons={lessons} />}
    </div>
  );
};

export default StudentHomePage;
