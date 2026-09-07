import { useNavigate } from "react-router";

import CategoryCard from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";

import type { LearningArea } from "@/api/learning-api";
import { useLearningAreas } from "@/hooks/use-learning-areas";


const STATUS_LABELS = {
  completed: "Completed",
  current: "Continue",
  locked: "Locked",
} as const;

export default function LearnPage() {
  const navigate = useNavigate();

  const {
    data: learningAreas = [],
    isLoading,
    error,
  } = useLearningAreas();

  /*
   * Find the learner's current category.
   * This is used for the locked-category message.
   */
  const currentCategory = learningAreas
    .flatMap(
      (area) => area.categories,
    )
    .find(
      (category) =>
        category.learningStatus ===
        "current",
    );

  /*
   * Render one category card.
   */
  const renderCategory = (
    category: LearningArea["categories"][number],
  ) => {
    /*
     * Match the database category with
     * the existing frontend presentation data
     * so we can get its icon and color.
     */
    const presentation =
      CATEGORIES.find(
        (item) =>
          item.title === category.name,
      );

    const isLocked =
      category.learningStatus ===
      "locked";

    /*
     * Determine whether the learner has
     * already started this category.
     *
     * lastLessonStep is null when the learner
     * has never entered the lesson.
     */
    const hasStarted =
      category.progress.status ===
        "IN_PROGRESS" ||
      category.progress.lastLessonStep !==
        null;

    /*
     * lastGestureIndex is zero-based.
     *
     * 0 = Sign 1
     * 1 = Sign 2
     * 2 = Sign 3
     *
     * Therefore +1 gives the learner-facing
     * sign number.
     */
    const currentSign =
      category.progress
        .lastGestureIndex + 1;

    /*
     * Determine the text shown underneath
     * the progress card.
     */
    let statusText: string;

    if (isLocked) {
      statusText = currentCategory
        ? `Complete ${currentCategory.name} first`
        : "Complete the previous lesson first";
    } else if (
      category.learningStatus ===
      "completed"
    ) {
      statusText = "Review this topic";
    } else if (hasStarted) {
      statusText = `Continue · Sign ${currentSign}`;
    } else {
      statusText = "Start learning";
    }

    /*
     * The backend now calculates:
     *
     * NOT_STARTED = 0%
     * IN_PROGRESS = checkpoint percentage
     * COMPLETED = 100%
     */
    const progress =
      category.progressPercent;

    return (
      <CategoryCard
        key={category.id}
        title={category.name}
        icon={presentation?.icon}
        color={
          presentation?.color ??
          "blue"
        }
        variant="progress"
        progress={progress}
        status={
          category.learningStatus
        }
        statusLabel={
          STATUS_LABELS[
            category.learningStatus
          ]
        }
        desc={statusText}
        disabled={isLocked}
        className="min-h-44 justify-center border-2"
        onClick={() => {
          if (isLocked) {
            return;
          }

          navigate(
            `/student/learn/${category.id}`,
          );
        }}
      />
    );
  };

  return (
    <section
      className="w-full font-body"
      aria-labelledby="learn-heading"
    >
      {/* ================================
          PAGE HEADER
         ================================ */}
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          Learning Journey
        </span>

        <h1
          id="learn-heading"
          className="mt-4 text-2xl font-bold text-foreground sm:text-3xl"
        >
          What do you want to learn?
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Learn step by step and unlock new topics!
        </p>
      </header>

      {/* ================================
          LOADING
         ================================ */}
      {isLoading && (
        <p
          className="mt-12 text-center text-sm text-muted-foreground"
          role="status"
        >
          Loading your lessons...
        </p>
      )}

      {/* ================================
          ERROR
         ================================ */}
      {!isLoading && error && (
        <p
          className="mt-12 text-center text-sm font-bold text-destructive"
          role="alert"
        >
          {error instanceof Error
            ? error.message
            : "We couldn't load your lessons right now."}
        </p>
      )}

      {/* ================================
          EMPTY STATE
         ================================ */}
      {!isLoading &&
        !error &&
        learningAreas.length === 0 && (
          <p
            className="mt-12 text-center text-sm text-muted-foreground"
            role="status"
          >
            No lessons are available yet.
          </p>
        )}

      {/* ================================
          LEARNING AREAS
         ================================ */}
      {!isLoading &&
        !error &&
        learningAreas.length > 0 && (
          <div className="mt-10">
            {learningAreas.map((area) => (
              <section
                key={area.id}
                aria-labelledby={`learning-area-${area.id}`}
                className="mb-12 last:mb-0"
              >
                {/* AREA TITLE */}
                <h3
                  id={`learning-area-${area.id}`}
                  className="mb-4 text-lg font-bold text-foreground sm:text-xl"
                >
                  {area.name}
                </h3>

                {/* CATEGORY CARDS */}
                {area.categories.length >
                0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {area.categories.map(
                      renderCategory,
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No lessons are available
                    in this area yet.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
    </section>
  );
}