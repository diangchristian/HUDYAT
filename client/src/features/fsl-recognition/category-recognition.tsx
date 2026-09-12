import {useEffect,useEffectEvent,useRef,useState} from 'react';
import type {RefObject} from 'react';
import type {CategoryRuntime} from './category-runtime';
import {advanceLock,emptyLock,isSteady,matchesTarget,createMatchCompletion} from './gesture-lock';

/** Headless recognition: no predictions or overlays are rendered. */
export function CategoryRecognition({category,targetLabel,video,active,onCorrect,onWrong}:{category:string;targetLabel?:string;video:RefObject<HTMLVideoElement|null>;active:boolean;onCorrect:()=>void;onWrong:()=>void}){
 const [ready,setReady]=useState(false);
 const runtime=useRef<CategoryRuntime|null>(null),inFlight=useRef(false);
 const notifyCorrect=useEffectEvent(onCorrect);
 const notifyWrong=useEffectEvent(onWrong);
 useEffect(()=>{
  const abort=new AbortController();let loaded:CategoryRuntime|undefined;
  void import('./category-runtime').then(m=>m.createCategoryRuntime(category,abort.signal,()=>{}))
   .then(value=>{loaded=value;if(abort.signal.aborted){value.dispose();return;}runtime.current=value;setReady(true);})
   .catch(error=>{if(!abort.signal.aborted)console.error('Category recognition unavailable:',error);});
  return ()=>{abort.abort();runtime.current=null;const release=()=>{if(inFlight.current)setTimeout(release,20);else loaded?.dispose();};release();};
 },[category]);
 useEffect(()=>{
  if(!active||!ready||!targetLabel)return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>;let frames:Float32Array[]=[],start=0,lastTime=-1;
  let lock=emptyLock(),previous:Float32Array|undefined;
  const completion=createMatchCompletion(targetLabel,()=>notifyCorrect(),()=>notifyWrong());
  const run=async()=>{
   const current=runtime.current,element=video.current;
   let ownsInference=false;
   try{
    if(document.hidden){lock=emptyLock();previous=undefined;frames=[];start=0;}
    else if(!cancelled&&current&&element&&element.readyState>=2&&!inFlight.current&&element.currentTime!==lastTime){
     lastTime=element.currentTime;inFlight.current=true;ownsInference=true;
     if(!current.classes.some(label=>matchesTarget(label,targetLabel)))return;
     const frame=current.capture(element),present=Boolean(frame[126]||frame[127]);
     completion.observePresence(present,performance.now());
     if(current.category==='alphabet'){
      const result=present?await current.predict([frame]):undefined;
      if(cancelled)return;
      lock=advanceLock(lock,{now:performance.now(),present,label:result?.prediction,score:result?.score,margin:result?.margin,steady:isSteady(previous,frame)});
      previous=frame;
      if(lock.locked){completion.accept(lock.locked);lock=emptyLock();}
     }else{
      // Start a complete two-second clip when a hand enters view; retry automatically.
      if(!start && !present)return;
      if(!start)start=performance.now();frames.push(frame);
      if(performance.now()-start>=2000){
       const result=frames.length>=8?await current.predict(frames):undefined;frames=[];start=0;
       if(cancelled)return;
       if(result?.prediction && (result.score??0)>=.8 && (result.margin??0)>=.15)completion.accept(result.prediction);
      }
     }
    }
   }catch(error){if(!cancelled){lock=emptyLock();frames=[];start=0;console.error('Recognition failed:',error);}}
   finally{if(ownsInference)inFlight.current=false;if(!cancelled&&!completion.completed())timer=setTimeout(run,category==='alphabet'?200:40);}
  };
  void run();return()=>{cancelled=true;clearTimeout(timer);};
 },[active,ready,category,targetLabel,video]);
 return null;
}
