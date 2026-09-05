import CategoryCard from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";
import { categorySlug } from "@/lib/practice";
import { useNavigate } from "react-router";

const LEARNING_PROGRESS = {
  Alphabet: {
    progress: 100,
    status: "completed",
  },
  Numbers: {
    progress: 40,
    status: "current",
  },
  Shapes: {
    progress: 0,
    status: "locked",
  },
  Colors: {
    progress: 0,
    status: "locked",
  },
  Greetings: {
    progress: 0,
    status: "locked",
  },
  Calendar: {
    progress: 0,
    status: "locked",
  },
  "WH Questions": {
    progress: 0,
    status: "locked",
  },
  "Word Concepts": {
    progress: 0,
    status: "locked",
  },
} as const;

const LEARNING_STATUS = {
  completed: { label: "Completed", icon: "✓" },
  current: { label: "Continue", icon: "▶" },
  locked: { label: "Locked", icon: "🔒" },
} as const;

const BASIC_FSL_CATEGORIES = [
  "Alphabet",
  "Numbers",
  "Shapes",
  "Colors",
  "Greetings",
  "Calendar",
];

const COMMUNICATION_CATEGORIES = [
  "WH Questions",
  "Word Concepts",
];

export default function LearnPage() {
  const navigate = useNavigate();

  const currentCategory = CATEGORIES.find(
    (category) =>
      LEARNING_PROGRESS[
        category.title as keyof typeof LEARNING_PROGRESS
      ]?.status === "current",
  );

  const renderCategory = (category: (typeof CATEGORIES)[number]) => {
    const progress =
      LEARNING_PROGRESS[
        category.title as keyof typeof LEARNING_PROGRESS
      ];

    if (!progress) return null;

    const status = progress.status;
    const isLocked = status === "locked";

    const statusText = isLocked
      ? currentCategory
        ? `Complete ${currentCategory.title} first`
        : "Complete the previous lesson first"
      : status === "completed"
        ? "Review this topic"
        : "Keep going!";

    return (
      <CategoryCard
        key={category.title}
        {...category}
        variant="progress"
        progress={progress.progress}
        status={status}
        statusLabel={LEARNING_STATUS[status].label}
        desc={statusText}
        disabled={isLocked}
        className="min-h-44 justify-center border-2"
        onClick={() => {
          if (isLocked) return;

          navigate(`/student/learn/${categorySlug(category.title)}`);
        }}
      />
    );
  };

  return (
    <section
      className="w-full font-body"
      aria-labelledby="learn-heading"
    >
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

      {/* LEARNING AREAS */}
      <div className="mt-10">
        {/* BASIC FILIPINO SIGN LANGUAGE */}
        <section aria-labelledby="basic-fsl-heading">
          <h3
            id="basic-fsl-heading"
            className="mb-4 text-lg font-bold text-foreground sm:text-xl"
          >
            Basic Filipino Sign Language
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES
              .filter((category) =>
                BASIC_FSL_CATEGORIES.includes(category.title),
              )
              .map(renderCategory)}
          </div>
        </section>

        {/* COMMUNICATION */}
        <section
          aria-labelledby="communication-heading"
          className="mt-12"
        >
          <h3
            id="communication-heading"
            className="mb-4 text-lg font-bold text-foreground sm:text-xl"
          >
            Communication
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES
              .filter((category) =>
                COMMUNICATION_CATEGORIES.includes(category.title),
              )
              .map(renderCategory)}
          </div>
        </section>
      </div>
    </section>
  );
}
