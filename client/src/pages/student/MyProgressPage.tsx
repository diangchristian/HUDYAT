import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Lightbulb, Loader2, RefreshCw } from "lucide-react";

import { useMyProgress } from "@/hooks/use-my-progress";
import ElevatedButton from "@/components/ui/elavated-button";
import { ProgressHeader, ProgressSummary } from "./progress/progress-overview";
import ProgressCategoryCard from "./progress/progress-category-card";
import "./progress/progress.css";

export default function MyProgressPage() {
  const navigate = useNavigate();
  const [animationsPlaying, setAnimationsPlaying] = useState(true);
  const { data: progress, isLoading, error, refetch } = useMyProgress();

  return (
    <section
      className="progress-page w-full font-body"
      aria-labelledby="my-progress-heading"
      data-motion={animationsPlaying ? "playing" : "paused"}
    >
      <ProgressHeader
        playing={animationsPlaying}
        onToggle={() => setAnimationsPlaying((playing) => !playing)}
      />

      {isLoading && (
        <div role="status" className="mt-12 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 aria-hidden="true" className="size-8 animate-spin text-hudyat-gold" />
          <p className="text-sm font-semibold text-muted-foreground">Loading your progress...</p>
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">
            {error instanceof Error ? error.message : "Unable to load your progress."}
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
          <ProgressSummary summary={progress.summary} />

          {progress.summary.totalCategories === 0 ? (
            <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-dashed border-hudyat-gold/40 bg-hudyat-gold/5 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No categories are available yet. Your progress will appear here once lessons are added.
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-muted p-4">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-hudyat-gold" />
                <p className="text-sm text-muted-foreground">
                  Lesson progress follows your saved position. Passing a category's assessment marks it complete.
                </p>
              </div>

              {progress.learningAreas
                .filter((area) => area.categories.length > 0)
                .map((area) => (
                  <section key={area.id} aria-labelledby={`progress-area-${area.id}`} className="mt-10">
                    <h2 id={`progress-area-${area.id}`} className="progress-area-title">{area.name}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {area.categories.map((category) => (
                        <ProgressCategoryCard key={category.id} category={category} />
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
