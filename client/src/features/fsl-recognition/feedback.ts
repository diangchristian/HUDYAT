import type { Match } from "./prediction.ts";

export type RecognitionUpdate = {
  phase: "loading" | "ready" | "no-hand" | "multiple-hands" | "prediction" | "error";
  matches: Match[];
  message: string;
};
export function describePrediction(matches: Match[], targetLabel?: string) {
  const best = matches[0];
  if (!best || best.score < 0.6) return "Not certain yet. Adjust your hand and try again.";
  if (best.label === "J" || best.label === "Z" || targetLabel === "J" || targetLabel === "Z") {
    return "Pose estimate only. This model cannot check the movement for J or Z.";
  }
  return best.label === targetLabel
    ? "Possible match to the target pose. Compare with the reference."
    : "Possible " + best.label + " pose. Compare your hand with the target.";
}
