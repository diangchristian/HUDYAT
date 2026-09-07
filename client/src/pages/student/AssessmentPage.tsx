import { useState } from "react";
import { ArrowRight, Check, Lock, RotateCcw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

import { useAssessmentList } from "@/hooks/use-assessment-list";
import type {
  AssessmentListCategory,
  AssessmentListStatus,
} from "@/api/assessment-api";
import type { CategoryColor } from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";

const filters = ["All", "Available", "Completed"] as const;

const statusDetails: Record<
  AssessmentListStatus,
  { label: string; color: string; icon: typeof Check }
> = {
  locked: { label: "Locked", color: "#94a3b8", icon: Lock },
  "not-started": { label: "Not Started", color: "#eef1f3", icon: Sparkles },
  completed: { label: "Completed", color: "#3da44b", icon: Check },
};

const themeStyles: Record<CategoryColor, string> = {
  green: "bg-[#eaf7e1] text-[#5c9a3a]",
  yellow: "bg-[#fdf3d9] text-[#c9971f]",
  blue: "bg-[#e3f2fa] text-[#2385c3]",
  purple: "bg-[#f0eaf8] text-[#8b5fc9]",
  orange: "bg-[#fbe9e0] text-[#d97a3f]",
  red: "bg-[#fbe3e2] text-[#d95849]",
};

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const { data, isLoading, error } = useAssessmentList();

  const categories = (data?.learningAreas ?? []).flatMap(
    (area) => area.categories,
  );

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

    const theme = themeStyles[presentation?.color ?? "blue"];
    const ThumbnailIcon = presentation?.icon ?? Sparkles;

    const isLocked = category.status === "locked";
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
        className={`relative flex min-h-91.25 w-sm flex-col overflow-hidden rounded-2xl border border-[#dbc8ae] bg-white p-4 shadow-[0_2px_3px_rgb(0_0_0/0.06)] sm:w-full ${isLocked ? "opacity-60" : ""}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: details.color }}
        />

        <div className="mb-4 flex items-center justify-between gap-2 text-xs font-extrabold">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[#b8bfc5] px-2.5 py-1"
            style={{
              backgroundColor: isCompleted ? details.color : "#eef1f3",
              color: isCompleted ? "white" : "#334155",
            }}
          >
            <StatusIcon className="size-3.5" /> {details.label}
          </span>

          <span className="rounded-full bg-[#edf0f2] px-2.5 py-1">
            {score ? `Score: ${score}` : `${category.totalQuestions} Items`}
          </span>
        </div>

        <div
          className={`relative flex h-31.5 items-center justify-center overflow-hidden rounded-xl border border-[#dbe1e4] ${theme}`}
        >
          <div className="absolute inset-3 rounded-lg border-2 border-white/70 bg-white/35" />
          <ThumbnailIcon className="relative size-14 drop-shadow-sm" />
        </div>

        <div className="flex flex-1 flex-col pt-4">
          <h2 className="text-xl font-extrabold">{category.categoryName}</h2>

          <p className="mt-1 text-sm leading-5 text-[#374151]">
            {isLocked
              ? "Finish this category's lesson to unlock its assessment."
              : category.description}
          </p>

          <button
            type="button"
            disabled={isLocked}
            onClick={() => navigate(`/student/assessment/${category.categoryId}`)}
            className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg border-b-4 px-3 text-sm font-extrabold transition-transform active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4 ${
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
          {visibleCategories.map(renderCard)}
        </div>
      )}
    </div>
  );
};

export default AssessmentPage;
