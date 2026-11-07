import LessonStage from "@/components/common/learn-card/lesson-stage";
import { PALETTE } from "@/components/common/learn-card/characters";
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
          <button
            key={category.title}
            type="button"
            onClick={() => navigate(`/student/practice/${categorySlug(category.title)}`)}
            style={{ "--edge": PALETTE[category.color].main } as React.CSSProperties}
            className="group flex w-full flex-col overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white text-center shadow-[0_6px_0_#E5E5E5] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--edge)] hover:shadow-[0_10px_0_var(--edge)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--edge)] active:duration-75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hudyat-gold"
          >
            <LessonStage title={category.title} color={category.color} />
            <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-3">
              <h2 className="text-xl font-extrabold text-[#4B4B4B]">{category.title}</h2>
              {DESCRIPTIONS[category.title] && (
                <p className="text-sm font-bold text-[#AFAFAF]">{DESCRIPTIONS[category.title]}</p>
              )}
              <span className="min-h-5 flex-1" />
              <span
                className="w-full rounded-2xl py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-[0_4px_0_var(--btn)] transition-all duration-100 group-active:translate-y-1 group-active:shadow-none"
                style={{ background: PALETTE[category.color].main, "--btn": PALETTE[category.color].dark } as React.CSSProperties}
              >
                Practice
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
