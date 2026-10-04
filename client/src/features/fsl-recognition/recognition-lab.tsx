/*
 * EXPERIMENT: hidden "Recognition lab" panel (open a practice page with
 * `?lab=1`). Switch between baseline and enhanced settings, watch live
 * timings, and copy the results as JSON for the field test.
 */
import {useEffect,useState} from 'react';
import {BASELINE,ENHANCED,type BackgroundMode,type RecognitionSettings} from './experiment';
import {DEFAULT_GATES,type LockRules} from './gesture-lock';
import {recognitionMetrics} from './metrics';

const ms=(value:number)=>value?Math.round(value)+'ms':'–';

export function RecognitionLab({settings,onChange}:{settings:RecognitionSettings;onChange:(settings:RecognitionSettings)=>void}){
 const [summary,setSummary]=useState(recognitionMetrics.summary);
 const [copied,setCopied]=useState(false);
 const [condition,setCondition]=useState('');
 useEffect(()=>recognitionMetrics.subscribe(()=>setSummary(recognitionMetrics.summary())),[]);
 // Any settings change starts a fresh result set, so one export never mixes configurations.
 const apply=(next:RecognitionSettings)=>{recognitionMetrics.reset();onChange(next);};
 const custom=(patch:Partial<RecognitionSettings>)=>apply({...settings,...patch,profile:'custom'});
 // Empty or half-typed number fields are ignored instead of becoming 0.
 const gate=(key:'minScore'|'minMargin'|'maxMotion',raw:string)=>{const value=Number(raw);if(raw!==''&&Number.isFinite(value))custom({lock:{...settings.lock,[key]:value} as LockRules});};
 const profileButton=(preset:RecognitionSettings,label:string)=>(
  <button type="button" onClick={()=>apply(preset)}
   className={`rounded-full border px-3 py-1 font-bold ${settings.profile===preset.profile?'border-foreground bg-foreground text-background':'border-border'}`}>
   {label}
  </button>
 );
 const copy=()=>{void navigator.clipboard.writeText(recognitionMetrics.export(settings,condition)).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});};

 return (
  <section aria-label="Recognition lab" className="mt-3 space-y-3 rounded-lg border border-dashed border-foreground/40 bg-background p-3 font-mono text-xs">
   <div className="flex flex-wrap items-center gap-2">
    <span className="rounded bg-fuchsia-600 px-1.5 py-0.5 font-bold text-white">LAB</span>
    {profileButton(BASELINE,'Baseline')}
    {profileButton(ENHANCED,'Enhanced')}
    {settings.profile==='custom'&&<span className="font-bold">Custom</span>}
   </div>

   <label className="flex items-center gap-2">Condition
    <input value={condition} onChange={e=>setCondition(e.target.value)} placeholder="e.g. laptop · cluttered · dim" className="min-w-0 flex-1 rounded border border-border bg-background px-1 py-0.5"/>
   </label>

   <div className="grid gap-2 sm:grid-cols-2">
    <label className="flex items-center justify-between gap-2">Background (detection)
     <select value={settings.detectionBackground} onChange={e=>custom({detectionBackground:e.target.value as BackgroundMode})} className="rounded border border-border bg-background px-1 py-0.5">
      <option value="off">off</option><option value="blur">blur</option><option value="remove">remove</option>
     </select>
    </label>
    <label className="flex items-center justify-between gap-2">Alphabet tracking (VIDEO mode)
     <input type="checkbox" checked={settings.alphabetTracking} onChange={e=>custom({alphabetTracking:e.target.checked})}/>
    </label>
    <label className="flex items-center justify-between gap-2">Hand tracking on
     <select value={settings.delegate} onChange={e=>custom({delegate:e.target.value as RecognitionSettings['delegate']})} className="rounded border border-border bg-background px-1 py-0.5">
      <option value="CPU">CPU</option><option value="GPU">GPU (falls back to CPU)</option>
     </select>
    </label>
    <label className="flex items-center justify-between gap-2">Camera (restart camera)
     <select value={settings.cameraResolution} onChange={e=>custom({cameraResolution:e.target.value as RecognitionSettings['cameraResolution']})} className="rounded border border-border bg-background px-1 py-0.5">
      <option value="720p">1280×720</option><option value="480p">640×480</option>
     </select>
    </label>
    <label className="flex items-center justify-between gap-2">Alphabet hands
     <select value={settings.alphabetHands} onChange={e=>custom({alphabetHands:Number(e.target.value) as 1|2})} className="rounded border border-border bg-background px-1 py-0.5">
      <option value={1}>1</option><option value={2}>2</option>
     </select>
    </label>
    <label className="flex items-center justify-between gap-2">Preload model (reload page)
     <input type="checkbox" checked={settings.preload} onChange={e=>custom({preload:e.target.checked})}/>
    </label>
    <label className="flex items-center justify-between gap-2">Hold progress + hints
     <input type="checkbox" checked={settings.holdFeedback} onChange={e=>custom({holdFeedback:e.target.checked})}/>
    </label>
    <label className="flex items-center justify-between gap-2">Blurred preview
     <input type="checkbox" checked={settings.previewBlur} onChange={e=>custom({previewBlur:e.target.checked})}/>
    </label>
    <label className="flex items-center justify-between gap-2">Moving signs
     <select value={settings.dynamicCapture} onChange={e=>custom({dynamicCapture:e.target.value as RecognitionSettings['dynamicCapture']})} className="rounded border border-border bg-background px-1 py-0.5">
      <option value="fixed">fixed 2s clips</option><option value="sliding">sliding window</option>
     </select>
    </label>
    <label className="flex items-center justify-between gap-2">Alphabet poll (ms)
     <input type="number" min={33} step={10} value={settings.alphabetPollMs} onChange={e=>custom({alphabetPollMs:Math.max(33,Number(e.target.value)||200)})} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Hold to lock (ms)
     <input type="number" min={0} step={100} value={settings.lock.holdMs} onChange={e=>custom({lock:{...settings.lock,holdMs:Math.max(0,Number(e.target.value)||0)}})} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Frames to lock
     <input type="number" min={1} value={settings.lock.minFrames} onChange={e=>custom({lock:{...settings.lock,minFrames:Math.max(1,Number(e.target.value)||1)}})} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Min confidence
     <input type="number" min={0} max={1} step={.05} value={settings.lock.minScore??DEFAULT_GATES.minScore} onChange={e=>gate('minScore',e.target.value)} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Min margin
     <input type="number" min={0} max={1} step={.05} value={settings.lock.minMargin??DEFAULT_GATES.minMargin} onChange={e=>gate('minMargin',e.target.value)} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Max motion
     <input type="number" min={0} step={.005} value={settings.lock.maxMotion??DEFAULT_GATES.maxMotion} onChange={e=>gate('maxMotion',e.target.value)} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
    <label className="flex items-center justify-between gap-2">Bad frames forgiven
     <input type="number" min={0} value={settings.lock.graceFrames} onChange={e=>custom({lock:{...settings.lock,graceFrames:Math.max(0,Number(e.target.value)||0)}})} className="w-16 rounded border border-border bg-background px-1"/>
    </label>
   </div>

   <dl className="grid grid-cols-3 gap-2 border-t border-border pt-2 sm:grid-cols-6">
    <div><dt className="text-muted-foreground">FPS</dt><dd className="font-bold">{summary.fps?summary.fps.toFixed(1):'–'}</dd></div>
    <div><dt className="text-muted-foreground">detect</dt><dd className="font-bold">{ms(summary.captureMs)}</dd></div>
    <div><dt className="text-muted-foreground">segment</dt><dd className="font-bold">{ms(summary.segmentMs)}</dd></div>
    <div><dt className="text-muted-foreground">predict</dt><dd className="font-bold">{ms(summary.predictMs)}</dd></div>
    <div><dt className="text-muted-foreground">recognized</dt><dd className="font-bold">{summary.recognized}/{summary.trials} · {summary.wrongGuesses} wrong</dd></div>
    <div><dt className="text-muted-foreground">hand→correct</dt><dd className="font-bold">{ms(summary.msToCorrect)}</dd></div>
   </dl>

   <p className="text-muted-foreground">tracking on {summary.delegate??'–'} · {summary.preloaded?'preloaded':'not preloaded'} · waited for model {summary.modelWaitMs===undefined?'–':ms(summary.modelWaitMs)||'0ms'}</p>
   {Object.keys(summary.lockResets).length>0&&<p className="text-muted-foreground">lock resets: {Object.entries(summary.lockResets).map(([cause,n])=>cause+' ×'+n).join(' · ')}</p>}

   <div className="flex gap-2">
    <button type="button" onClick={()=>recognitionMetrics.reset()} className="rounded-full border border-border px-3 py-1 font-bold">Reset results</button>
    <button type="button" onClick={copy} className="rounded-full border border-border px-3 py-1 font-bold">{copied?'Copied!':'Copy results (JSON)'}</button>
   </div>
  </section>
 );
}
