import {useEffect,useEffectEvent,useRef,useState} from 'react';
import type {RefObject} from 'react';
import type {CategoryRuntime} from './category-runtime';
import type {BackgroundProcessor} from './background';
import {BASELINE,type RecognitionSettings} from './experiment';
import {advanceLock,emptyLock,isSteady,lockResetCause,matchesTarget,createMatchCompletion} from './gesture-lock';
import {recognitionMetrics,type FrameTiming} from './metrics';
import {createSlidingWindow} from './sliding-window';

export type RecognitionStatus={phase:'loading'|'ready'|'running'|'error';message:string;version?:string};

/** Headless recognition: no predictions or overlays are rendered. */
export function CategoryRecognition({category,targetLabel,video,active,onCorrect,onWrong,onStatus,retry,settings=BASELINE}:{category:string;targetLabel?:string;video:RefObject<HTMLVideoElement|null>;active:boolean;onCorrect:()=>void;onWrong:()=>void;onStatus:(status:RecognitionStatus)=>void;retry:number;settings?:RecognitionSettings}){
 const [ready,setReady]=useState(false);
 const runtime=useRef<CategoryRuntime|null>(null),inFlight=useRef(false);
 // EXPERIMENT: optional background segmentation before hand detection.
 const background=useRef<BackgroundProcessor|null>(null);
 const [backgroundReady,setBackgroundReady]=useState(false);
 const backgroundMode=settings.detectionBackground;
 const notifyCorrect=useEffectEvent(onCorrect);
 const notifyWrong=useEffectEvent(onWrong);
 const notifyStatus=useEffectEvent(onStatus);
 useEffect(()=>{
  const abort=new AbortController();let loaded:CategoryRuntime|undefined;
  void import('./category-runtime').then(m=>m.createCategoryRuntime(category,abort.signal,s=>{if(!abort.signal.aborted)notifyStatus({phase:'loading',message:s.message,version:s.version});}))
   .then(value=>{loaded=value;if(abort.signal.aborted){value.dispose();return;}runtime.current=value;setReady(true);notifyStatus({phase:'ready',message:'Model ready',version:value.version});})
   .catch(error=>{if(!abort.signal.aborted)notifyStatus({phase:'error',message:error instanceof Error?error.message:'Could not load the model.'});});
  return ()=>{abort.abort();runtime.current=null;const release=()=>{if(inFlight.current)setTimeout(release,20);else loaded?.dispose();};release();};
 },[category,retry]);
 useEffect(()=>{
  if(backgroundMode==='off')return;
  let cancelled=false,loaded:BackgroundProcessor|undefined;
  void import('./background').then(m=>m.createBackgroundProcessor())
   .then(value=>{loaded=value;if(cancelled){value.close();return;}background.current=value;setBackgroundReady(true);})
   .catch(error=>{if(!cancelled)notifyStatus({phase:'error',message:error instanceof Error?error.message:'Could not start background processing.'});});
  return ()=>{cancelled=true;background.current=null;setBackgroundReady(false);const release=()=>{if(inFlight.current)setTimeout(release,20);else loaded?.close();};release();};
 },[backgroundMode,retry]);
 useEffect(()=>{
  if(!active||!ready||!targetLabel||(backgroundMode!=='off'&&!backgroundReady))return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>;let frames:Float32Array[]=[],start=0,lastTime=-1;
  let lock=emptyLock(),previous:Float32Array|undefined;let previousProcessingMs=0;
  const newWindow=()=>settings.dynamicCapture==='sliding'?createSlidingWindow(settings.window):undefined;
  let sliding=newWindow();
  recognitionMetrics.prompt(targetLabel,performance.now());
  const completion=createMatchCompletion(targetLabel,
   ()=>{recognitionMetrics.correct(targetLabel,performance.now());notifyCorrect();},
   label=>{recognitionMetrics.wrong(targetLabel,label);notifyWrong();});
  const run=async()=>{
   const current=runtime.current,element=video.current;
   let ownsInference=false,timing:FrameTiming|undefined;
   try{
    if(document.hidden){lock=emptyLock();previous=undefined;frames=[];start=0;}
    else if(!cancelled&&current&&element&&element.readyState>=2&&!inFlight.current&&element.currentTime!==lastTime){
     lastTime=element.currentTime;inFlight.current=true;ownsInference=true;
     if(!current.classes.some(label=>matchesTarget(label,targetLabel))){notifyStatus({phase:'error',message:'This sign is not in the downloaded model.',version:current.version});return;}
     const frameStarted=performance.now();
     const processed=backgroundMode!=='off'&&background.current?background.current.process(element,backgroundMode):undefined;
     const captureStarted=performance.now();
     const frame=current.capture(processed?.canvas??element),present=Boolean(frame[126]||frame[127]);
     const frameTiming:FrameTiming={at:frameStarted,segmentMs:processed?.segmentMs??0,captureMs:performance.now()-captureStarted};timing=frameTiming;
     completion.observePresence(present,performance.now());
     if(present)recognitionMetrics.handSeen(targetLabel,frameStarted);
     const predict=async(input:Float32Array[])=>{const t=performance.now();const result=await current.predict(input);frameTiming.predictMs=performance.now()-t;return result;};
     if(current.category==='alphabet'){
      const result=present?await predict([frame]):undefined;
      if(cancelled)return;
      const lockInput={now:performance.now(),present,label:result?.prediction,score:result?.score,margin:result?.margin,steady:isSteady(previous,frame),maxGapMs:Math.max(600,previousProcessingMs+(performance.now()-frameStarted)+350)};
      const before=lock;lock=advanceLock(lock,lockInput,settings.lock);
      const resetCause=lockResetCause(before,lock,lockInput);if(resetCause)recognitionMetrics.lockReset(resetCause);
      previous=frame;previousProcessingMs=performance.now()-frameStarted;
      notifyStatus({phase:'running',message:present?'Recognition running · hold your sign steady':'Recognition running · no hand detected',version:current.version});
      if(lock.locked){completion.accept(lock.locked);lock=emptyLock();}
     }else{
      notifyStatus({phase:'running',message:present?'Recognition running · checking gesture':'Recognition running · no hand detected',version:current.version});
      if(sliding){
      const clip=sliding.push(frame,performance.now());
      if(clip){
       const result=await predict(clip);
       if(cancelled)return;
       const accepted=sliding.vote(result);
       if(accepted)completion.accept(accepted);
      }
      }else{
      // Start a complete two-second clip when a hand enters view; retry automatically.
      if(!start && !present)return;
      if(!start)start=performance.now();frames.push(frame);
      if(performance.now()-start>=2000){
       const result=frames.length>=8?await predict(frames):undefined;frames=[];start=0;
       if(cancelled)return;
       if(result?.prediction && (result.score??0)>=.8 && (result.margin??0)>=.15)completion.accept(result.prediction);
      }
      }
     }
    }
   }catch(error){if(!cancelled){lock=emptyLock();frames=[];start=0;sliding=newWindow();notifyStatus({phase:'error',message:error instanceof Error?error.message:'Recognition failed.'});}}
   finally{if(timing&&!cancelled)recognitionMetrics.frame(timing);if(ownsInference)inFlight.current=false;if(!cancelled&&!completion.completed())timer=setTimeout(run,category==='alphabet'?settings.alphabetPollMs:40);}
  };
  void run();return()=>{cancelled=true;clearTimeout(timer);};
 },[active,ready,category,targetLabel,video,retry,settings,backgroundMode,backgroundReady]);
 return null;
}
