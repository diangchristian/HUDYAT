/*
 * The Sign test: after passing a lesson's quiz, the child signs every sign of the lesson from memory
 * (the word only, no photo or video) while the camera checks it. Passing it after the quiz completes
 * the lesson and unlocks the next one.
 * Rules: random order, 30 s per sign, any correct reading passes, wrong readings only show a gentle
 * "not yet" (never a miss), time out or Skip is a miss, 80% passes. Each finished go is saved and
 * the quiz page shows the best one; teachers see it on the student's page.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Hand, SkipForward, Star, Timer, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import PracticeCamera from "@/components/common/practice-camera";
import QuizSummary from "@/components/common/quiz-summary";
import ElevatedButton from "@/components/ui/elavated-button";
import { usePreloadRecognition } from "@/features/fsl-recognition/preload";
import { useAssessmentList } from "@/hooks/use-assessment-list";
import { useCategoryLesson } from "@/hooks/use-category-lesson";
import { useSubmitSignTest } from "@/hooks/use-submit-sign-test";
import { categorySlug } from "@/lib/practice";
import { cn } from "@/lib/utils";

import type { LessonPrompt } from "./category-learn/learn-session";
import { HowCard } from "./category-learn/step-cards";
import "./category-learn/learn-session.css";
import "./sign-test.css";

type SignPrompt = LessonPrompt & { id: string };

const WINDOW_MS = 30_000;
const PASS = 0.8; // same rule as the server (utils/passing.ts)
const FEEDBACK_MS = 1300; // the "correct" / "time's up" moment; the next sign's 30 s start after it
// The camera confirms a correct sign 650 ms after showing it; wait that long past 0 s before a timeout.
const CORRECT_GRACE_MS = 700;
const TICK_MS = 200;
const NUDGE_MS = 1400;
const NUDGE_COOLDOWN_MS = 2600; // "not yet" at most this often, so a moving hand doesn't flicker it

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

/* ── The test, in memory until a go is finished ── */
function useSignTest(prompts: SignPrompt[]) {
  const [order, setOrder] = useState(() => shuffle(prompts));
  const [results, setResults] = useState<boolean[]>([]);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(WINDOW_MS);
  const [feedback, setFeedback] = useState<{ at: number; label: string; reason: "correct" | "timeout" | "skip" } | null>(null);
  const [nudgeAt, setNudgeAt] = useState(0);
  const resultsRef = useRef<boolean[]>([]);
  const lastNudge = useRef(0);
  const lastSettle = useRef(0);
  const deadline = useRef(0);
  // The clock only runs while the camera is checking signs (not while it asks for permission or loads).
  const cameraOn = useRef(false);
  const pos = results.length;
  // After the last sign, its "Great job!" / "Time's up" still shows before the results.
  const finished = pos >= order.length && !feedback;

  // Records the result for sign `at` only if it's still the current one, so a late "correct"
  // (the camera reports ~0.65 s after recognising) can't land on the next sign.
  const settle = (at: number, reason: "correct" | "timeout" | "skip") => {
    if (resultsRef.current.length !== at || at >= order.length) return;
    resultsRef.current = [...resultsRef.current, reason === "correct"];
    setResults(resultsRef.current);
    const now = Date.now();
    lastSettle.current = now;
    setFeedback({ at: now, label: order[at]!.label, reason });
    setTimeout(() => setFeedback((current) => (current?.at === now ? null : current)), FEEDBACK_MS);
    deadline.current = now + FEEDBACK_MS + WINDOW_MS;
    setLeft(WINDOW_MS);
  };

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      if (!cameraOn.current) {
        deadline.current += TICK_MS; // paused: the time left stays the same
        return;
      }
      const remaining = deadline.current - Date.now();
      setLeft(Math.min(WINDOW_MS, Math.max(0, remaining)));
      if (remaining <= -CORRECT_GRACE_MS) settle(resultsRef.current.length, "timeout");
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the tick reads refs; restarting it every render would reset the 200ms cadence
  }, [started, finished]);

  const score = results.filter(Boolean).length;
  const needed = Math.ceil(order.length * PASS);
  return {
    order,
    results,
    pos,
    started,
    finished,
    left,
    fraction: left / WINDOW_MS,
    score,
    needed,
    passed: score >= needed,
    feedback,
    nudging: nudgeAt > 0,
    start: () => {
      deadline.current = Date.now() + WINDOW_MS;
      setLeft(WINDOW_MS);
      setStarted(true);
    },
    restart: () => {
      resultsRef.current = [];
      setResults([]);
      setFeedback(null);
      setOrder(shuffle(prompts));
      setStarted(false);
    },
    correct: () => settle(pos, "correct"),
    skip: () => settle(pos, "skip"),
    setCameraOn: (on: boolean) => {
      cameraOn.current = on;
    },
    // A wrong reading only shows a gentle hint, never counts as a miss, and never over a result.
    // (Refs, not state: the camera may call an older copy of this function.)
    wrong: () => {
      const now = Date.now();
      if (now - lastSettle.current < FEEDBACK_MS || now - lastNudge.current < NUDGE_COOLDOWN_MS) return;
      lastNudge.current = now;
      setNudgeAt(now);
      setTimeout(() => setNudgeAt((current) => (current === now ? 0 : current)), NUDGE_MS);
    },
  };
}
type Test = ReturnType<typeof useSignTest>;

