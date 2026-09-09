import { useNavigate } from "react-router";
import { ArrowRight, ClipboardCheck, Sparkles } from "lucide-react";

import { Banner } from "@/components/common/banner";
import {
  CATEGORIES,
  CATEGORY_THEME,
} from "@/components/common/categories.constants";
import StatTile from "@/components/common/stat-tile";
import ElevatedButton from "@/components/ui/elavated-button";
import { cn } from "@/lib/utils";

import type { LearningArea } from "@/api/learning-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLearningAreas } from "@/hooks/use-learning-areas";
import { useMyProgress } from "@/hooks/use-my-progress";

const MODES = [
  {
    title: "Learn FSL",
    image: "/icons/learn.png",
    path: "/student/learn",
    className: "bg-hudyat-blue shadow-[0_6px_0_#004d85]",
  },
  {
    title: "Practice",
    image: "/icons/practice.png",
    path: "/student/practice",
    className: "bg-hudyat-gold shadow-[0_6px_0_#b8860b]",
  },
  {
    title: "Assessment",
    image: "/icons/assessment.png",
    path: "/student/assessment",
    className: "bg-violet-400 shadow-[0_6px_0_#7c5cbf]",
  },
];

function ContinueLearningCard({
  isLoading,
  hasAnyCategories,
  currentCategory,
}: {
  isLoading: boolean;
  hasAnyCategories: boolean;
  currentCategory: LearningArea["categories"][number] | undefined;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  if (!hasAnyCategories) {
    return null;
  }

  if (!currentCategory) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-lg font-extrabold text-emerald-700">
            All caught up! 🎉
          </p>
          <p className="text-sm text-emerald-700/80">
            You've completed every category. Review any lesson anytime.
          </p>
        </div>

        <ElevatedButton
          text="REVIEW LESSONS"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => navigate("/student/learn")}
        />
      </div>
    );
  }

  const presentation = CATEGORIES.find(
    (item) => item.title === currentCategory.name,
  );

  const theme = CATEGORY_THEME[presentation?.color ?? "blue"];
  const Icon = presentation?.icon ?? Sparkles;

  const hasStarted =
    currentCategory.progress.status === "IN_PROGRESS" ||
    currentCategory.progress.lastLessonStep !== null;

  const currentSign = currentCategory.progress.lastGestureIndex + 1;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-hudyat-gold/30 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-full ${theme.bg}`}
        >
          <Icon aria-hidden="true" className={`size-7 ${theme.icon}`} />
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-hudyat-gold">
            Continue Learning
          </p>

          <h3 className="text-xl font-extrabold text-foreground">
            {currentCategory.name}
          </h3>

          <p className="text-sm text-muted-foreground">
            {hasStarted
              ? `Sign ${currentSign} · ${currentCategory.progressPercent}% complete`
              : "Let's get started!"}
          </p>
        </div>
      </div>

      <ElevatedButton
        text={hasStarted ? "CONTINUE LEARNING" : "START LEARNING"}
        icon={ArrowRight}
        iconPosition="right"
        onClick={() => navigate(`/student/learn/${currentCategory.id}`)}
      />
    </div>
  );
}

const StudentHomePage = () => {
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();

  const { data: learningAreas = [], isLoading: isLearningLoading } =
    useLearningAreas();

  const { data: progress } = useMyProgress();

  const currentCategory = learningAreas
    .flatMap((area) => area.categories)
    .find((category) => category.learningStatus === "current");

  const hasAnyCategories = learningAreas.some(
    (area) => area.categories.length > 0,
  );

  return (
    <div className="space-y-8 font-body">
      <Banner name={user?.fullName} />

      <ContinueLearningCard
        isLoading={isLearningLoading}
        hasAnyCategories={hasAnyCategories}
        currentCategory={currentCategory}
      />

      {progress && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            icon={Sparkles}
            value={`${progress.summary.completedCategories}/${progress.summary.totalCategories}`}
            label="Categories completed"
            colorClassName="bg-amber-100 text-amber-600"
          />

          <StatTile
            icon={ClipboardCheck}
            value={progress.summary.assessmentAttempts}
            label="Assessments submitted"
            colorClassName="bg-emerald-100 text-emerald-600"
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          Modes
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {MODES.map((mode) => (
            <button
              key={mode.title}
              type="button"
              onClick={() => navigate(mode.path)}
              className={cn(
                "flex h-50 flex-col items-center justify-center rounded-xl transition-[transform,box-shadow] duration-150",
                "active:translate-y-1.5 active:shadow-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                mode.className,
              )}
            >
              <div className="flex size-30 select-none items-center justify-center rounded-full bg-white">
                <img
                  src={mode.image}
                  alt=""
                  width="70"
                  height="70"
                />
              </div>

              <h3 className="mt-2 select-none font-body text-2xl font-bold text-white">
                {mode.title}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentHomePage;
