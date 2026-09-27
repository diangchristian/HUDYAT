/*
 * PROTOTYPE — throwaway. Floating variant switcher for UI prototypes
 * (see the `?variant=` pages). Never rendered in production builds.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PrototypeSwitcherProps = {
  variants: Array<{ key: string; name: string }>;
  current: string;
};

export default function PrototypeSwitcher({
  variants,
  current,
}: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  );

  const go = (offset: number) => {
    const next = variants[(index + offset + variants.length) % variants.length];
    if (!next) return;
    const params = new URLSearchParams(searchParams);
    params.set("variant", next.key);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  const active = variants[index];

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-950 p-1 font-mono text-xs text-white shadow-2xl ring-1 ring-white/20">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous variant"
        className="rounded-full p-2 hover:bg-white/15"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-52 px-2 text-center">
        <span className="mr-2 rounded bg-fuchsia-500 px-1.5 py-0.5 font-bold">
          PROTOTYPE
        </span>
        {active?.key} · {active?.name}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next variant"
        className="rounded-full p-2 hover:bg-white/15"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
