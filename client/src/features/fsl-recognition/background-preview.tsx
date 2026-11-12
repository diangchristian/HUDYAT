/*
 * Display-only camera background (blur or a built-in picture). Draws a segmented
 * copy of the camera over the raw <video>; hand detection still reads the raw
 * frames unless the lab's detection background setting is also on.
 */
import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';
import type {BackgroundProcessor} from './background';
import {publicAsset} from './registry';
import {CAMERA_BACKGROUNDS,type CameraBackground} from '@/lib/camera-background';

/** Composite at the size the preview is shown (sharp up to 2x pixel density), not the full camera frame. */
function previewSize(video:HTMLVideoElement,canvas:HTMLCanvasElement){
 const vw=video.videoWidth,vh=video.videoHeight;
 const shown=Math.min(canvas.clientWidth/vw,canvas.clientHeight/vh)*Math.min(devicePixelRatio||1,2);
 const scale=Math.min(1,shown>0?shown:1);
 return {width:Math.max(1,Math.round(vw*scale)),height:Math.max(1,Math.round(vh*scale))};
}

type Look={mode:'blur'}|{mode:'remove';picture:HTMLCanvasElement};

export function BackgroundPreview({video,choice,className}:{video:RefObject<HTMLVideoElement|null>;choice:Exclude<CameraBackground,'off'>;className?:string}){
 const target=useRef<HTMLCanvasElement|null>(null);
 // Read by the draw loop, so switching backgrounds doesn't restart the segmenter.
 const look=useRef<Look|null>(null);
 useEffect(()=>{
  if(choice==='blur'){look.current={mode:'blur'};return;}
  const src=CAMERA_BACKGROUNDS.find(b=>b.id===choice)?.src;
  if(!src)return;
  let stale=false;
  const image=new Image();
  // Until it loads, the previous look stays (or the raw camera shows through the empty canvas).
  image.onload=()=>{
   if(stale)return;
   // Rasterize once: redrawing an SVG every frame is slow on phones.
   const picture=document.createElement('canvas');
   picture.width=image.naturalWidth||1280;picture.height=image.naturalHeight||720;
   picture.getContext('2d')?.drawImage(image,0,0,picture.width,picture.height);
   look.current={mode:'remove',picture};
  };
  image.onerror=()=>console.warn('Camera background picture could not load:',src);
  image.src=publicAsset(src);
  return ()=>{stale=true;};
 },[choice]);
 useEffect(()=>{
  let cancelled=false,frame=0,processor:BackgroundProcessor|undefined,lastDraw=0,lastSegment=0,segmentCost=0;
  const draw=(now:number)=>{
   if(cancelled)return;
   const element=video.current,canvas=target.current,current=look.current;
   // ~30fps is plenty for a preview and halves the cost of a 60Hz loop.
   if(processor&&current&&element&&canvas&&element.readyState>=2&&now-lastDraw>=33){
    lastDraw=now;
    try{
     // Run the person model at most ~15fps, and slower on phones where it is slow (≤ ~1/3 of the main thread),
     // so hand detection keeps its share. Between runs the last mask is reused.
     const segment=now-lastSegment>=Math.max(66,segmentCost*3);
     const options={size:previewSize(element,canvas),segment};
     const {canvas:processed,segmentMs}=current.mode==='blur'?processor.process(element,'blur',options):processor.process(element,'remove',{...options,picture:current.picture});
     if(segmentMs>0){lastSegment=now;segmentCost=segmentMs;}
     if(canvas.width!==processed.width||canvas.height!==processed.height){canvas.width=processed.width;canvas.height=processed.height;}
     canvas.getContext('2d')?.drawImage(processed,0,0);
    }catch(error){console.warn('Camera background stopped:',error);return;}
   }
   frame=requestAnimationFrame(draw);
  };
  void import('./background').then(m=>m.createBackgroundProcessor()).then(value=>{
   if(cancelled){value.close();return;}
   processor=value;frame=requestAnimationFrame(draw);
  }).catch(error=>console.warn('Camera background unavailable:',error));
  return ()=>{cancelled=true;cancelAnimationFrame(frame);processor?.close();};
 },[video]);
 return <canvas ref={target} aria-hidden="true" className={className}/>;
}
