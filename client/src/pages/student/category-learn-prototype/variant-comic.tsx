// PROTOTYPE, delete me. Comic Page: all 4 steps visible together as numbered panels, read in order.
import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check } from "lucide-react";

import ElevatedButton from "@/components/ui/elavated-button";

import StepContent from "./step-content";
import { STEP_META, STEPS, type PrototypeLesson } from "./use-prototype-lesson";

export default function VariantComic({ title, lesson }: { title: string; lesson: PrototypeLesson }) {
  const { prompt, index, total } = lesson;
  // The camera shouldn't switch on just because the panel is on screen, so the student starts it.
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <div className="space-y-5 pb-32">
      <div className="flex items-center gap-4">
        <h1 className="min-w-0 wrap-break-word text-5xl font-extrabold sm:text-6xl">{prompt.label}</h1>
        <p className="ml-auto shrink-0 text-xl font-extrabold">Sign {index + 1} of {total}</p>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2">
        {STEPS.map((item, position) => {
          const { label, icon: Icon, solid, soft } = STEP_META[item];
          return (
            <section key={item} aria-label={label} className={`min-w-0 overflow-hidden rounded-3xl border-4 ${soft}`}>
              <h2 className={`flex items-center gap-3 px-4 py-2 text-xl font-extrabold sm:text-2xl ${solid}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-900">{position + 1}</span>
                <span className="min-w-0 flex-1">{label}</span>
                <Icon aria-hidden="true" className="size-7 shrink-0" />
              </h2>

              <div className="p-4">
                {item === "try" && !cameraOpen ? (
                  <div className="flex aspect-video items-center justify-center">
                    <ElevatedButton text="MY TURN" icon={Camera} size="lg" className="min-h-20 w-full max-w-xs text-2xl!" onClick={() => setCameraOpen(true)} />
                  </div>
                ) : (
                  <StepContent step={item} prompt={prompt} title={title} onCorrect={lesson.nextSign} />
                )}
              </div>
            </section>
          );
        })}
      </div>

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
