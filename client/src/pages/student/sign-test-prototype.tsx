/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: what should the "Sign test" feel like? The child signs EVERY sign
 * of a lesson from memory: word only, no photo or video. Real lesson data, in memory only (no saving,
 * no lesson locking yet). Three designs via ?variant= on /student/assessment/:categoryId (dev only):
 *   sign-focus · one giant word in a draining ring timer, progress dots, camera below
 *   sign-trail · the lesson's world trail; the character walks sign to sign, timer bar under it
 *   sign-cards · a deck of word cards; correct flips to a star, missed cards go to a review pile
 * Rules (from grilling): random order, 30s per sign, any correct recognition passes, wrong readings
 * are ignored (no red flash), timeout or Skip = missed, pass at 80%.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Hand, RotateCcw, SkipForward, Star, Timer, X } from "lucide-react";
import { useNavigate } from "react-router";

import { CATEGORIES } from "@/components/common/categories.constants";
import { LessonCharacter } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import PracticeCamera from "@/components/common/practice-camera";
import ElevatedButton from "@/components/ui/elavated-button";
import { usePreloadRecognition } from "@/features/fsl-recognition/preload";
import { useCategoryLesson } from "@/hooks/use-category-lesson";
import { categorySlug } from "@/lib/practice";
import { cn } from "@/lib/utils";

import Celebration from "./category-learn/celebration";
import type { LessonPrompt } from "./category-learn/learn-session";
import { HowCard } from "./category-learn/step-cards";
import "./category-learn/learn-session.css";

export const SIGN_TEST_VARIANTS = [
  { key: "sign-focus", name: "Sign test · ring timer" },
  { key: "sign-trail", name: "Sign test · world trail" },
  { key: "sign-cards", name: "Sign test · card deck" },
];
export const isSignTestVariant = (v: string | null) => SIGN_TEST_VARIANTS.some((item) => item.key === v);

// Lessons with a published recognition model (server/model-assets/catalog.json, available: true).
export const MODEL_LESSONS = new Set(["alphabet", "numbers", "greetings", "family", "colors"]);
const WINDOW_MS = 30_000;
const PASS = 0.8;
const FEEDBACK_MS = 1300; // the correct / time's up moment; the next sign's 30s start after it
const NUDGE_MS = 1400;
const NUDGE_COOLDOWN_MS = 2600; // "not yet" at most this often, so a moving hand doesn't flicker it

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/* ── In-memory runner ─────────────────────────────────── */
function useSignTest(prompts: LessonPrompt[]) {
  const [order, setOrder] = useState(() => shuffle(prompts));
  const [results, setResults] = useState<boolean[]>([]);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(WINDOW_MS);
  const [feedback, setFeedback] = useState<{ at: number; label: string; reason: "correct" | "timeout" | "skip" } | null>(null);
  const [nudgeAt, setNudgeAt] = useState(0);
  const resultsRef = useRef<boolean[]>([]);
  const lastNudge = useRef(0);
  const deadline = useRef(0);
  const pos = results.length;
  const finished = pos >= order.length;

  // Records the result for sign `at` only if it's still the current one, so a late "correct"
  // (the camera reports ~0.65s after recognising) can't land on the next sign.
  const settle = (at: number, reason: "correct" | "timeout" | "skip") => {
    if (resultsRef.current.length !== at) return;
    resultsRef.current = [...resultsRef.current, reason === "correct"];
    setResults(resultsRef.current);
    const now = Date.now();
    setFeedback({ at: now, label: order[at].label, reason });
    setTimeout(() => setFeedback((current) => (current?.at === now ? null : current)), FEEDBACK_MS);
    deadline.current = now + FEEDBACK_MS + WINDOW_MS;
    setLeft(WINDOW_MS);
  };

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      const remaining = deadline.current - Date.now();
      setLeft(Math.min(WINDOW_MS, Math.max(0, remaining)));
      if (remaining <= 0) settle(resultsRef.current.length, "timeout");
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the tick reads refs; restarting it every render would reset the 200ms cadence
  }, [started, finished]);

  const start = () => {
    deadline.current = Date.now() + WINDOW_MS;
    setLeft(WINDOW_MS);
    setStarted(true);
  };
  const restart = () => {
    resultsRef.current = [];
    setResults([]);
    setFeedback(null);
    setOrder(shuffle(prompts));
    setStarted(false);
  };

  const score = results.filter(Boolean).length;
  return {
    order,
    results,
    pos,
    prompt: order[pos],
    started,
    finished,
    left,
    fraction: left / WINDOW_MS,
    score,
    passed: score >= Math.ceil(order.length * PASS),
    needed: Math.ceil(order.length * PASS),
    start,
    restart,
    feedback,
    nudging: nudgeAt > 0,
    correct: () => settle(pos, "correct"),
    skip: () => settle(pos, "skip"),
    // A wrong reading only shows a gentle hint, never counts as a miss.
    wrong: () => {
      const now = Date.now();
      if (feedback || now - lastNudge.current < NUDGE_COOLDOWN_MS) return;
      lastNudge.current = now;
      setNudgeAt(now);
      setTimeout(() => setNudgeAt((current) => (current === now ? 0 : current)), NUDGE_MS);
    },
  };
}
type Test = ReturnType<typeof useSignTest>;

