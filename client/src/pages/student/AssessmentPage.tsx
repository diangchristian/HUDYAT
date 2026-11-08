import { useState } from "react";
import {
  ArrowRight,
  Hand,
  Check,
  Lock,
  type LucideIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

// PROTOTYPE, delete me: ?variant=tests-* compares two-test assessment cards (dev only).
import PrototypeSwitcher from "@/components/prototype/prototype-switcher";
import { AssessmentCardsPrototype, buildLessons, CalmPage, CARD_VARIANTS, isCardVariant, LiteRowsCard, RowsCard } from "./assessment-cards-prototype";

import { useAssessmentList } from "@/hooks/use-assessment-list";
import type {
  AssessmentListCategory,
  AssessmentListStatus,
} from "@/api/assessment-api";
import { CATEGORIES } from "@/components/common/categories.constants";
import LearnCard from "@/components/common/learn-card/learn-card";
import LessonStage from "@/components/common/learn-card/lesson-stage";
import { starsEarned } from "@/lib/quiz-stars";
import StatusBadge, {
  type StatusBadgeTone,
} from "@/components/common/status-badge";

const filters = ["All", "Available", "Completed"] as const;

const statusDetails: Record<
  AssessmentListStatus,
  { label: string; color: string; icon: LucideIcon; tone: StatusBadgeTone }
> = {
  locked: { label: "Locked", color: "#94a3b8", icon: Lock, tone: "locked" },
  "not-started": {
    label: "Not Started",
    color: "#eef1f3",
    icon: Sparkles,
    tone: "neutral",
  },
  completed: {
    label: "Completed",
    color: "#3da44b",
    icon: Check,
    tone: "success",
  },
};

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const { data, isLoading, error } = useAssessmentList();
  const protoVariant = useSearchParams()[0].get("variant");

  const categories = (data?.learningAreas ?? []).flatMap(
    (area) => area.categories,
  );

  // page-* keep this page and only swap the cards (below); the other card variants replace the page.
  const keepCurrentCards = import.meta.env.DEV && protoVariant === "page-plus";
  const rowsCards = import.meta.env.DEV && (protoVariant === "page-rows" || protoVariant === "page-rows-lite" || keepCurrentCards) ? new Map(buildLessons(categories).map((l) => [l.c.categoryId, l])) : null;
  if (import.meta.env.DEV && protoVariant && isCardVariant(protoVariant) && !rowsCards) {
    return (
      <>
        {isLoading || error ? (
          <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
            {isLoading ? "Loading assessments..." : "We couldn't load your assessments right now."}
          </p>
        ) : (
          <AssessmentCardsPrototype variant={protoVariant} categories={categories} />
        )}
        {/* Lifted above the student bottom nav on phones/tablets. */}
        <div className="h-24" />
        <div className="[&>div]:!bottom-24 lg:[&>div]:!bottom-5">
          <PrototypeSwitcher variants={CARD_VARIANTS} current={protoVariant} />
        </div>
      </>
    );
  }

  // page-calm replaces the whole page (Learn-style header, grouped by area, no filter), not just the cards.
  if (import.meta.env.DEV && protoVariant === "page-calm") {
    return (
      <>
        <CalmPage areas={data?.learningAreas ?? []} loading={isLoading} failed={!!error} />
        <div className="h-24" />
        <div className="[&>div]:!bottom-24 lg:[&>div]:!bottom-5">
          <PrototypeSwitcher variants={CARD_VARIANTS} current={protoVariant} />
        </div>
      </>
    );
  }

  // The real page: a twin of the Learn page (same header, same cards, grouped the same way).
  // The layout below it is only kept for the remaining ?variant= card prototypes.
  if (!rowsCards) return <QuizzesPage areas={data?.learningAreas ?? []} loading={isLoading} error={error} />;

  const visibleCategories = categories.filter((category) => {
    if (activeFilter === "Completed") return category.status === "completed";
    if (activeFilter === "Available") return category.status === "not-started";
    return true;
  });

  const renderCard = (category: AssessmentListCategory) => {
    const details = statusDetails[category.status];
    const StatusIcon = details.icon;

    const presentation = CATEGORIES.find(
      (item) => item.title === category.categoryName,
    );

    const isLocked = !category.isUnlocked;
    const isCompleted = category.status === "completed";
    const hasAttempted = category.attemptCount > 0;

    const score = category.latestAttempt
      ? `${Math.round(Number(category.latestAttempt.score))}/${Math.round(
          Number(category.latestAttempt.totalPoints),
        )}`
      : null;

    const ctaLabel = isLocked
      ? "Locked"
      : isCompleted
        ? "Retake"
        : hasAttempted
          ? "Retry"
          : "Start Assessment";

    const CtaIcon = isCompleted ? RotateCcw : isLocked ? Lock : ArrowRight;

    return (
      <article
        key={category.categoryId}
        className={`group relative flex min-h-91.25 w-full flex-col overflow-hidden rounded-2xl border border-[#dbc8ae] bg-white p-4 shadow-[0_2px_3px_rgb(0_0_0/0.06)] sm:w-full ${isLocked ? "opacity-60" : ""}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: details.color }}
        />

        <div className="mb-4 flex items-center justify-between gap-2 text-xs font-extrabold">
          <StatusBadge
            icon={StatusIcon}
            label={details.label}
            tone={details.tone}
            className="gap-1 text-xs font-extrabold"
          />

          <span className="rounded-full bg-[#edf0f2] px-2.5 py-1">
            {score ? `Score: ${score}` : `${category.totalQuestions} Items`}
          </span>
        </div>

        <LessonStage
          title={category.categoryName}
          color={presentation?.color ?? "blue"}
          asleep={isLocked}
          className="rounded-xl border border-[#dbe1e4]"
        />

        <div className="flex flex-1 flex-col pt-4">
          <h2 className="text-xl font-extrabold">{category.categoryName}</h2>

          <p className="mt-1 text-sm leading-5 text-[#374151]">
            {isLocked
              ? category.lockedReason ?? "Pass the previous assessments to unlock this category."
              : category.description}
          </p>

          <button
            type="button"
            disabled={isLocked}
            onClick={() => navigate(`/student/assessment/${category.categoryId}`)}
            className={`mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg border-b-4 px-3 text-sm font-extrabold transition-transform active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4 ${
              isLocked
                ? "border-[#94a3b8] bg-[#cbd5e1] text-[#475569]"
                : isCompleted
                  ? "border-[#19732b] bg-[#3da44b] text-white"
                  : "border-[#b87800] bg-[#ffbd3d] text-[#573d00]"
            }`}
          >
            {ctaLabel}
            <CtaIcon className="size-4" />
          </button>

          {/* PROTOTYPE, delete me: the Sign test, same button style, under the quiz button. */}
          {keepCurrentCards && (() => {
            const sign = rowsCards?.get(category.categoryId)?.tests.find((t) => t.kind === "sign");
            if (!sign) return null;
            const off = !sign.path;
            const label =
              sign.state === "soon" ? "Sign Test · Coming Soon"
              : sign.state === "locked" ? "Sign Test · Locked"
              : sign.state === "passed" ? "Sign Test Passed"
              : sign.state === "tried" ? `Sign Test · Best ${sign.best}/${sign.total}`
              : "Start Sign Test";
            return (
              <button
                type="button"
                disabled={off}
                onClick={() => sign.path && navigate(sign.path)}
                className={`mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg border-b-4 px-3 text-sm font-extrabold transition-transform active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4 ${
                  off
                    ? "border-[#94a3b8] bg-[#cbd5e1] text-[#475569]"
                    : sign.state === "passed"
                      ? "border-[#19732b] bg-[#3da44b] text-white"
                      : "border-[#9f1239] bg-[#E11D48] text-white"
                }`}
              >
                {label}
                {sign.state === "passed" ? <RotateCcw className="size-4" /> : <Hand className="size-4" />}
              </button>
            );
          })()}
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-5xl font-body text-[#111827]">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src="/icons/assessment.png" alt="" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assessments</h1>
            <p className="mt-1 text-base">
              Show what you've learned. <Sparkles className="ml-1 inline size-4 text-[#f5ae24]" />
            </p>
          </div>
        </div>

        <div className="flex w-fit rounded-full bg-[#e7e9eb] p-1 shadow-inner">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`min-w-20 rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${activeFilter === filter ? "bg-[#ffc145] text-[#5c430b] shadow-[0_2px_3px_rgb(0_0_0/0.12)]" : "text-[#374151] hover:bg-white/60"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {isLoading && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          Loading assessments...
        </p>
      )}

      {!isLoading && error && (
        <p className="mt-12 text-center text-sm font-bold text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : "We couldn't load your assessments right now."}
        </p>
      )}

      {!isLoading && !error && visibleCategories.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          No assessments are available yet.
        </p>
      )}

      {!isLoading && !error && visibleCategories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rowsCards && !keepCurrentCards
            ? visibleCategories.map((category) => {
                const ProtoCard = protoVariant === "page-rows-lite" ? LiteRowsCard : RowsCard;
                return <ProtoCard key={category.categoryId} lesson={rowsCards.get(category.categoryId)!} />;
              })
            : visibleCategories.map(renderCard)}
        </div>
      )}
      {rowsCards && protoVariant && (
        <>
          <div className="h-24" />
          <div className="[&>div]:!bottom-24 lg:[&>div]:!bottom-5">
            <PrototypeSwitcher variants={CARD_VARIANTS} current={protoVariant} />
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentPage;

/*
 * The quiz page, built from the Learn page's own parts so it feels like the same app:
 * the same centred header, lessons grouped by learning area, and the same LearnCard
 * (lesson world, hover lift, lesson-coloured button) with stars in place of the progress bar.
 */
type QuizArea = { id: string; name: string; categories: AssessmentListCategory[] };

function quizCard(category: AssessmentListCategory) {
  const attempt = category.latestAttempt;
  const score = attempt ? Math.round(Number(attempt.score)) : 0;
  const total = attempt ? Math.round(Number(attempt.totalPoints)) : category.totalQuestions;

  if (!category.isUnlocked) {
    return { status: "locked" as const, statusText: `Finish the ${category.categoryName} lesson first`, actionText: "Locked", stars: 0 };
  }
  if (category.status === "completed") {
    return { status: "completed" as const, statusText: `Score ${score} / ${total}`, actionText: "Play again", stars: starsEarned(score, total) };
  }
  if (attempt) {
    return { status: "current" as const, statusText: `Last try ${score} / ${total}`, actionText: "Try again", stars: starsEarned(score, total) };
  }
  return { status: "current" as const, statusText: `${category.totalQuestions} questions`, actionText: "Start quiz", stars: 0 };
}

function QuizzesPage({ areas, loading, error }: { areas: QuizArea[]; loading: boolean; error: unknown }) {
  const navigate = useNavigate();

  return (
    <section className="w-full font-body" aria-labelledby="quiz-heading">
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          Quizzes
        </span>
        <h1 id="quiz-heading" className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          Show what you've learned!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Finish a lesson, then earn its stars here.</p>
      </header>

      {loading && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          Loading your quizzes...
        </p>
      )}

      {!loading && Boolean(error) && (
        <p className="mt-12 text-center text-sm font-bold text-destructive" role="alert">
          We couldn't load your quizzes right now.
        </p>
      )}

      {!loading && !error && areas.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          No quizzes are available yet.
        </p>
      )}

      {!loading && !error && areas.length > 0 && (
        <div className="mt-10">
          {areas.map((area) => (
            <section key={area.id} aria-labelledby={`quiz-area-${area.id}`} className="mb-12 last:mb-0">
              <h2 id={`quiz-area-${area.id}`} className="mb-4 text-lg font-bold text-foreground sm:text-xl">
                {area.name}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {area.categories.map((category) => {
                  const card = quizCard(category);
                  return (
                    <LearnCard
                      key={category.categoryId}
                      title={category.categoryName}
                      color={CATEGORIES.find((item) => item.title === category.categoryName)?.color ?? "blue"}
                      progress={0}
                      status={card.status}
                      statusText={card.statusText}
                      stars={card.stars}
                      actionText={card.actionText}
                      onClick={() => navigate(`/student/assessment/${category.categoryId}`)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
