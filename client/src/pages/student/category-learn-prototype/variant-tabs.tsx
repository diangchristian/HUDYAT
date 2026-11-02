// PROTOTYPE, delete me. Bottom Tabs: phone-app layout, 4 tabs under the thumb and big arrows beside the content.
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import StepContent from "./step-content";
import { STEP_META, STEPS, type PrototypeLesson } from "./use-prototype-lesson";

export default function VariantTabs({ title, lesson }: { title: string; lesson: PrototypeLesson }) {
  const { prompt, step, index, total } = lesson;
  const { label, icon: StepIcon, soft } = STEP_META[step];
  const finishing = lesson.isLast && step === "try";
  const NextIcon = finishing ? Check : ArrowRight;
  const round = "flex size-16 cursor-pointer items-center justify-center rounded-full shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-4 pb-48">
      <div className="flex items-center gap-4">
        <h1 className="min-w-0 wrap-break-word text-5xl font-extrabold sm:text-6xl">{prompt.label}</h1>
        <p className="ml-auto shrink-0 text-xl font-extrabold">Sign {index + 1} of {total}</p>
      </div>

      <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-5">
        <div className="flex flex-col items-center gap-1">
          <button type="button" aria-label="Back" disabled={lesson.isFirst} onClick={lesson.back} className={`${round} border-2 bg-white text-gray-900`}>
            <ArrowLeft aria-hidden="true" className="size-8" />
          </button>
          <span aria-hidden="true" className="text-base font-extrabold">BACK</span>
        </div>

        {/* First on phones, so the arrows sit below the content instead of squeezing it. */}
        <div className={`order-first col-span-2 min-w-0 rounded-3xl border-4 p-4 sm:p-6 md:order-none md:col-span-1 ${soft}`}>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
            <StepIcon aria-hidden="true" className="size-8 shrink-0" />
            {label}
          </h2>
          <StepContent step={step} prompt={prompt} title={title} onCorrect={lesson.next} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <button type="button" aria-label={finishing ? "Finish lesson" : "Next"} onClick={lesson.next} className={`${round} bg-hudyat-gold text-white`}>
            <NextIcon aria-hidden="true" className="size-8" />
          </button>
          <span aria-hidden="true" className="text-base font-extrabold">{finishing ? "FINISH" : "NEXT"}</span>
        </div>
      </div>

      <nav aria-label="Lesson steps" className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-border bg-background">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {STEPS.map((item) => {
            const meta = STEP_META[item];
            const Icon = meta.icon;
            const current = item === step;
            return (
              <button
                key={item}
                type="button"
                aria-current={current ? "step" : undefined}
                onClick={() => lesson.goToStep(item)}
                className={`flex min-h-22 cursor-pointer flex-col items-center justify-center gap-1 px-1 py-2 text-center text-sm leading-tight font-extrabold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:text-base ${
                  current ? meta.solid : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-7 shrink-0" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
