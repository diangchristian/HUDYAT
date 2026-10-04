/*
 * EXPERIMENT: display-only background blur. Draws a segmented copy of the
 * camera over the raw <video>; hand detection still reads the raw frames
 * unless the detection background setting is also on.
 */
import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';
import type {BackgroundProcessor} from './background';

export function BlurredPreview({video,className}:{video:RefObject<HTMLVideoElement|null>;className?:string}){
 const target=useRef<HTMLCanvasElement|null>(null);
 useEffect(()=>{
  let cancelled=false,frame=0,processor:BackgroundProcessor|undefined,lastDraw=0;
  const draw=(now:number)=>{
   if(cancelled)return;
   const element=video.current,canvas=target.current;
   // ~30fps is plenty for a preview and halves the cost of a 60Hz loop.
   if(processor&&element&&canvas&&element.readyState>=2&&now-lastDraw>=33){
    lastDraw=now;
    try{
     const {canvas:processed}=processor.process(element,'blur');
     if(canvas.width!==processed.width||canvas.height!==processed.height){canvas.width=processed.width;canvas.height=processed.height;}
     canvas.getContext('2d')?.drawImage(processed,0,0);
    }catch(error){console.warn('Blurred preview stopped:',error);return;}
   }
   frame=requestAnimationFrame(draw);
  };
  void import('./background').then(m=>m.createBackgroundProcessor()).then(value=>{
   if(cancelled){value.close();return;}
   processor=value;frame=requestAnimationFrame(draw);
  }).catch(error=>console.warn('Blurred preview unavailable:',error));
  return ()=>{cancelled=true;cancelAnimationFrame(frame);processor?.close();};
 },[video]);
 return <canvas ref={target} aria-hidden="true" className={className}/>;
}
