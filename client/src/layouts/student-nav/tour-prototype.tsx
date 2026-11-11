/* eslint-disable react-refresh/only-export-components -- prototype file */
/*
 * PROTOTYPE, delete me: ?variant=tour-* compares three first-time tour
 * designs over the real student layout (dev only, nothing is saved).
 * Question: what tour reads best for young deaf learners?
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import ElevatedButton from "@/components/ui/elavated-button";
import CartoonNavIcon from "./cartoon-nav-icon";

export const TOUR_VARIANTS = [
  { key: "tour-spotlight", name: "Spotlight" },
  { key: "tour-buddy", name: "Tap-along buddy" },
  { key: "tour-cards", name: "Picture cards" },
];

export const isTourVariant = (variant: string | null): variant is string =>
  TOUR_VARIANTS.some((item) => item.key === variant);

type Step = { nav?: string; title: string; text: string; emoji: string };

const STEPS: Step[] = [
  { title: "Hi! Welcome!", text: "Let's look around.", emoji: "👋" },
  { nav: "Learn", title: "Learn", text: "Learn new signs.", emoji: "📖" },
  { nav: "Practice", title: "Practice", text: "Sign with your camera.", emoji: "📷" },
  { nav: "Assessment", title: "Quiz", text: "Play a quiz. Get stars!", emoji: "⭐" },
  { nav: "My Progress", title: "My Progress", text: "See how far you got.", emoji: "🏆" },
  { title: "You're ready!", text: "Have fun signing!", emoji: "🎉" },
];

// Desktop sidebar and mobile bottom nav both render each link; only one is visible.
const visibleNavEl = (name?: string) =>
  name
    ? [...document.querySelectorAll<HTMLElement>(`[data-nav-name="${name}"]`)].find(
        (el) => el.getClientRects().length > 0,
      )
    : undefined;

/** Tracks the visible nav link's box every frame (prototype: simplest way to follow resize/scroll/hover). */
function useNavRect(name?: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    let frame = 0;
    let last = "";
    const tick = () => {
      const next = visibleNavEl(name)?.getBoundingClientRect() ?? null;
      const key = next ? `${next.x},${next.y},${next.width},${next.height}` : "";
      if (key !== last) {
        last = key;
        setRect(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [name]);
  return rect;
}

/** Pulses the real nav link (cards + buddy variants). */
function usePulse(name?: string) {
  useEffect(() => {
    const el = visibleNavEl(name);
    el?.setAttribute("data-tour-target", "");
    return () => el?.removeAttribute("data-tour-target");
  }, [name]);
}

/** Bottom nav (phones) → bubble goes above; sidebar (desktop) → to the right. */
const isBottomNav = (rect: DOMRect) => rect.top > window.innerHeight * 0.6;

type VariantProps = {
  index: number;
  step: Step;
  next: () => void;
  back: () => void;
  close: () => void;
};

function Dots({ index }: { index: number }) {
  return (
    <div className="flex justify-center gap-1.5" aria-hidden="true">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-hudyat-gold" : "w-2.5 bg-amber-200"}`}
        />
      ))}
    </div>
  );
}

/* ---------- A: Spotlight — dim the page, cut out the nav item, read + Next ---------- */

function Spotlight({ index, step, next, back, close }: VariantProps) {
  const rect = useNavRect(step.nav);
  const pad = 8;
  const below = rect && isBottomNav(rect);

  const bubbleStyle: CSSProperties = !rect
    ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    : below
      ? { left: Math.min(Math.max(rect.left + rect.width / 2, 170), window.innerWidth - 170), bottom: window.innerHeight - rect.top + 24, transform: "translateX(-50%)" }
      : { left: rect.right + 24, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };

  return (
    <div className="fixed inset-0 z-50" onKeyDown={(e) => e.key === "Escape" && close()}>
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-4 ring-hudyat-gold transition-all duration-300"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(40, 30, 10, 0.65)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(40,30,10,0.65)]" />
      )}

      <div
        role="dialog"
        aria-live="polite"
        className="fixed w-[min(20rem,calc(100vw-2rem))] rounded-3xl border-4 border-hudyat-gold bg-white p-5 text-center font-body shadow-xl transition-all duration-300"
        style={bubbleStyle}
      >
        <div className="text-5xl">{step.emoji}</div>
        <h2 className="mt-2 text-2xl font-extrabold text-foreground">{step.title}</h2>
        <p className="mt-1 text-lg text-muted-foreground">{step.text}</p>
        <div className="mt-4"><Dots index={index} /></div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {index > 0 ? (
            <ElevatedButton text="BACK" variant="secondary" onClick={back} />
          ) : (
            <button type="button" onClick={close} className="px-2 text-sm font-bold text-muted-foreground underline">
              Skip
            </button>
          )}
          <ElevatedButton text={index === STEPS.length - 1 ? "DONE" : "NEXT"} onClick={next} />
        </div>
      </div>
    </div>
  );
}

/* ---------- B: Tap-along buddy — no dimming, tap the real icon to move on ---------- */