const timerColor = (fraction: number) => (fraction > 0.5 ? "#58CC02" : fraction > 0.2 ? "#FF9600" : "#FF4B4B");
const seconds = (ms: number) => Math.ceil(ms / 1000);

function Camera({ test, title }: { test: Test; title: string }) {
  return (
    <div className="min-h-0 rounded-3xl border-4 border-[#E11D48] bg-white p-1.5 shadow-[0_6px_0_#0000001a] max-md:flex-1 sm:p-2">
      <PracticeCamera category={categorySlug(title)} targetLabel={test.prompt?.modelClass} onCorrect={test.correct} onWrong={test.wrong} fillOnPhone quietWrong />
    </div>
  );
}

function SkipButton({ test }: { test: Test }) {
  return (
    <ElevatedButton text="SKIP" icon={SkipForward} iconPosition="right" variant="secondary" size="sm" className="min-h-11 shrink-0" onClick={test.skip} />
  );
}

/* Covers the ring for a moment after each sign: a big green "Great job!" or a calm "Time's up". */
function SignFeedback({ test }: { test: Test }) {
  const fb = test.feedback;
  if (!fb) return null;
  const ok = fb.reason === "correct";
  return (
    <div key={fb.at} role="status" className={cn("st-feedback absolute inset-0 flex flex-col items-center justify-center rounded-full px-3 text-center", ok ? "bg-[#58CC02] text-white" : "bg-[#FF9600] text-white")}>
      {ok && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }, (_, i) => (
            <Star key={i} className="st-spark absolute top-1/2 left-1/2 size-5 fill-[#FFC145] text-[#FFC145]" style={{ "--a": `${i * 45}deg` } as CSSProperties} />
          ))}
        </span>
      )}
      {ok ? <Check className="st-tick size-14 sm:size-16" strokeWidth={4} /> : <Timer className="size-12 sm:size-14" strokeWidth={3} />}
      <p className="mt-1 text-lg leading-tight font-black sm:text-xl">{ok ? "Great job!" : fb.reason === "skip" ? "Skipped" : "Time's up!"}</p>
      <p className="text-xs leading-tight font-bold uppercase opacity-90 sm:text-sm">{ok ? fb.label : `We'll practise ${fb.label} after`}</p>
    </div>
  );
}

