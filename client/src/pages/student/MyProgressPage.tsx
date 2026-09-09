import { useNavigate } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Flame,
  Lightbulb,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useMyProgress } from "@/hooks/use-my-progress";
import {
  CATEGORIES,
  CATEGORY_THEME,
} from "@/components/common/categories.constants";
import StatusBadge, {
  type StatusBadgeTone,
} from "@/components/common/status-badge";
import StatTile from "@/components/common/stat-tile";
import type { ProgressCategory } from "@/api/progress-api";
import ElevatedButton from "@/components/ui/elavated-button";

const STATUS_PRESENTATION: Record<
  ProgressCategory["status"],
  { label: string; icon: typeof CheckCircle2; tone: StatusBadgeTone }
> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "success",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: PlayCircle,
    tone: "info",
  },
  NOT_STARTED: {
    label: "Not started",
    icon: Circle,
    tone: "neutral",
  },
};

function ProgressCategoryCard({ category }: { category: ProgressCategory }) {
  const presentation = CATEGORIES.find(
    (item) => item.title === category.name,
  );

  const color = presentation?.color ?? "blue";
  const theme = CATEGORY_THEME[color];
  const Icon = presentation?.icon ?? Sparkles;

  const statusInfo = STATUS_PRESENTATION[category.status];
  const StatusIcon = statusInfo.icon;

  return (
    <article
      className={`flex flex-col gap-4 rounded-3xl border-2 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.borderSoft}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${theme.bg}`}
          >
            <Icon aria-hidden="true" className={`size-6 ${theme.icon}`} />
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {category.name}
          </h3>
        </div>

        <StatusBadge
          icon={StatusIcon}
          label={statusInfo.label}
          tone={statusInfo.tone}
          className="shrink-0 px-3 py-1 text-[11px] whitespace-nowrap"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Lesson progress</span>
          <span className="text-foreground">
            {category.progressPercent}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`${category.name} lesson progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={category.progressPercent}
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${theme.progress}`}
            style={{ width: `${category.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-muted/60 p-3 text-xs">
        {category.latestAssessment ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-semibold text-muted-foreground">
                Latest assessment score
              </span>

              <span className="font-extrabold text-foreground">
                {category.latestAssessment.score} / {category.latestAssessment.totalPoints}{" "}
                ({category.latestAssessment.percentage}%)
              </span>
            </div>

            <p className="mt-1 text-muted-foreground">
              Submitted{" "}
              {new Date(
                category.latestAssessment.completedAt,
              ).toLocaleDateString()}{" "}
              · {category.assessmentAttempts} attempt
              {category.assessmentAttempts === 1 ? "" : "s"}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            No assessment attempts yet.
          </p>
        )}
      </div>
    </article>
  );
}

export default function MyProgressPage() {
  const navigate = useNavigate();

  const {
    data: progress,
    isLoading,
    error,
    refetch,
  } = useMyProgress();

  const stats = progress
    ? [
        {
          label: "Categories completed",
          value: `${progress.summary.completedCategories}/${progress.summary.totalCategories}`,
          icon: Sparkles,
          colorClassName: "bg-amber-100 text-amber-600",
        },
        {
          label: "Categories in progress",
          value: progress.summary.inProgressCategories,
          icon: Flame,
          colorClassName: "bg-sky-100 text-sky-600",
        },
        {
          label: "Assessments submitted",
          value: progress.summary.assessmentAttempts,
          icon: ClipboardCheck,
          colorClassName: "bg-emerald-100 text-emerald-600",
        },
      ]
    : [];

  return (
    <section className="w-full font-body">
      {/* ================================
          PAGE HEADER
         ================================ */}
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          My Journey
        </span>

        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          My Progress
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          See how far you've come in Filipino Sign Language!
        </p>
      </header>

      {/* ================================
          LOADING
         ================================ */}
      {isLoading && (
        <div
          role="status"
          className="mt-12 flex flex-col items-center justify-center gap-3 text-center"
        >
          <Loader2
            aria-hidden="true"
            className="size-8 animate-spin text-hudyat-gold"
          />

          <p className="text-sm font-semibold text-muted-foreground">
            Loading your progress...
          </p>
        </div>
      )}

      {/* ================================
          ERROR
         ================================ */}
      {!isLoading && error && (
        <div
          role="alert"
          className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center"
        >
          <p className="font-semibold text-red-700">
            {error instanceof Error
              ? error.message
              : "Unable to load your progress."}
          </p>

          <ElevatedButton
            text="TRY AGAIN"
            variant="secondary"
            icon={RefreshCw}
            className="mt-4"
            onClick={() => void refetch()}
          />
        </div>
      )}

      {!isLoading && !error && progress && (
        <div className="mt-10">
          {/* ================================
              SUMMARY STATS
             ================================ */}
          <section
            aria-label="Progress summary"
            className="grid gap-4 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <StatTile
                key={stat.label}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                colorClassName={stat.colorClassName}
              />
            ))}
          </section>

          {progress.summary.totalCategories === 0 ? (
            <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-dashed border-hudyat-gold/40 bg-hudyat-gold/5 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No categories are available yet. Your progress will
                appear here once lessons are added.
              </p>
            </div>
          ) : (
            <>
              {/* HINT */}
              <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-muted p-4">
                <Lightbulb
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-hudyat-gold"
                />

                <p className="text-sm text-muted-foreground">
                  Lesson progress follows your saved position. Passing
                  a category's assessment marks it complete.
                </p>
              </div>

              {/* ================================
                  LEARNING AREAS
                 ================================ */}
              {progress.learningAreas
                .filter((area) => area.categories.length > 0)
                .map((area) => (
                  <section
                    key={area.id}
                    aria-labelledby={`progress-area-${area.id}`}
                    className="mt-10"
                  >
                    <h2
                      id={`progress-area-${area.id}`}
                      className="mb-4 text-lg font-bold text-foreground sm:text-xl"
                    >
                      {area.name}
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {area.categories.map((category) => (
                        <ProgressCategoryCard
                          key={category.id}
                          category={category}
                        />
                      ))}
                    </div>
                  </section>
                ))}

              <div className="mt-12 flex justify-center">
                <ElevatedButton
                  text="CONTINUE LEARNING"
                  icon={ArrowRight}
                  iconPosition="right"
                  size="lg"
                  onClick={() => navigate("/student/learn")}
                />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