const timerColor = (fraction: number) => (fraction > 0.5 ? "#58CC02" : fraction > 0.2 ? "#FF9600" : "#FF4B4B");
const seconds = (ms: number) => Math.ceil(ms / 1000);

/* Covers the ring for a moment after each sign: a big green "Great job!" or a calm "Time's up". */
function SignFeedback({ test }: { test: Test }) {
  const fb = test.feedback;
  if (!fb) return null;
  const ok = fb.reason === "correct";
  return (
    <div key={fb.at} role="status" className={cn("st-feedback absolute inset-0 flex flex-col items-center justify-center rounded-full px-3 text-center text-white", ok ? "bg-[#58CC02]" : "bg-[#FF9600]")}>
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

/* One giant word inside a draining ring timer, progress dots on top, the camera below. */
function RingTimer({ test, title }: { test: Test; title: string }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  // The last sign stays on screen while its result shows.
  const prompt = test.order[Math.min(test.pos, test.order.length - 1)]!;
  return (
    <>
      <ol aria-label="Signs" className="flex shrink-0 flex-wrap justify-center gap-1.5">
        {test.order.map((p, i) => (
          <li
            key={p.id}
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
            <p className={cn("leading-none font-black text-[#3C3C3C] uppercase", prompt.label.length <= 2 ? "text-6xl" : "text-xl sm:text-2xl")}>{prompt.label}</p>
            <p className="mt-1 text-sm font-bold text-[#6B6B6B]">{seconds(test.left)}s</p>
          </div>
          <SignFeedback test={test} />
        </div>
        <ElevatedButton text="SKIP" icon={SkipForward} iconPosition="right" variant="secondary" size="sm" className="min-h-11 shrink-0" onClick={test.skip} />
        {/* "Not yet": gentle, never a miss, no sound */}
        {test.nudging && !test.feedback && (
          <p role="status" className="st-nudge absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-sm font-black whitespace-nowrap text-[#92400E] shadow-[0_3px_0_#0000001a]">
            <Hand aria-hidden="true" className="st-wiggle size-4" /> Not yet, keep signing!
          </p>
        )}
      </div>
      <div className="min-h-0 rounded-3xl border-4 border-[#E11D48] bg-white p-1.5 shadow-[0_6px_0_#0000001a] max-md:flex-1 sm:p-2">
        <PracticeCamera category={categorySlug(title)} targetLabel={prompt.modelClass} onCorrect={test.correct} onWrong={test.wrong} onRunningChange={test.setCameraOn} fillOnPhone quietWrong />
      </div>
    </>
  );
}

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

function Results({ test, title, categoryId }: { test: Test; title: string; categoryId: string }) {
  const navigate = useNavigate();
  const save = useSubmitSignTest(categoryId);
  const missed = test.order.filter((_, i) => !test.results[i]);
  const [open, setOpen] = useState(missed[0]?.id);
  const send = () => save.mutate(missed.map((sign) => sign.id));
  // Saved once per finished go; the ref survives React's dev double-run of effects.
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when this go's results appear
  }, []);

  const result = save.data;

  // The result shown is the saved one (the server scores the go), so wait for it.
  if (!result) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FFF8E7] p-4 font-body">
        {save.isError ? (
          <div role="alert" className="max-w-sm rounded-3xl border-4 border-[#E5E5E5] bg-white p-6 text-center">
            <p className="text-2xl font-black text-[#3C3C3C]">We couldn't save this go</p>
            <p className="mt-2 text-base font-semibold text-[#6B6B6B]">Your signs are still here. Try saving them again.</p>
            <ElevatedButton text="SAVE AGAIN" size="lg" className="mt-5 min-h-12 w-full" onClick={send} />
            <ElevatedButton text="BACK" variant="secondary" className="mt-3 min-h-12 w-full" onClick={() => navigate("/student/assessment")} />
          </div>
        ) : (
          <p role="status" className="text-lg font-bold text-[#6B6B6B]">Saving your signs...</p>
        )}
      </div>
    );
  }

  // The quiz's result screen, so both tests end the same way; what to practise sits under it.
  return (
    <QuizSummary
      testName="Sign test"
      score={result.score}
      totalItems={result.total}
      passed={result.passed}
      // A passed Sign test completes the lesson (its quiz was passed to get here).
      nextStep="next-lesson"
      passingPercent={PASS * 100}
      lessonName={title}
      // The Learn page shows the newly unlocked lesson as the current one.
      onNext={() => navigate("/student/learn")}
      onRetry={test.restart}
      onReviewLesson={() => navigate(`/student/learn/${categoryId}`)}
      onLeave={() => navigate("/student/assessment")}
    >
      {missed.length > 0 && (
        <section className="mt-6 w-full rounded-3xl bg-white p-4 text-left shadow-[0_4px_0_#0000000f]">
          <h2 className="text-lg font-black text-[#3C3C3C]">Let's look at these again</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {missed.map((sign) => (
              <button key={sign.id} type="button" aria-pressed={open === sign.id} onClick={() => setOpen(sign.id)} className={cn("min-h-11 rounded-2xl border-b-4 px-3 font-black uppercase", open === sign.id ? "border-[#B87800] bg-hudyat-gold" : "border-[#E5E5E5] bg-[#F7F7F7]")}>
                {sign.label}
              </button>
            ))}
          </div>
          {missed.filter((sign) => sign.id === open).map((sign) => (
            <div key={sign.id} className="mt-3">
              <HowCard prompt={sign} />
            </div>
          ))}
        </section>
      )}
    </QuizSummary>
  );
}

