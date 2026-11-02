import {useEffect,useState} from 'react';
import {evaluateDiagnostics,landmarkDiagnostics} from './landmark-diagnostics';

/** FT-06 test tool, shown only with `?diagnostics=1`. */
export function LandmarkDiagnosticsPanel(){
 const [state,setState]=useState(landmarkDiagnostics.summary);
 const [copied,setCopied]=useState(false);
 useEffect(()=>{
  // Each camera view is a fresh test run.
  landmarkDiagnostics.reset();
  return landmarkDiagnostics.subscribe(()=>setState(landmarkDiagnostics.summary()));
 },[]);
 const {result,checks}=evaluateDiagnostics(state);
 const copy=()=>{void navigator.clipboard.writeText(landmarkDiagnostics.export()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});};
 const rows:[string,string|number][]=[
  ['Target sign',state.target??'–'],
  ['Frames captured',state.frames],
  ['Frames with a hand',state.framesWithHand],
  ['Hands in latest frame',state.latestHands],
  ['Values per frame',state.frameLength||'–'],
  ['Landmarks per hand',state.latestLandmarksPerHand.join(', ')||'–'],
  ['Frames with invalid data',state.invalidFrames],
  ['Model calls with hand data',state.modelCalls],
  ['Frames in latest model call',state.latestClipFrames||'–'],
  ['Latest prediction',state.latestPrediction?`${state.latestPrediction} (${(state.latestScore??0).toFixed(2)})`:'–'],
 ];

 return (
  <section aria-label="Landmark diagnostics" className="mt-3 space-y-2 rounded-lg border border-dashed border-foreground/40 bg-background p-3 text-left font-mono text-xs">
   <div className="flex flex-wrap items-center gap-2">
    <span className="font-bold">FT-06 Landmark diagnostics</span>
    <span role="status" className={`rounded px-2 py-0.5 font-bold text-white ${result==='PASS'?'bg-green-700':'bg-gray-600'}`}>{result}</span>
    <button type="button" onClick={()=>landmarkDiagnostics.reset()} className="ml-auto cursor-pointer rounded border border-border px-2 py-1">Reset</button>
    <button type="button" onClick={copy} className="cursor-pointer rounded border border-border px-2 py-1">{copied?'Copied':'Copy result'}</button>
   </div>
   <ul className="space-y-0.5">
    {checks.map(check=><li key={check.label}>{check.passed?'[x]':'[ ]'} {check.label}</li>)}
   </ul>
   <dl className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
    {rows.map(([label,value])=>(
     <div key={label} className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="font-bold">{value}</dd>
     </div>
    ))}
   </dl>
  </section>
 );
}