function Buddy({ index, step, next, close }: VariantProps) {
  const rect = useNavRect(step.nav);
  const [wrong, setWrong] = useState(false);
  usePulse(step.nav);

  // Catch nav taps: the right one advances, others wiggle the bubble. Nothing navigates.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLElement>("[data-nav-name]");
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      if (step.nav && link.dataset.navName === step.nav) next();
      else {
        setWrong(true);
        setTimeout(() => setWrong(false), 500);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step.nav, next]);

  if (!rect) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-50/70 p-4">
        <div className="flex flex-col items-center gap-3 font-body">
          <div className="animate-bounce text-8xl">🤟</div>
          <div className="rounded-3xl border-4 border-hudyat-gold bg-white px-6 py-4 text-center shadow-lg">
            <p className="text-3xl font-extrabold">{step.emoji} {step.title}</p>
            <p className="mt-1 text-lg text-muted-foreground">{step.text}</p>
          </div>
          <ElevatedButton size="lg" text={index === 0 ? "LET'S GO!" : "DONE"} onClick={next} />
          {index === 0 && (
            <button type="button" onClick={close} className="text-sm font-bold text-muted-foreground underline">
              Skip
            </button>
          )}
        </div>
      </div>
    );
  }

  const below = isBottomNav(rect);
  const style: CSSProperties = below
    ? { left: Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 110), bottom: window.innerHeight - rect.top + 8, transform: "translateX(-50%)" }
    : { left: rect.right + 12, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className={`fixed flex items-center gap-2 font-body transition-all duration-500 ${below ? "flex-col-reverse" : "flex-row"}`}
        style={style}
      >
        <div className={`text-4xl ${below ? "animate-bounce" : "animate-[tour-nudge-x_0.8s_ease-in-out_infinite]"}`}>
          {below ? "👇" : "👈"}
        </div>
        <div className={`flex items-center gap-2 ${wrong ? "animate-[tour-wiggle_0.4s]" : ""}`}>
          <div className="text-6xl">🤟</div>
          <div className="pointer-events-auto rounded-3xl border-4 border-hudyat-gold bg-white px-4 py-3 shadow-lg">
            <p className="text-2xl font-extrabold">Tap me! {step.emoji}</p>
            <p className="text-base text-muted-foreground">{step.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- C: Picture cards — big carousel, real nav pulses beside it ---------- */

function Cards({ index, step, next, back, close }: VariantProps) {
  usePulse(step.nav);
  const last = index === STEPS.length - 1;

  return (
    // z-30 sits under the nav (z-40), so the pulsing real icon stays visible.
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-amber-50/95 p-4 pb-28 lg:pb-4 lg:pl-68">
      <div role="dialog" aria-live="polite" className="w-full max-w-md rounded-[2rem] border-4 border-hudyat-gold bg-white p-6 text-center font-body shadow-[0_8px_0_#e6c17a]">
        <div className="mx-auto flex size-40 items-center justify-center">
          {step.nav ? <CartoonNavIcon name={step.nav} /> : <span className="text-8xl">{step.emoji}</span>}
        </div>
        <h2 className="mt-3 text-4xl font-extrabold text-foreground">{step.title}</h2>
        <p className="mt-2 text-xl text-muted-foreground">{step.text}</p>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={index === 0}
            aria-label="Back"
            className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 disabled:opacity-30"
          >
            <ChevronLeft className="size-9" />
          </button>
          <Dots index={index} />
          <button
            type="button"
            onClick={next}
            aria-label={last ? "Done" : "Next"}
            className="flex size-16 items-center justify-center rounded-full bg-hudyat-gold text-white shadow-[0_5px_0_#b8860b] active:translate-y-1 active:shadow-none"
          >
            {last ? <span className="text-2xl">✓</span> : <ChevronRight className="size-9" />}
          </button>
        </div>
        {!last && (
          <button type="button" onClick={close} className="mt-4 text-sm font-bold text-muted-foreground underline">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

const VARIANTS = { "tour-spotlight": Spotlight, "tour-buddy": Buddy, "tour-cards": Cards } as Record<string, (p: VariantProps) => ReactNode>;

export function TourPrototype({ variant }: { variant: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const Variant = VARIANTS[variant];
  const step = STEPS[index];

  const next = () => (index === STEPS.length - 1 ? setOpen(false) : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  return (
    <>
      <style>{`
        [data-tour-target] { position: relative; border-radius: 1rem; animation: tour-pulse 1.2s ease-out infinite; }
        @keyframes tour-pulse { 0% { box-shadow: 0 0 0 0 #FFC145; } 100% { box-shadow: 0 0 0 14px #FFC14500; } }
        @keyframes tour-wiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
        @keyframes tour-nudge-x { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
      `}</style>

      {open && Variant && <Variant index={index} step={step} next={next} back={back} close={() => setOpen(false)} />}

      {/* Surface the state (prototype rule): which step, which nav target. */}
      <div className="fixed right-3 top-3 z-[70] flex items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 font-mono text-xs text-white">
        {open ? `step ${index + 1}/${STEPS.length} · ${step.nav ?? "—"}` : "tour closed"}
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setOpen(true);
          }}
          className="flex items-center gap-1 rounded-full bg-fuchsia-500 px-2 py-0.5 font-bold"
        >
          <RotateCcw className="size-3" /> Restart
        </button>
      </div>
    </>
  );
}
