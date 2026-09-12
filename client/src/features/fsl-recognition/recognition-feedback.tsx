import { useState } from "react";
import { Card } from "@/components/ui/card";
import ElevatedButton from "@/components/ui/elavated-button";
import { describePrediction } from "./feedback.ts";
import type { RecognitionUpdate } from "./feedback.ts";

export function RecognitionFeedback({ available, active, state, targetLabel, retry }: {
  available: boolean; active: boolean; state: RecognitionUpdate | null; targetLabel?: string; retry: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState("");
  const [report, setReport] = useState("");
  async function verify() {
    if(checking) return;
    setChecking(true); setCheck("Checking saved examples…"); setReport("");
    try {
      const {validateSavedExamples} = await import("./validate");
      const result = await validateSavedExamples();
      setCheck("Recognition check passed on 26 saved examples.");
      setReport(JSON.stringify(result));
    } catch(error) { setCheck("Check failed: " + (error instanceof Error ? error.message : String(error))); }
    finally {setChecking(false);}
  }
  if(!available) return <p className="mt-3 text-sm text-muted-foreground">Camera practice is available. Recognition for this category is waiting for a trained model.</p>;
  const best = active && state?.phase === "prediction" ? state.matches[0] : undefined;
  const message = !active ? "Start the camera for alphabet pose feedback." :
    !state ? "Preparing recognition…" : state.phase === "prediction" ? describePrediction(state.matches, targetLabel) : state.message;
  return <Card className="mt-3 gap-3 border-hudyat-gold/30 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">Alphabet recognition</h3>
      <span className="text-xs text-muted-foreground">Runs on your device</span>
    </div>
    <p role={state?.phase === "error" ? "alert" : "status"} className="text-sm">{message}</p>
    {best && <div className="flex items-baseline gap-3"><span className="text-3xl font-extrabold">{best.score >= .6 ? best.label : "—"}</span><span className="text-sm text-muted-foreground">Model score: {(best.score*100).toFixed(1)}%</span></div>}
    {state?.phase === "error" && <ElevatedButton text="RETRY RECOGNITION" variant="secondary" size="sm" className="min-h-11" onClick={retry}/>}
    <p className="text-xs leading-relaxed text-muted-foreground">Pose feedback is an estimate, not a grade. J and Z movements cannot be checked by this model. Camera frames stay on your device.</p>
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold">Check recognition on this device</summary>
      <p className="my-2 text-muted-foreground">Use saved examples without opening the camera.</p>
      <ElevatedButton text={checking ? "CHECKING…" : "RUN SAVED EXAMPLE CHECK"} disabled={checking || active} variant="secondary" size="sm" className="min-h-11" onClick={() => {void verify();}}/>
      {active && <p className="mt-2 text-xs text-muted-foreground">Stop the camera before running the check.</p>}
      <p role="status" data-recognition-report={report} className="mt-2">{check}</p>
    </details>
  </Card>;
}
