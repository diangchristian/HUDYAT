import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { CATEGORIES } from "@/components/common/categories.constants";
import SessionHeader from "@/components/common/session-header";
import PracticeCamera from "@/components/common/practice-camera";
import PracticeReference from "@/components/common/practice-reference";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { categorySlug, PRACTICE_PROMPTS, practicePosition, type PracticePrompt } from "@/lib/practice";

function PracticeSession({ title, prompts }: { title: string; prompts: PracticePrompt[] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prompt = prompts[index];
  const isLast = index === prompts.length - 1;

  const restart = () => {
    setIndex(0);
    setComplete(false);
  };

  if (complete) {
    return (
      <Card className="mx-auto mt-12 max-w-lg p-8 text-center" role="status">
        <Check aria-hidden="true" className="mx-auto mb-4 size-12 text-green-500" />
        <h1 className="text-2xl font-extrabold">Practice round complete!</h1>
        <p className="mt-3 text-muted-foreground">You worked through {prompts.length} {title.toLowerCase()} prompts at your own pace.</p>
        <p className="mt-2 text-xs text-muted-foreground">Self-guided practice — no automatic sign scoring.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <ElevatedButton text="PRACTICE AGAIN" icon={RotateCcw} className="min-h-11" onClick={restart} />
          <ElevatedButton text="CATEGORIES" variant="secondary" className="min-h-11" onClick={() => navigate("/student/practice")} />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="inline-flex min-h-8 items-center rounded-full bg-hudyat-gold px-5 py-2 text-xs font-extrabold text-primary-foreground uppercase">
          Practicing: {title}
        </h1>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Card className="relative flex min-h-44 flex-col items-center justify-center px-5 py-6 text-center">
            <span className="absolute -top-4 left-4 rounded-full bg-hudyat-gold/75 px-6 py-1.5 text-xs font-extrabold text-primary-foreground">
              Target Sign
            </span>
            <h2
              ref={headingRef}
              tabIndex={-1}
              aria-live="polite"
              aria-atomic="true"
              className={`max-w-full break-words font-bold leading-tight outline-none ${prompt.label.length <= 2 ? "text-8xl" : "text-3xl sm:text-4xl"}`}
            >
              {prompt.label}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {prompt.instruction || `Practice the sign for “${prompt.label}” using what you've learned. Sign-reference guidance will be added soon.`}
            </p>
          </Card>
          <PracticeReference key={prompt.label} prompt={prompt} />
        </div>

        <div className="min-w-0 space-y-6">
          <PracticeCamera />
          <div className="flex items-center gap-3 sm:gap-5">
            <ElevatedButton
              text=""
              aria-label="Restart this category"
              title="Restart this category"
              variant="secondary"
              icon={RotateCcw}
              size="sm"
              className="h-11 w-12 shrink-0 px-0 sm:h-9"
              onClick={() => { restart(); headingRef.current?.focus(); }}
            />
            <div className="min-w-0 flex-1">
              <div
                role="progressbar"
                aria-label="Practice prompt position"
                aria-valuemin={0}
                aria-valuemax={prompts.length}
                aria-valuenow={index + 1}
                aria-valuetext={`Sign ${index + 1} of ${prompts.length}`}
                className="h-4 overflow-hidden rounded-full bg-muted p-0.5"
              >
                <div className="h-full rounded-full bg-green-500 transition-[width] motion-reduce:transition-none" style={{ width: `${practicePosition(index, prompts.length)}%` }} />
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">Sign {index + 1} of {prompts.length}</p>
            </div>
            <ElevatedButton
              text={isLast ? "FINISH" : "NEXT"}
              icon={isLast ? Check : ArrowRight}
              iconPosition="right"
              size="sm"
              className="h-11 shrink-0 sm:h-9"
              onClick={() => {
                if (isLast) setComplete(true);
                else { setIndex((current) => current + 1); headingRef.current?.focus(); }
              }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">Self-guided practice. Choose Next when you're ready — no automatic scoring.</p>
        </div>
      </div>

      <div className="mt-8">
        <ElevatedButton text="BACK TO CATEGORIES" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" icon={ArrowLeft} onClick={() => navigate("/student/practice")} />
      </div>
    </>
  );
}

export default function CategoryPracticePage() {
  const { category: slug } = useParams();
  const navigate = useNavigate();
  const category = CATEGORIES.find((item) => categorySlug(item.title) === slug);
  const prompts = category && slug ? PRACTICE_PROMPTS[slug] : undefined;

  return (
    <div className="min-h-dvh bg-background font-body text-foreground">
      <SessionHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-12">
        {category && prompts?.length ? (
          <PracticeSession key={slug} title={category.title} prompts={prompts} />
        ) : (
          <Card className="mx-auto max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold">Category not found</h1>
            <p className="my-4 text-muted-foreground">Choose an available category to start practicing.</p>
            <ElevatedButton text="BACK TO CATEGORIES" variant="secondary" className="min-h-11" onClick={() => navigate("/student/practice")} />
          </Card>
        )}
      </main>
    </div>
  );
}
