/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me. Question: how should a lesson's assessment card hold TWO tests (multiple-
 * choice Quiz + Sign test) so a child can pick either, and come back to the other when ready?
 * Settled in grilling: one card per lesson, a row per test, both open once the lesson is finished
 * (any order), card status "N of M passed", lessons without a model show "Sign test · coming soon"
 * (not blocking), unlimited Sign test tries with best score, and a "Ready for you" row of waiting tests.
 *   tests-rows  · two stacked rows under the lesson world, each with its own button
 *   tests-split · the card's bottom splits into two big tappable halves
 *   page-rows-lite · page-rows with small calming changes (still worlds, quiet locked cards, fewer words)
 *   page-plus   · the CURRENT cards unchanged, plus a Sign test button under the existing one
 *   page-calm   · whole page beside the Learn page (centred header, grouped by area, no filter); calm cards:
 *                 still worlds, lift on hover, ONE next-step button with a verb, locked says what to finish,
 *                 passed tests as ✓ chips, stars-only badge, star bar for the Sign test best
 *   page-rows   · the CURRENT assessments page (header, filters, grid) with only its cards swapped for test-rows
 * Quiz data is real. Sign test results are STAND-INS (nothing saves them yet): spread over the
 * model lessons as not started / best 6 of 10 / passed, so every card state shows.
 */
import { useState } from "react";
import { Check, ClipboardList, Hand, Lock, Star } from "lucide-react";
import { useNavigate } from "react-router";

import type { AssessmentListCategory } from "@/api/assessment-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import { PALETTE } from "@/components/common/learn-card/characters";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import { categorySlug } from "@/lib/practice";
import { cn } from "@/lib/utils";

import { MODEL_LESSONS } from "./sign-test-prototype";

export const CARD_VARIANTS = [
  { key: "page-rows-lite", name: "Current page · test rows, lighter" },
  { key: "page-plus", name: "Current cards + Sign test button" },
  { key: "page-calm", name: "Calm page · Learn-style header, calm cards" },
  { key: "page-rows", name: "Current page · test-rows cards" },
  { key: "tests-rows", name: "Assessment card · test rows" },
  { key: "tests-split", name: "Assessment card · split halves" },
];
export const isCardVariant = (v: string | null) => CARD_VARIANTS.some((item) => item.key === v);

type TestState = "locked" | "ready" | "tried" | "passed" | "soon";
type TestInfo = { kind: "quiz" | "sign"; state: TestState; detail: string; action: string; path?: string; best?: number; total?: number; need?: number };

const SIGN_PASS = 8;
const SIGN_TOTAL = 10;

function quizInfo(c: AssessmentListCategory): TestInfo {
  const path = `/student/assessment/${c.categoryId}`;
  if (!c.isUnlocked) return { kind: "quiz", state: "locked", detail: "Finish the lesson first", action: "Locked" };
  const score = c.latestAttempt ? `${Math.round(Number(c.latestAttempt.score))}/${Math.round(Number(c.latestAttempt.totalPoints))}` : null;
  if (c.status === "completed") return { kind: "quiz", state: "passed", detail: score ? `Passed · ${score}` : "Passed", action: "Retake", path };
  if (c.attemptCount > 0) return { kind: "quiz", state: "tried", detail: score ? `Last ${score} · try again` : "Try again", action: "Retry", path };
  return { kind: "quiz", state: "ready", detail: `${c.totalQuestions} questions`, action: "Start", path };
}

// STAND-IN results until Sign test attempts are saved.
function signInfo(c: AssessmentListCategory, modelIndex: number): TestInfo {
  if (!MODEL_LESSONS.has(categorySlug(c.categoryName))) return { kind: "sign", state: "soon", detail: "Coming soon", action: "Soon" };
  const path = `/student/assessment/${c.categoryId}?variant=sign-focus`;
  if (!c.isUnlocked) return { kind: "sign", state: "locked", detail: "Finish the lesson first", action: "Locked" };
  const fake = modelIndex % 3;
  if (fake === 0) return { kind: "sign", state: "ready", detail: `Sign ${SIGN_TOTAL} from memory`, action: "Start", path };
  if (fake === 1) return { kind: "sign", state: "tried", detail: `Best 6/${SIGN_TOTAL} · need ${SIGN_PASS}`, action: "Try again", path, best: 6, total: SIGN_TOTAL, need: SIGN_PASS };
  return { kind: "sign", state: "passed", detail: `Passed · 9/${SIGN_TOTAL}`, action: "Practise", path };
}

