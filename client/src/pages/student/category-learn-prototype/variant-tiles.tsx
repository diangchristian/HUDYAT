// PROTOTYPE, delete me. Step Tiles: a home screen of 4 big tiles for each sign. Tap one, do it, come back.
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, LayoutGrid } from "lucide-react";

import ElevatedButton from "@/components/ui/elavated-button";

import StepContent from "./step-content";
import { STEP_META, STEPS, type PrototypeLesson } from "./use-prototype-lesson";

export default function VariantTiles({ title, lesson }: { title: string; lesson: PrototypeLesson }) {
  const { prompt, step, index, total } = lesson;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  const isDone = (item: string) => done.includes(`${index}:${item}`);
  const finishStep = () => {
    setDone((list) => [...list, `${index}:${step}`]);
    setOpen(false);
  };
  const suggested = STEPS.find((item) => !isDone(item));
  const { label, icon: StepIcon, solid, soft } = STEP_META[step];

  if (open) {
    return (
      <div className="space-y-4 pb-32">
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${solid}`}>
          <StepIcon aria-hidden="true" className="size-8 shrink-0" />
          <h2 className="min-w-0 flex-1 text-2xl font-extrabold sm:text-3xl">{label}</h2>
          <span className="shrink-0 text-3xl font-extrabold sm:text-4xl">{prompt.label}</span>
        </div>

        <div className={`rounded-3xl border-2 p-4 sm:p-6 ${soft}`}>
          <StepContent step={step} prompt={prompt} title={title} onCorrect={finishStep} />
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 bg-background py-3">
          <ElevatedButton text="ALL STEPS" icon={LayoutGrid} variant="secondary" size="lg" className="min-h-14 shrink-0" onClick={() => setOpen(false)} />
          <ElevatedButton text="DONE" icon={Check} iconPosition="right" size="lg" className="min-h-14 flex-1 text-xl!" onClick={finishStep} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32">
      <div className="flex items-center gap-4">
        <h1 className="min-w-0 wrap-break-word text-6xl font-extrabold sm:text-7xl">{prompt.label}</h1>
        <p className="ml-auto shrink-0 text-xl font-extrabold">Sign {index + 1} of {total}</p>
      </div>

      <nav aria-label="Lesson steps" className="grid grid-cols-2 gap-3 sm:gap-4">
        {STEPS.map((item) => {
          const meta = STEP_META[item];
          const Icon = meta.icon;
          const finished = isDone(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                lesson.goToStep(item);
                setOpen(true);
              }}
              className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-4 p-3 text-center shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:min-h-52 ${meta.soft} ${
                item === suggested ? "ring-4 ring-hudyat-gold ring-offset-2" : ""
              }`}
            >
              {finished && (
                <span className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check aria-label="Done" className="size-6" strokeWidth={3} />
                </span>
              )}
              <span className={`flex size-16 items-center justify-center rounded-full sm:size-20 ${meta.solid}`}>
                <Icon aria-hidden="true" className="size-9 sm:size-11" />
              </span>
              <span className="text-xl leading-tight font-extrabold sm:text-2xl">{meta.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sticky bottom-0 z-10 flex gap-3 bg-background py-3">
        <ElevatedButton text="BACK" icon={ArrowLeft} variant="secondary" size="lg" className="min-h-14 shrink-0" disabled={index === 0} onClick={lesson.previousSign} />
        <ElevatedButton
          text={lesson.isLast ? "FINISH LESSON" : "NEXT SIGN"}
          icon={lesson.isLast ? Check : ArrowRight}
          iconPosition="right"
          size="lg"
          className="min-h-14 flex-1 text-xl!"
          onClick={lesson.nextSign}
        />
      </div>
    </div>
  );
}
