import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMyProgress, type MyProgress } from "@/lib/progress-api";

const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
} as const;

export default function MyProgressPage() {
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getMyProgress(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setProgress(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Unable to load your progress.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  return (
    <div className="space-y-8 font-body">
      <header className="rounded-2xl border-2 border-hudyat-gold bg-hudyat-gold/20 p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold">My Progress</h1>
        <p className="mt-2 text-muted-foreground">
          See how far you have come in Filipino Sign Language.
        </p>
      </header>

      {isLoading && <p role="status">Loading your progress...</p>}
      {!isLoading && error && (
        <div role="alert" className="rounded-xl border p-6">
          <p>{error}</p>
          <button type="button" className="mt-3 font-bold underline" onClick={() => {
            setError(null);
            setIsLoading(true);
            setReload((value) => value + 1);
          }}>Try again</button>
        </div>
      )}
      {!isLoading && !error && progress && (
        <>
          <section aria-label="Progress summary" className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Categories completed", value: `${progress.summary.completedCategories} / ${progress.summary.totalCategories}` },
              { label: "Categories in progress", value: progress.summary.inProgressCategories },
              { label: "Assessments submitted", value: progress.summary.assessmentAttempts },
            ].map((stat) => (
              <article key={stat.label} className="rounded-2xl border bg-white p-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{stat.value}</p>
              </article>
            ))}
          </section>

          {progress.summary.totalCategories === 0 ? (
            <p role="status">No categories are available yet. Your progress will appear here when lessons are added.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Lesson progress follows your saved position. Passing a category assessment marks the category complete.
              </p>
              {progress.learningAreas.filter((area) => area.categories.length > 0).map((area) => (
                <section key={area.id} aria-labelledby={`progress-area-${area.id}`}>
                  <h2 id={`progress-area-${area.id}`} className="mb-4 text-xl font-bold">{area.name}</h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {area.categories.map((category) => (
                      <article key={category.id} className="space-y-4 rounded-2xl border bg-white p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg font-bold">{category.name}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${category.status === "COMPLETED" ? "bg-green-100 text-green-800" : category.status === "IN_PROGRESS" ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"}`}>
                            {STATUS_LABELS[category.status]}
                          </span>
                        </div>
                        <div>
                          <div className="mb-2 flex justify-between text-sm">
                            <span>Lesson progress</span><span className="font-bold">{category.progressPercent}%</span>
                          </div>
                          <progress aria-label={`${category.name} lesson progress`} max={100} value={category.progressPercent} className="h-3 w-full accent-sky-600" />
                        </div>
                        <div className="border-t pt-4 text-sm">
                          <p>Assessments submitted: <strong>{category.assessmentAttempts}</strong></p>
                          {category.latestAssessment ? (
                            <>
                              <p className="mt-1">Latest score: <strong>{category.latestAssessment.score} / {category.latestAssessment.totalPoints} ({category.latestAssessment.percentage}%)</strong></p>
                              <p className="mt-1 text-muted-foreground">
                                Submitted {new Date(category.latestAssessment.completedAt).toLocaleDateString()}
                              </p>
                            </>
                          ) : <p className="mt-1 text-muted-foreground">No assessment results yet.</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
              <Link to="/student/learn" className="inline-flex rounded-xl bg-hudyat-gold px-6 py-3 font-bold">
                Continue learning
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
