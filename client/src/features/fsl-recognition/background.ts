/*
 * EXPERIMENT: background blur/removal with MediaPipe's selfie segmenter.
 * process() returns a canvas the same size and orientation as the video,
 * so hand landmarks found on it line up exactly with the raw camera.
 */
import {FilesetResolver,ImageSegmenter} from '@mediapipe/tasks-vision';
import type {BackgroundMode} from './experiment';
import {publicAsset as asset} from './registry';
const canvas=()=>{const c=document.createElement('canvas');const ctx=c.getContext('2d');if(!ctx)throw Error('This browser cannot prepare camera frames.');return [c,ctx] as const;};

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
  /** Composites one frame with the background blurred or removed. */
  process(video:HTMLVideoElement,mode:Exclude<BackgroundMode,'off'>){
   if(closed)throw Error('Background processor released');
   const started=performance.now();
   const w=video.videoWidth,h=video.videoHeight;
   for(const c of [out,person])if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
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
    for(let i=0;i<values.length;i++)image.data[i*4+3]=Math.round(values[i]*255);
    maskCtx.putImageData(image,0,0);
   }finally{result.close();}
   if(mode==='blur'){
    // Downscale then upscale: a cheap blur that works where canvas `filter` doesn't (older Safari).
    small.width=Math.max(1,Math.round(w/12));small.height=Math.max(1,Math.round(h/12));
    smallCtx.drawImage(video,0,0,small.width,small.height);
    outCtx.imageSmoothingEnabled=true;outCtx.imageSmoothingQuality='high';
    outCtx.drawImage(small,0,0,w,h);
   }else{
    outCtx.fillStyle='#808080';outCtx.fillRect(0,0,w,h);
   }
   personCtx.globalCompositeOperation='source-over';
   personCtx.clearRect(0,0,w,h);personCtx.drawImage(video,0,0,w,h);
   personCtx.globalCompositeOperation='destination-in';
   personCtx.imageSmoothingEnabled=true;personCtx.drawImage(mask,0,0,w,h);
   personCtx.globalCompositeOperation='source-over';
   outCtx.drawImage(person,0,0);
   return {canvas:out,segmentMs:performance.now()-started};
  },
  close(){if(!closed){closed=true;segmenter.close();}},
 };
}
