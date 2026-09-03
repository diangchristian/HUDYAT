import CategoryCard from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";
import { useNavigate } from "react-router";
import { categorySlug } from "@/lib/practice";

const DESCRIPTIONS: Record<string, string> = {
  "WH Questions": "Who, What, Where, When, Why",
  "Word Concepts": "Action words, opposites",
};

export default function PracticePage() {
  const navigate = useNavigate();
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

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.title}
            {...category}
            desc={DESCRIPTIONS[category.title]}
            className="min-h-40 justify-center border-3"
            onClick={() => navigate(`/student/practice/${categorySlug(category.title)}`)}
          />
        ))}
      </div>
    </section>
  );
}
