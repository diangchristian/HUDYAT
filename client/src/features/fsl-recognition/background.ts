/*
 * EXPERIMENT: background blur/removal with MediaPipe's selfie segmenter.
 * process() returns a canvas the same orientation as the video (and the same
 * size unless `size` is given), so hand landmarks found on it line up with the raw camera.
 */
import {FilesetResolver,ImageSegmenter} from '@mediapipe/tasks-vision';
import type {BackgroundMode} from './experiment';
import {publicAsset as asset} from './registry';
const canvas=()=>{const c=document.createElement('canvas');const ctx=c.getContext('2d');if(!ctx)throw Error('This browser cannot prepare camera frames.');return [c,ctx] as const;};

// Person confidence below LOW is background, above HIGH is fully shown. Lower both if hands still fade; raise them if the room leaks in around the learner.
// LOW must stay below HIGH, or the mask inverts (the learner disappears and the room shows).
const MASK_LOW=.12,MASK_HIGH=.4;

/** picture: replaces the background in 'remove' mode (gray otherwise). size: output size (default: the video's).
 * segment: false reuses the last mask, so the model can run less often than frames are drawn. */
export type ProcessOptions={picture?:HTMLCanvasElement;size?:{width:number;height:number};segment?:boolean};

export type BackgroundProcessor=Awaited<ReturnType<typeof createBackgroundProcessor>>;

export async function createBackgroundProcessor(){
 const vision=await FilesetResolver.forVisionTasks(asset('mediapipe/wasm'));
 const segmenter=await ImageSegmenter.createFromOptions(vision,{
  baseOptions:{modelAssetPath:asset('mediapipe/selfie_segmenter.tflite'),delegate:'CPU'},
  runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false,
 });
 const [out,outCtx]=canvas(),[person,personCtx]=canvas(),[mask,maskCtx]=canvas(),[small,smallCtx]=canvas();
 let lastTimestamp=0,closed=false,image:ImageData|undefined;
 return {
  /** Composites one frame with the background blurred or removed. segmentMs is 0 when the last mask was reused. */
  process(video:HTMLVideoElement,mode:Exclude<BackgroundMode,'off'>,{picture,size,segment=true}:ProcessOptions={}){
   if(closed)throw Error('Background processor released');
   const started=performance.now();
   const w=size?.width??video.videoWidth,h=size?.height??video.videoHeight;
   for(const c of [out,person])if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
   let segmentMs=0;
   // The first frame always segments: there is no mask to reuse yet.
   if(segment||!image){
    // VIDEO mode needs strictly increasing timestamps.
    lastTimestamp=Math.max(lastTimestamp+1,started);
    const result=segmenter.segmentForVideo(video,lastTimestamp);
    try{
     const masks=result.confidenceMasks??[];
     // selfie_segmenter yields one person-confidence mask; take the last in case background is also returned.
     const confidence=masks[masks.length-1];
     if(!confidence)throw Error('Segmentation produced no mask.');
     const values=confidence.getAsFloat32Array();
     if(!image||mask.width!==confidence.width||mask.height!==confidence.height){mask.width=confidence.width;mask.height=confidence.height;image=maskCtx.createImageData(mask.width,mask.height);}
     // The selfie model is unsure about hands held out from the body (about 0.2-0.5), which drew them see-through.
     // Sharpen the mask: anything the model half-believes is a person becomes solid, with a short soft edge.
     for(let i=0;i<values.length;i++){const t=Math.min(1,Math.max(0,(values[i]-MASK_LOW)/(MASK_HIGH-MASK_LOW)));image.data[i*4+3]=t*t*(3-2*t)*255;}
     maskCtx.putImageData(image,0,0);
    }finally{result.close();}
    segmentMs=performance.now()-started;
   }
   if(mode==='blur'){
    // Downscale then upscale: a cheap blur that works where canvas `filter` doesn't (older Safari).
    // Resizing a canvas reallocates it, so only when the size changes.
    const sw=Math.max(1,Math.round(w/12)),sh=Math.max(1,Math.round(h/12));
    if(small.width!==sw||small.height!==sh){small.width=sw;small.height=sh;}
    smallCtx.drawImage(video,0,0,small.width,small.height);
    outCtx.imageSmoothingEnabled=true;outCtx.imageSmoothingQuality='high';
    outCtx.drawImage(small,0,0,w,h);
   }else if(picture){
    // Cover-fit: fill the frame, cropping the picture's overflow evenly.
    const scale=Math.max(w/picture.width,h/picture.height),pw=picture.width*scale,ph=picture.height*scale;
    outCtx.drawImage(picture,(w-pw)/2,(h-ph)/2,pw,ph);
   }else{
    outCtx.fillStyle='#808080';outCtx.fillRect(0,0,w,h);
   }
   personCtx.globalCompositeOperation='source-over';
   personCtx.clearRect(0,0,w,h);personCtx.drawImage(video,0,0,w,h);
   personCtx.globalCompositeOperation='destination-in';
   personCtx.imageSmoothingEnabled=true;personCtx.drawImage(mask,0,0,w,h);
   personCtx.globalCompositeOperation='source-over';
   outCtx.drawImage(person,0,0);
   return {canvas:out,segmentMs};
  },
  close(){if(!closed){closed=true;segmenter.close();}},
 };
}