function Runner({ categoryId, title, prompts }: { categoryId: string; title: string; prompts: SignPrompt[] }) {
  const navigate = useNavigate();
  usePreloadRecognition(categorySlug(title));
  const test = useSignTest(prompts);
  // TRY AGAIN goes back to the intro, so each finished go mounts Results (and saves) afresh.
  if (test.started && test.finished) return <Results test={test} title={title} categoryId={categoryId} />;
  return (
    <div className="flex min-h-dvh flex-col bg-[#FFF8E7] font-body max-md:h-dvh">
      <header className="flex shrink-0 items-center gap-3 px-3 py-2 sm:px-6">
        <button type="button" aria-label="Leave the sign test" onClick={() => navigate("/student/assessment")} className="flex size-11 items-center justify-center rounded-2xl text-[#AFAFAF] hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none">
          <X className="size-7" strokeWidth={3} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
          <div className="h-full rounded-full bg-[#58CC02] transition-[width] duration-500" style={{ width: `${(test.pos / test.order.length) * 100}%` }} />
        </div>
        <span className="text-sm font-black text-[#6B6B6B] tabular-nums">{Math.min(test.pos + 1, test.order.length)}/{test.order.length}</span>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-3 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:px-6">
        {!test.started ? <Intro test={test} title={title} /> : <RingTimer test={test} title={title} />}
      </main>
    </div>
  );
}

function NotReady({ title, message }: { title: string; message: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FFF8E7] p-4 font-body">
      <div className="max-w-sm rounded-3xl border-4 border-[#E5E5E5] bg-white p-6 text-center">
        <p className="text-2xl font-black text-[#3C3C3C]">{title}</p>
        <p className="mt-2 text-base font-semibold text-[#6B6B6B]">{message}</p>
        <ElevatedButton text="BACK" variant="secondary" className="mt-5 min-h-12 w-full" onClick={() => navigate("/student/assessment")} />
      </div>
    </div>
  );
}

export default function SignTestPage() {
  const { categoryId = "" } = useParams();
  const lesson = useCategoryLesson(categoryId);
  const list = useAssessmentList();

  if (lesson.isLoading || list.isLoading) {
    return <p className="p-10 text-center font-body text-muted-foreground" role="status">Loading sign test...</p>;
  }
  const title = lesson.data?.category?.name;
  const quiz = list.data?.learningAreas
    .flatMap((area) => area.categories)
    .find((category) => category.categoryId === categoryId);
  const prompts: SignPrompt[] =
    lesson.data?.categoryGestures.map((item) => ({
      id: item.gesture.id,
      label: item.gesture.label,
      modelClass: item.gesture.modelClass,
      referenceImageUrl: item.gesture.referenceImageUrl ?? undefined,
      referenceVideoUrl: item.gesture.referenceVideoUrl ?? undefined,
    })) ?? [];

  if (lesson.error || list.error || !title || !prompts.length) {
    return <NotReady title="Sign test unavailable" message="We couldn't load this sign test right now." />;
  }
  if (!quiz?.signTest.available) {
    return quiz?.status === "completed" ? (
      <NotReady title="Coming soon" message={`The camera can't check ${title} signs yet.`} />
    ) : (
      <NotReady title="Not yet!" message={`Pass the ${title} quiz first, then come back for the Sign test.`} />
    );
  }
  return <Runner categoryId={categoryId} title={title} prompts={prompts} />;
}
