import CategoryCard from "@/components/common/category-card";
import { CATEGORIES } from "@/components/common/categories.constants";

const CATEGORY_PROGRESS: Record<string, number> = {
  Alphabet: 75,
  Numbers: 75,
  Shapes: 75,
  Colors: 0,
  Greetings: 0,
  Calendar: 0,
  "WH Questions": 0,
  "Word Concepts": 0,
};

const MyProgressPage = () => {
  return (
    <div className="space-y-8">
      <section className="flex min-h-40 items-center justify-between gap-6 rounded-xl border-2 border-hudyat-gold bg-hudyat-gold/20 px-6 py-5 sm:px-10">
        <div className="max-w-2xl">
          <h1 className="font-body text-2xl font-bold text-foreground sm:text-3xl">
            Hello there learner! Let&apos;s learn Filipino Sign Language
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a topic below to start practicing.
          </p>
        </div>

        <span
          aria-hidden="true"
          className="hidden shrink-0 text-6xl sm:block"
        >
          🖐️
        </span>
      </section>

      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="sr-only">
          Category progress
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((category) => {
            const progress = CATEGORY_PROGRESS[category.title];

            return (
              <CategoryCard
                key={category.title}
                {...category}
                variant="progress"
                progress={progress}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MyProgressPage;