/* ── Variant 1 · ring timer ───────────────────────────── */
function FocusTest({ test, title }: { test: Test; title: string }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <>
      <ol aria-label="Signs" className="flex shrink-0 flex-wrap justify-center gap-1.5">
        {test.order.map((p, i) => (
          <li
            key={p.label}
            className={cn(
              "flex size-5 items-center justify-center rounded-full",
              i < test.pos ? (test.results[i] ? "bg-[#58CC02] text-white" : "bg-[#AFAFAF] text-white") : i === test.pos ? "ls-pulse bg-hudyat-gold" : "bg-[#E5E5E5]",
              i === test.pos - 1 && "ls-pop",
            )}
            style={{ "--ring": "#FFC14588" } as CSSProperties}
          >
            {i < test.pos && (test.results[i] ? <Check className="size-3.5" strokeWidth={4} /> : <X className="size-3.5" strokeWidth={4} />)}
          </li>
        ))}
      </ol>
      <div className="relative flex shrink-0 items-center justify-center gap-4">
        <div className={cn("relative size-36 shrink-0 sm:size-44", test.nudging && "st-shake")}>
          <svg aria-hidden="true" viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx={60} cy={60} r={R} fill="#fff" stroke="#F2F2F2" strokeWidth={10} />
            <circle cx={60} cy={60} r={R} fill="none" stroke={timerColor(test.fraction)} strokeWidth={10} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - test.fraction)} className="transition-[stroke-dashoffset,stroke] duration-200 ease-linear" />
          </svg>
          <div key={test.pos} className="ls-pop absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            <p className={cn("leading-none font-black text-[#3C3C3C] uppercase", test.prompt.label.length <= 2 ? "text-6xl" : "text-xl sm:text-2xl")}>{test.prompt.label}</p>
            <p className="mt-1 text-sm font-bold text-[#6B6B6B]">{seconds(test.left)}s</p>
          </div>
          <SignFeedback test={test} />
        </div>
        <SkipButton test={test} />
        {/* "Not yet": gentle, never a miss, no sound */}
        {test.nudging && !test.feedback && (
          <p role="status" className="st-nudge absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-sm font-black whitespace-nowrap text-[#92400E] shadow-[0_3px_0_#0000001a]">
            <Hand aria-hidden="true" className="st-wiggle size-4" /> Not yet, keep signing!
          </p>
        )}
      </div>
      <Camera test={test} title={title} />
    </>
  );
}

/* ── Variant 2 · world trail ──────────────────────────── */
function TrailTest({ test, title }: { test: Test; title: string }) {
  const color = CATEGORIES.find((c) => c.title === title)?.color ?? "blue";
  const size = 5;
  const start = Math.max(0, Math.min(test.pos - 2, test.order.length - size));
  const shown = test.order.slice(start, start + size);
  const x = (i: number) => (shown.length === 1 ? 50 : 10 + ((i - start) / (shown.length - 1)) * 80);
  return (
    <>
      <section className="relative h-32 shrink-0 overflow-hidden rounded-3xl border-4 border-white shadow-[0_6px_0_#0000000d] sm:h-40">
        <div className="ls-mood-watch absolute inset-0">
          <LessonStage title={title} color={color} className="!h-full [&>span.lc-shadow]:hidden [&>svg]:hidden" />
        </div>
        {shown.map((p, o) => {
          const i = start + o;
          const done = i < test.pos;
          return (
            <span
              key={p.label}
              className={cn(
                "absolute top-[70%] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-xs font-black",
                done ? (test.results[i] ? "bg-[#58CC02] text-white" : "bg-[#AFAFAF] text-white") : i === test.pos ? "bg-white" : "bg-white/60",
              )}
              style={{ left: `${x(i)}%` }}
            >
              {done ? (test.results[i] ? <Star className="size-4 fill-white" /> : <X className="size-4" strokeWidth={4} />) : "?"}
            </span>
          );
        })}
        <div aria-hidden="true" className="absolute top-[70%] w-14 -translate-x-1/2 -translate-y-[115%] transition-[left] duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] sm:w-16" style={{ left: `${x(test.pos)}%` }}>
          <LessonCharacter title={title} color={color} className="aspect-square h-auto w-full" />
        </div>
        <p key={test.pos} className="ls-pop absolute top-2 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-1.5 text-2xl font-black whitespace-nowrap text-[#3C3C3C] uppercase shadow-[0_4px_0_#0000001a]">
          {test.prompt.label}
        </p>
      </section>
      <div className="flex shrink-0 items-center gap-3">
        <div className="h-5 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
          <div className="h-full rounded-full transition-[width,background-color] duration-200 ease-linear" style={{ width: `${test.fraction * 100}%`, background: timerColor(test.fraction) }} />
        </div>
        <span className="w-10 text-right text-lg font-black text-[#3C3C3C] tabular-nums">{seconds(test.left)}s</span>
        <SkipButton test={test} />
      </div>
      <Camera test={test} title={title} />
    </>
  );
}