const TEST_META = {
  // Quiz uses the student primary (gold); gold needs dark text on it, so each test has an ink colour.
  quiz: { label: "Quiz", icon: ClipboardList, color: "var(--primary)", soft: "#FFF4D6", ink: "#3C3C3C", text: "#8A5A00" },
  sign: { label: "Sign test", icon: Hand, color: "#E11D48", soft: "#FFE4E6", ink: "#FFFFFF", text: "#E11D48" },
};

type Lesson = { c: AssessmentListCategory; tests: TestInfo[]; passed: number; required: number };

export function buildLessons(categories: AssessmentListCategory[]): Lesson[] {
  let modelIndex = 0;
  return categories.map((c) => {
    const hasModel = MODEL_LESSONS.has(categorySlug(c.categoryName));
    const tests = [quizInfo(c), signInfo(c, hasModel ? modelIndex++ : 0)];
    const required = tests.filter((t) => t.state !== "soon").length; // coming-soon doesn't block
    return { c, tests, passed: tests.filter((t) => t.state === "passed").length, required };
  });
}

/* ── Card status badge: locked / N of M passed / completed ── */
function Status({ lesson }: { lesson: Lesson }) {
  if (!lesson.c.isUnlocked)
    return <span className="flex items-center gap-1 rounded-full bg-[#E5E5E5] px-2.5 py-1 text-xs font-black text-[#6B6B6B]"><Lock className="size-3.5" /> Locked</span>;
  if (lesson.passed >= lesson.required)
    return <span className="flex items-center gap-1 rounded-full bg-[#58CC02] px-2.5 py-1 text-xs font-black text-white"><Star className="size-3.5 fill-white" /> Completed</span>;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#3C3C3C] shadow-[0_2px_0_#0000001a]">
      {Array.from({ length: lesson.required }, (_, i) => (
        <Star key={i} className={cn("size-3.5", i < lesson.passed ? "fill-hudyat-gold text-hudyat-gold" : "text-[#CECECE]")} />
      ))}
      {lesson.passed} of {lesson.required} passed
    </span>
  );
}

const stateText = (t: TestInfo) => (t.state === "passed" ? "text-[#3F8F00]" : t.state === "tried" ? "text-[#C2410C]" : "text-[#6B6B6B]");

/* ── Variant A · stacked rows ──────────────────────────── */
function TestRow({ test }: { test: TestInfo }) {
  const navigate = useNavigate();
  const meta = TEST_META[test.kind];
  const Icon = meta.icon;
  const off = test.state === "locked" || test.state === "soon";
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border-2 p-2.5", off ? "border-dashed border-[#E5E5E5] opacity-70" : "border-[#F2F2F2]")}>
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.text }}>
        <Icon aria-hidden="true" className="size-6" />
        {test.state === "passed" && <Check className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-[#58CC02] p-0.5 text-white" strokeWidth={4} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-[#3C3C3C]">{meta.label}</p>
        <p className={cn("truncate text-sm font-bold", stateText(test))}>{test.detail}</p>
      </div>
      <button
        type="button"
        disabled={!test.path}
        onClick={() => test.path && navigate(test.path)}
        className={cn(
          "min-h-11 shrink-0 rounded-xl border-b-4 px-3.5 text-sm font-black uppercase active:translate-y-0.5 active:border-b-2 disabled:active:translate-y-0",
          !test.path ? "border-[#E5E5E5] bg-[#F2F2F2] text-[#AFAFAF]" : test.state === "passed" ? "border-[#CECECE] bg-white text-[#4B4B4B]" : "",
        )}
        style={test.path && test.state !== "passed" ? { background: meta.color, color: meta.ink, borderColor: "#0003" } : undefined}
      >
        {test.action}
      </button>
    </div>
  );
}

