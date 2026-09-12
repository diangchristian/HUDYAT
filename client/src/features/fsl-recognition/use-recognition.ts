import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { RecognitionUpdate } from "./feedback.ts";
import { modelForCategory } from "./registry.ts";

export function useRecognition(video: RefObject<HTMLVideoElement | null>, active: boolean, category?: string) {
  const [state, setState] = useState<RecognitionUpdate | null>(null);
  const [attempt, setAttempt] = useState(0);
  const available = Boolean(modelForCategory(category));
  useEffect(() => {
    if (!active || !available) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("./engine").then(engine => {
      if (!cancelled && video.current) dispose = engine.startLiveRecognition(video.current, setState);
    }).catch(error => {
      if (!cancelled) setState({ phase: "error", matches: [], message: error instanceof Error ? error.message : "Recognition could not load." });
    });
    return () => { cancelled = true; dispose?.(); };
  }, [active, available, category, attempt, video]);
  return { available, state: active && available ? state : null, retry: () => setAttempt(value => value + 1) };
}
