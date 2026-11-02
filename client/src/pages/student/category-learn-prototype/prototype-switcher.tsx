// PROTOTYPE, delete me. Floating variant switcher: buttons or the arrow keys, dev builds only.
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router";

import { PROTOTYPE_VARIANTS, VARIANT_NAMES, type PrototypeVariant } from "./use-prototype-lesson";

export default function PrototypeSwitcher({ current, state }: { current: PrototypeVariant; state?: string }) {
  const [, setSearchParams] = useSearchParams();

  const cycle = (by: number) => {
    const count = PROTOTYPE_VARIANTS.length;
    const target = PROTOTYPE_VARIANTS[(PROTOTYPE_VARIANTS.indexOf(current) + by + count) % count];
    setSearchParams((params) => {
      params.set("variant", target);
      return params;
    }, { replace: true });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "VIDEO"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const arrow = "flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-white/20";

  // Sits above the layouts' bottom bars so neither hides the other.
  return (
    <div className="fixed bottom-26 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1 font-mono text-xs whitespace-nowrap text-white shadow-lg">
      <button type="button" aria-label="Previous variant" className={arrow} onClick={() => cycle(-1)}>
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <span>
        {VARIANT_NAMES[current]}{state ? ` · ${state}` : ""}
      </span>
      <button type="button" aria-label="Next variant" className={arrow} onClick={() => cycle(1)}>
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