/* ── Variant 3 · card deck ────────────────────────────── */
function CardsTest({ test, title }: { test: Test; title: string }) {
  const missed = test.results.filter((ok) => !ok).length;
  const lastOk = test.results.at(-1);
  return (
    <>
      <div className="relative flex shrink-0 items-center justify-center pt-2">
        {/* deck depth */}
        <span aria-hidden="true" className="absolute h-32 w-52 translate-x-2 translate-y-2 rotate-3 rounded-3xl bg-[#FDE68A] sm:h-36 sm:w-60" />
        <span aria-hidden="true" className="absolute h-32 w-52 translate-x-1 translate-y-1 -rotate-2 rounded-3xl bg-[#FCD34D] sm:h-36 sm:w-60" />
        <div key={test.pos} className="st-deal relative flex h-32 w-52 flex-col items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-[0_6px_0_#0000001a] sm:h-36 sm:w-60">
          <p className={cn("font-black text-[#3C3C3C] uppercase", test.prompt.label.length <= 2 ? "text-6xl" : "px-3 text-center text-2xl")}>{test.prompt.label}</p>
          <div className="absolute inset-x-0 bottom-0 h-2 bg-[#F2F2F2]">
            <div className="h-full transition-[width,background-color] duration-200 ease-linear" style={{ width: `${test.fraction * 100}%`, background: timerColor(test.fraction) }} />
          </div>
        </div>
        {/* the card that was just answered flies off: a star for correct, to the pile for missed */}
        {test.pos > 0 && (
          <span key={`gone-${test.pos}`} aria-hidden="true" className={cn("absolute flex size-16 items-center justify-center rounded-2xl", lastOk ? "st-star bg-[#58CC02]" : "st-pile bg-[#AFAFAF]")}>
            {lastOk ? <Star className="size-9 fill-white text-white" /> : <X className="size-9 text-white" strokeWidth={4} />}
          </span>
        )}
        <span className="absolute top-0 right-0 flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-sm font-black text-[#6B6B6B] shadow-[0_3px_0_#0000001a]" title="Signs to review">
          <RotateCcw aria-hidden="true" className="size-4" /> {missed}
        </span>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-base font-black text-[#3C3C3C]">
          Card {test.pos + 1} of {test.order.length} · <span className="tabular-nums">{seconds(test.left)}s</span>
        </p>
        <SkipButton test={test} />
      </div>
      <Camera test={test} title={title} />
    </>
  );
}

/* ── Intro + end screens (shared) ─────────────────────── */
function Intro({ test, title }: { test: Test; title: string }) {
  return (
    <div className="ls-pop mx-auto mt-6 max-w-md rounded-3xl border-4 border-hudyat-gold bg-white p-6 text-center shadow-[0_6px_0_#0000001a]">
      <p className="text-sm font-extrabold tracking-widest text-[#B87800] uppercase">Sign test · {title}</p>
      <h1 className="mt-2 text-3xl font-black text-[#3C3C3C]">Sign from memory!</h1>
      <ul className="mt-4 space-y-2 text-left text-lg font-semibold text-[#3C3C3C]">
        <li className="flex gap-3"><Hand aria-hidden="true" className="size-6 shrink-0 text-[#1CB0F6]" /> You'll see only the word. No pictures, no videos.</li>
        <li className="flex gap-3"><Timer aria-hidden="true" className="size-6 shrink-0 text-[#FF9600]" /> You have {WINDOW_MS / 1000} seconds for each sign.</li>
        <li className="flex gap-3"><Star aria-hidden="true" className="size-6 shrink-0 fill-hudyat-gold text-hudyat-gold" /> Sign {test.needed} of {test.order.length} to pass.</li>
      </ul>
      <ElevatedButton text="I'M READY" icon={ArrowRight} iconPosition="right" size="lg" className="mt-6 min-h-14 w-full" onClick={test.start} />
    </div>
  );
}

function Results({ test, title }: { test: Test; title: string }) {
  const navigate = useNavigate();
  const missed = test.order.filter((_, i) => !test.results[i]);
  const [open, setOpen] = useState(missed[0]?.label);
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 overflow-y-auto pb-4">
      {test.passed && <Celebration label={title} durationMs={2600} />}
      <div className="ls-pop rounded-3xl border-4 bg-white p-6 text-center shadow-[0_6px_0_#0000001a]" style={{ borderColor: test.passed ? "#58CC02" : "#FF9600" }}>
        <p className="text-6xl font-black text-[#3C3C3C]">
          {test.score}<span className="text-3xl text-[#AFAFAF]">/{test.order.length}</span>
        </p>
        <h1 className="mt-2 text-2xl font-black" style={{ color: test.passed ? "#3F8F00" : "#C2410C" }}>
          {test.passed ? "You passed! ★" : `Almost! Sign ${test.needed} to pass.`}
        </h1>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ElevatedButton text="TRY AGAIN" icon={RotateCcw} size="lg" variant={test.passed ? "secondary" : "primary"} className="min-h-14 flex-1" onClick={test.restart} />
          <ElevatedButton text="DONE" icon={Check} size="lg" variant={test.passed ? "primary" : "secondary"} className="min-h-14 flex-1" onClick={() => navigate("/student/assessment")} />
        </div>
      </div>
      {missed.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-[0_4px_0_#0000000f]">
          <h2 className="text-lg font-black text-[#3C3C3C]">Let's look at these again</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {missed.map((p) => (
              <button key={p.label} type="button" aria-pressed={open === p.label} onClick={() => setOpen(p.label)} className={cn("min-h-11 rounded-2xl border-b-4 px-3 font-black uppercase", open === p.label ? "border-[#B87800] bg-hudyat-gold" : "border-[#E5E5E5] bg-[#F7F7F7]")}>
                {p.label}
              </button>
            ))}
          </div>
          {missed.filter((p) => p.label === open).map((p) => (
            <div key={p.label} className="mt-3">
              <HowCard prompt={p} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

const SCREENS = { "sign-focus": FocusTest, "sign-trail": TrailTest, "sign-cards": CardsTest } as const;

function Runner({ variant, title, prompts }: { variant: string; title: string; prompts: LessonPrompt[] }) {
  const navigate = useNavigate();
  usePreloadRecognition(categorySlug(title));
  const test = useSignTest(prompts);
  const Screen = SCREENS[variant as keyof typeof SCREENS];
  return (
    <div className="flex min-h-dvh flex-col bg-[#FFF8E7] font-body max-md:h-dvh">
      <header className="flex shrink-0 items-center gap-3 px-3 py-2 sm:px-6">
        <button type="button" aria-label="Leave the sign test" onClick={() => navigate("/student/assessment")} className="flex size-11 items-center justify-center rounded-2xl text-[#AFAFAF] hover:bg-black/5">
          <X className="size-7" strokeWidth={3} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
          <div className="h-full rounded-full bg-[#58CC02] transition-[width] duration-500" style={{ width: `${(test.pos / test.order.length) * 100}%` }} />
        </div>
        <span className="text-sm font-black text-[#6B6B6B] tabular-nums">{Math.min(test.pos + 1, test.order.length)}/{test.order.length}</span>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:px-6">
        {!test.started ? <Intro test={test} title={title} /> : test.finished ? <Results test={test} title={title} /> : <Screen test={test} title={title} />}
      </main>
      <style>{`
        @keyframes st-deal { from { transform: translateY(-30px) rotate(-8deg) scale(.9); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes st-star { 0% { transform: scale(.6) rotate(0); opacity: 1 } 60% { transform: translate(0,-50px) scale(1.2) rotate(15deg); opacity: 1 } 100% { transform: translate(0,-90px) scale(.6); opacity: 0 } }
        @keyframes st-pile { 0% { transform: scale(1); opacity: 1 } 100% { transform: translate(140px,-50px) scale(.3) rotate(25deg); opacity: 0 } }
        @keyframes st-feedback { 0% { transform: scale(.4); opacity: 0 } 18% { transform: scale(1.08); opacity: 1 } 28%, 85% { transform: scale(1); opacity: 1 } 100% { transform: scale(.95); opacity: 0 } }
        @keyframes st-tick { 0% { transform: scale(0) rotate(-30deg) } 60% { transform: scale(1.25) rotate(8deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes st-spark { 0% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.4); opacity: 1 } 100% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(-95px) scale(1); opacity: 0 } }
        @keyframes st-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-5px) } 40% { transform: translateX(5px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(3px) } }
        @keyframes st-nudge { 0% { transform: translate(-50%, 8px); opacity: 0 } 15%, 80% { transform: translate(-50%, 0); opacity: 1 } 100% { transform: translate(-50%, 0); opacity: 0 } }
        @keyframes st-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-18deg) } 75% { transform: rotate(18deg) } }
        .st-feedback { animation: st-feedback 1.3s ease-out both }
        @media (prefers-reduced-motion: no-preference) {
          .st-tick { animation: st-tick .5s cubic-bezier(.34,1.56,.64,1) both }
          .st-spark { animation: st-spark .9s ease-out both }
          .st-shake { animation: st-shake .45s ease-in-out }
          .st-nudge { animation: st-nudge 1.4s ease-out both }
          .st-wiggle { animation: st-wiggle .5s ease-in-out 2 }
          .st-deal { animation: st-deal .4s cubic-bezier(.2,.8,.3,1) both }
          .st-star { animation: st-star .9s ease-out both }
          .st-pile { animation: st-pile .7s ease-in both }
        }
        @media (prefers-reduced-motion: reduce) { .st-star, .st-pile { display: none } }
      `}</style>
    </div>
  );
}

export function SignTestPrototype({ variant, categoryId }: { variant: string; categoryId?: string }) {
  const navigate = useNavigate();
  const lesson = useCategoryLesson(categoryId);
  const title = lesson.data?.category?.name;
  const prompts: LessonPrompt[] =
    lesson.data?.categoryGestures.map((item) => ({
      label: item.gesture.label,
      modelClass: item.gesture.modelClass,
      referenceImageUrl: item.gesture.referenceImageUrl ?? undefined,
      referenceVideoUrl: item.gesture.referenceVideoUrl ?? undefined,
    })) ?? [];

  if (lesson.isLoading) return <p className="p-10 text-center font-body text-muted-foreground" role="status">Loading sign test...</p>;
  if (!title || !prompts.length || !MODEL_LESSONS.has(categorySlug(title))) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FFF8E7] p-4 font-body">
        <div className="max-w-sm rounded-3xl border-4 border-[#E5E5E5] bg-white p-6 text-center">
          <p className="text-2xl font-black text-[#3C3C3C]">Sign test coming soon</p>
          <p className="mt-2 text-base font-semibold text-[#6B6B6B]">{title ?? "This lesson"} can't check signs with the camera yet.</p>
          <ElevatedButton text="BACK" variant="secondary" className="mt-5 min-h-12 w-full" onClick={() => navigate("/student/assessment")} />
        </div>
      </div>
    );
  }
  return <Runner key={variant} variant={variant} title={title} prompts={prompts} />;
}