export function RowsCard({ lesson }: { lesson: Lesson }) {
  const color = CATEGORIES.find((item) => item.title === lesson.c.categoryName)?.color ?? "blue";
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white shadow-[0_5px_0_#E5E5E5]">
      <div className="relative">
        <LessonStage title={lesson.c.categoryName} color={color} asleep={!lesson.c.isUnlocked} className="h-32" />
        <div className="absolute top-2 left-2"><Status lesson={lesson} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h2 className="px-1 text-xl font-black text-[#3C3C3C]">{lesson.c.categoryName}</h2>
        {lesson.tests.map((t) => <TestRow key={t.kind} test={t} />)}
      </div>
    </article>
  );
}

/* ── Variant B · split halves ──────────────────────────── */
function SplitCard({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const color = CATEGORIES.find((item) => item.title === lesson.c.categoryName)?.color ?? "blue";
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white shadow-[0_5px_0_#E5E5E5]">
      <div className="relative">
        <LessonStage title={lesson.c.categoryName} color={color} asleep={!lesson.c.isUnlocked} className="h-32" />
        <div className="absolute top-2 left-2"><Status lesson={lesson} /></div>
        <h2 className="absolute bottom-2 left-2 rounded-xl bg-white/95 px-3 py-1 text-lg font-black text-[#3C3C3C]">{lesson.c.categoryName}</h2>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x-2 divide-[#F2F2F2]">
        {lesson.tests.map((t) => {
          const meta = TEST_META[t.kind];
          const Icon = meta.icon;
          const off = !t.path;
          return (
            <button
              key={t.kind}
              type="button"
              disabled={off}
              onClick={() => t.path && navigate(t.path)}
              className={cn("flex flex-col items-center gap-1.5 px-2 py-4 text-center transition-colors hover:bg-[#FAFAFA] focus-visible:bg-[#FAFAFA] focus-visible:outline-none disabled:hover:bg-transparent", off && "opacity-60")}
            >
              <span className="relative flex size-14 items-center justify-center rounded-2xl" style={{ background: off ? "#F2F2F2" : meta.soft, color: off ? "#AFAFAF" : meta.text }}>
                {t.state === "locked" ? <Lock className="size-6" /> : <Icon className="size-7" />}
                {t.state === "passed" && <Check className="absolute -right-2 -bottom-2 size-6 rounded-full bg-[#58CC02] p-1 text-white" strokeWidth={4} />}
              </span>
              <span className="text-base font-black text-[#3C3C3C]">{meta.label}</span>
              <span className={cn("text-xs leading-tight font-bold", stateText(t))}>{t.detail}</span>
              {!off && (
                <span className="mt-1 rounded-full px-3 py-1 text-xs font-black uppercase" style={t.state === "passed" ? { background: "#AFAFAF", color: "#fff" } : { background: meta.color, color: meta.ink }}>
                  {t.action}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

/* ── "Ready for you": every test still waiting, one tap away ── */
function ReadyForYou({ lessons }: { lessons: Lesson[] }) {
  const navigate = useNavigate();
  const waiting = lessons.flatMap((l) => l.tests.filter((t) => t.path && t.state !== "passed").map((t) => ({ t, name: l.c.categoryName })));
  if (!waiting.length) return null;
  return (
    <section aria-label="Tests ready for you" className="rounded-3xl border-4 border-hudyat-gold/40 bg-[#FFF8E7] p-3">
      <h2 className="px-1 text-lg font-black text-[#3C3C3C]">Ready for you</h2>
      <div className="-mx-3 mt-2 overflow-x-auto px-3 pb-1">
        <ul className="flex w-max gap-2">
          {waiting.map(({ t, name }) => {
            const meta = TEST_META[t.kind];
            const Icon = meta.icon;
            return (
              <li key={`${name}-${t.kind}`}>
                <button type="button" onClick={() => navigate(t.path!)} className="flex min-h-14 items-center gap-2.5 rounded-2xl border-b-4 border-[#E5E5E5] bg-white px-3 py-2 text-left active:translate-y-0.5 active:border-b-2">
                  <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.text }}>
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black whitespace-nowrap text-[#3C3C3C]">{name} · {meta.label}</span>
                    <span className={cn("block text-xs font-bold whitespace-nowrap", stateText(t))}>{t.detail}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const FILTERS = ["All", "Available", "Completed"] as const;

export function AssessmentCardsPrototype({ variant, categories }: { variant: string; categories: AssessmentListCategory[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const lessons = buildLessons(categories);
  const visible = lessons.filter((l) => {
    const done = l.c.isUnlocked && l.passed >= l.required;
    if (filter === "Completed") return done;
    if (filter === "Available") return l.c.isUnlocked && !done; // has a test still to pass
    return true;
  });
  const Card = variant === "tests-split" ? SplitCard : RowsCard;

  return (
    <div className="mx-auto max-w-5xl space-y-5 font-body text-[#111827]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black tracking-tight">Assessments</h1>
        <div className="flex w-fit rounded-full bg-[#e7e9eb] p-1 shadow-inner">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cn("min-h-10 min-w-20 rounded-full px-4 text-sm font-extrabold", filter === f ? "bg-[#ffc145] text-[#5c430b] shadow-[0_2px_3px_rgb(0_0_0/0.12)]" : "text-[#374151]")}>
              {f}
            </button>
          ))}
        </div>
      </header>
      <p className="rounded-xl bg-fuchsia-50 px-3 py-2 text-xs font-bold text-fuchsia-700">PROTOTYPE: Sign test scores here are stand-ins; nothing saves them yet.</p>
      <ReadyForYou lessons={lessons} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((l) => <Card key={l.c.categoryId} lesson={l} />)}
      </div>
    </div>
  );
}

/* ── Variant · calm card (current page, calmer cards) ───── */
// Stars for the Sign test best score, with a flag where the pass mark is.
function StarBar({ best, total, need }: { best: number; total: number; need: number }) {
  return (
    <div role="img" aria-label={`Best ${best} of ${total}, need ${need}`} className="flex items-end justify-center gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="relative flex flex-col items-center">
          {i === need - 1 && <span aria-hidden="true" className="absolute -top-4 text-xs leading-none font-black text-[#C2410C]">▼</span>}
          <Star className={cn("size-4", i < best ? "fill-hudyat-gold text-hudyat-gold" : "text-[#D4D4D4]")} />
        </span>
      ))}
    </div>
  );
}

export function CalmCard({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const color = CATEGORIES.find((item) => item.title === lesson.c.categoryName)?.color ?? "blue";
  const locked = !lesson.c.isUnlocked;
  const done = !locked && lesson.passed >= lesson.required;
  const open = lesson.tests.filter((t) => t.path && t.state !== "passed");
  const [next, ...others] = open;
  const passed = lesson.tests.filter((t) => t.state === "passed");
  const soon = lesson.tests.some((t) => t.state === "soon");

  return (
    <article
      // Same hover as the Learn cards: lifts onto a lesson-coloured edge. Locked cards stay put.
      style={{ "--edge": PALETTE[color].main } as React.CSSProperties}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border-2 bg-white shadow-[0_5px_0_#E5E5E5] transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none",
        done ? "border-[#B7F07A]" : "border-[#E5E5E5]",
        !locked && "hover:-translate-y-1.5 hover:border-(--edge) hover:shadow-[0_10px_0_var(--edge)] focus-within:border-(--edge)",
      )}
    >
      {/* World stays still; it only moves while the card is hovered or focused. */}
      <div className="calm-still relative">
        <LessonStage title={lesson.c.categoryName} color={color} asleep={locked} className="h-28" />
        <span className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1" aria-label={locked ? "Locked" : `${lesson.passed} of ${lesson.required} tests passed`}>
          {locked ? (
            <Lock className="size-4 text-[#6B6B6B]" />
          ) : (
            Array.from({ length: lesson.required }, (_, i) => (
              <Star key={i} className={cn("size-5", i < lesson.passed ? "fill-hudyat-gold text-hudyat-gold" : "text-[#CECECE]")} />
            ))
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className={cn("text-xl font-black", locked ? "text-[#AFAFAF]" : "text-[#3C3C3C]")}>{lesson.c.categoryName}</h2>

        {/* Locked: picture, name, and the one thing to do about it. Everything else: one big next step. */}
        {locked && (
          <p className="flex items-center gap-2 text-base font-bold text-[#8A8A8A]">
            <Lock aria-hidden="true" className="size-4 shrink-0" /> Finish the {lesson.c.categoryName} lesson first
          </p>
        )}
        {!locked && next && (() => {
          const meta = TEST_META[next.kind];
          const Icon = meta.icon;
          return (
            <>
              {next.best !== undefined && next.total && next.need && (
                <div className="pt-3">
                  <StarBar best={next.best} total={next.total} need={next.need} />
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate(next.path!)}
                className="mt-auto flex min-h-14 items-center justify-center gap-2 rounded-2xl border-b-4 text-lg font-black active:translate-y-0.5 active:border-b-2"
                style={{ background: meta.color, color: meta.ink, borderColor: "#0003" }}
              >
                {/* A verb, so the button says what happens: "Start quiz", "Try quiz again". */}
                <Icon aria-hidden="true" className="size-6" /> {next.state === "tried" ? `Try ${meta.label.toLowerCase()} again` : `Start ${meta.label.toLowerCase()}`}
              </button>
            </>
          );
        })()}

        {done && (
          <p className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-[#F1FFE2] py-3 text-lg font-black text-[#3F8F00]">
            <Check className="size-6" strokeWidth={4} /> All done!
          </p>
        )}

        {/* Small chips: the other open test (still free to pick), passed tests (tap to retake), coming soon. */}
        {!locked && (others.length > 0 || passed.length > 0 || soon) && (
          <div className="flex flex-wrap gap-2">
            {others.map((t) => {
              const meta = TEST_META[t.kind];
              const Icon = meta.icon;
              return (
                <button key={t.kind} type="button" onClick={() => navigate(t.path!)} className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 bg-white px-3 text-sm font-black" style={{ borderColor: meta.color, color: meta.text }}>
                  <Icon aria-hidden="true" className="size-4" /> {meta.label}
                </button>
              );
            })}
            {passed.map((t) => {
              const Icon = TEST_META[t.kind].icon;
              return (
                <button key={t.kind} type="button" onClick={() => t.path && navigate(t.path)} aria-label={`${TEST_META[t.kind].label} passed, take again`} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#58CC02] px-3 text-sm font-black text-white">
                  <Check aria-hidden="true" className="size-4" strokeWidth={4} /> <Icon aria-hidden="true" className="size-4" />
                </button>
              );
            })}
            {soon && <span className="flex items-center gap-1 self-center rounded-full bg-[#F2F2F2] px-2 py-1 text-xs font-bold text-[#8A8A8A]"><Hand aria-hidden="true" className="size-3.5" /> soon</span>}
          </div>
        )}
      </div>
      <style>{`.calm-still * { animation-play-state: paused !important } .group:hover .calm-still *, .group:focus-within .calm-still * { animation-play-state: running !important }`}</style>
    </article>
  );
}

/* ── Variant · page-rows, lighter: same design, small calming changes ──
 * 1 (worlds animate freely, as asked)          2 locked cards: one "finish the lesson" line, no rows
 * 3 badge: stars + "1 of 2 passed"             4 status line only when it says something new
 * 5 two verbs: START / TRY AGAIN; passed = green ✓ (tap to retake)
 * 6 "coming soon" row becomes a tiny pill      7 bigger, calmer text (16px names in rows)          */
function LiteRow({ test }: { test: TestInfo }) {
  const navigate = useNavigate();
  const meta = TEST_META[test.kind];
  const Icon = meta.icon;
  const passed = test.state === "passed";
  const detail = test.state === "tried" || passed ? test.detail : null; // "10 questions" etc. adds nothing
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FAFAFA] p-2.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.text }}>
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-[#3C3C3C]">{meta.label}</p>
        {detail && <p className={cn("text-sm font-bold", stateText(test))}>{detail}</p>}
      </div>
      {passed ? (
        <button type="button" onClick={() => test.path && navigate(test.path)} aria-label={`${meta.label} passed, take again`} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white">
          <Check className="size-6" strokeWidth={4} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => test.path && navigate(test.path)}
          className="min-h-11 shrink-0 rounded-xl border-b-4 px-4 text-sm font-black uppercase active:translate-y-0.5 active:border-b-2"
          style={{ background: meta.color, color: meta.ink, borderColor: "#0003" }}
        >
          {test.state === "tried" ? "Try again" : "Start"}
        </button>
      )}
    </div>
  );
}

export function LiteRowsCard({ lesson }: { lesson: Lesson }) {
  const color = CATEGORIES.find((item) => item.title === lesson.c.categoryName)?.color ?? "blue";
  const locked = !lesson.c.isUnlocked;
  const rows = lesson.tests.filter((t) => t.state !== "soon");
  const soon = lesson.tests.some((t) => t.state === "soon");
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white shadow-[0_5px_0_#E5E5E5]">
      <div className="relative">
        <LessonStage title={lesson.c.categoryName} color={color} asleep={locked} className="h-32" />
        <span className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1 text-xs font-black text-[#3C3C3C]">
          {locked ? (
            <><Lock aria-hidden="true" className="size-4 text-[#6B6B6B]" /><span className="ml-1 text-[#6B6B6B]">Locked</span></>
          ) : (
            <>
              {Array.from({ length: lesson.required }, (_, i) => (
                <Star key={i} aria-hidden="true" className={cn("size-5", i < lesson.passed ? "fill-hudyat-gold text-hudyat-gold" : "text-[#CECECE]")} />
              ))}
              <span className="ml-1">{lesson.passed >= lesson.required ? "All passed" : `${lesson.passed} of ${lesson.required} passed`}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className={cn("text-xl font-black", locked ? "text-[#AFAFAF]" : "text-[#3C3C3C]")}>{lesson.c.categoryName}</h2>
          {soon && !locked && <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#F2F2F2] px-2 py-1 text-xs font-bold text-[#8A8A8A]"><Hand aria-hidden="true" className="size-3.5" /> Sign test soon</span>}
        </div>
        {locked ? (
          <p className="flex items-center gap-2 rounded-2xl bg-[#F7F7F7] px-3 py-3 text-base font-bold text-[#6B6B6B]">
            <Lock aria-hidden="true" className="size-5 shrink-0" /> Finish the lesson to unlock
          </p>
        ) : (
          rows.map((t) => <LiteRow key={t.kind} test={t} />)
        )}
      </div>
    </article>
  );
}

/* ── page-calm · the whole page, not just the cards ──
 * Built to sit beside the Learn page: its centred header, lessons grouped by learning area, no
 * All/Available/Completed filter (locked cards already sleep, finished ones show their stars). */
type CalmArea = { id: string; name: string; categories: AssessmentListCategory[] };

export function CalmPage({ areas, loading, failed }: { areas: CalmArea[]; loading: boolean; failed: boolean }) {
  // Built once over every lesson so the stand-in Sign test results stay the same as on the other variants.
  const lessons = new Map(buildLessons(areas.flatMap((a) => a.categories)).map((l) => [l.c.categoryId, l]));
  return (
    <section className="mx-auto w-full max-w-5xl font-body" aria-labelledby="quiz-heading">
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">Quizzes</span>
        <h1 id="quiz-heading" className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">Show what you've learned!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Finish a lesson to unlock its tests.</p>
      </header>
      <p className="mx-auto mt-4 w-fit rounded-xl bg-fuchsia-50 px-3 py-2 text-xs font-bold text-fuchsia-700">PROTOTYPE: Sign test scores here are stand-ins; nothing saves them yet.</p>

      {loading || failed ? (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          {loading ? "Loading your quizzes..." : "We couldn't load your quizzes right now."}
        </p>
      ) : (
        <div className="mt-10">
          {areas.map((area) => (
            <section key={area.id} aria-labelledby={`quiz-area-${area.id}`} className="mb-12 last:mb-0">
              <h2 id={`quiz-area-${area.id}`} className="mb-4 text-lg font-bold text-foreground sm:text-xl">{area.name}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {area.categories.map((c) => <CalmCard key={c.categoryId} lesson={lessons.get(c.categoryId)!} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
