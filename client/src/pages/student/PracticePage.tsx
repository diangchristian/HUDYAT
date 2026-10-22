import { useNavigate } from "react-router";
import CategoryCard from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";
import type { LearningArea } from "@/api/learning-api";
import { useLearningAreas } from "@/hooks/use-learning-areas";
import { categorySlug } from "@/lib/practice";

// Laid out like the Learn page (same learning areas, order and cards), but nothing is locked.
export default function PracticePage() {
  const navigate = useNavigate();
  const { data: learningAreas = [], isLoading, error } = useLearningAreas();

  // Practice uses each category's lesson signs (CategoryPracticePage).
  const areas = learningAreas.filter((area) => area.categories.length > 0);

  const renderCategory = (category: LearningArea["categories"][number]) => {
    const presentation = CATEGORIES.find((item) => item.title === category.name);
    const slug = categorySlug(category.name);
    return (
      <CategoryCard
        key={category.id}
        title={category.name}
        icon={presentation?.icon}
        color={presentation?.color ?? "blue"}
        variant="progress"
        status="current"
        statusLabel="Free play"
        desc="Practice the signs as often as you like"
        className="min-h-44 justify-center border-2"
        onClick={() => navigate(`/student/practice/${slug}`)}
      />
    );
  };

  return (
    <section className="w-full font-body" aria-labelledby="practice-heading">
      <header className="text-center">
        <span className="inline-flex h-8 items-center justify-center rounded-full bg-hudyat-gold px-10 text-xs font-extrabold text-primary-foreground">
          Free Play Mode
        </span>
        <h1
          id="practice-heading"
          className="mt-4 text-2xl font-bold text-foreground sm:text-3xl"
        >
          What do you want to practice?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Practice as many times as you like!
        </p>
      </header>

      {isLoading && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          Loading your practice topics...
        </p>
      )}

      {!isLoading && error && (
        <p className="mt-12 text-center text-sm font-bold text-destructive" role="alert">
          {error instanceof Error ? error.message : "We couldn't load your practice topics right now."}
        </p>
      )}

      {!isLoading && !error && areas.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground" role="status">
          No practice topics are available yet.
        </p>
      )}

      {!isLoading && !error && areas.length > 0 && (
        <div className="mt-10">
          {areas.map((area) => (
            <section key={area.id} aria-labelledby={`practice-area-${area.id}`} className="mb-12 last:mb-0">
              <h3 id={`practice-area-${area.id}`} className="mb-4 text-lg font-bold text-foreground sm:text-xl">
                {area.name}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {area.categories.map(renderCategory)}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
