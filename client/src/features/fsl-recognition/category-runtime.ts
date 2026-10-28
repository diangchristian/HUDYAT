import * as tf from '@tensorflow/tfjs';
import { FaceLandmarker,HandLandmarker,FilesetResolver } from '@mediapipe/tasks-vision';
import {fetchCandidateRelease,fetchModelRelease,modelAssetUrl} from '../../api/model-api';
import {HAND_FACE_LOCATION,HAND_RELATIVE,HAND_RELATIVE_SEQUENCE,normalizeFrame,normalizeFrameLocation,normalizeSequence,type FacePoint} from './normalize';
import {resampleSign} from './sign-capture.js';
import {buildModel,loadWeights,packResult,resample,sha256} from './category-core.js';
import {BASELINE,runtimeOptions,type RuntimeOptions} from './experiment';
const BASELINE_OPTIONS=runtimeOptions(BASELINE);
export type Update={message:string;prediction?:string;score?:number;version?:string;ready?:boolean};
export type Prediction={message:string;prediction?:string;score?:number;margin?:number};
const cacheName='hudyat-model-files-v1';
async function artifact(url:string,hash:string,signal:AbortSignal,emit:(s:Update)=>void,label:string){
 const cache=await caches.open(cacheName),key=modelAssetUrl(url);
 const saved=await cache.match(key);
 if(saved){const bytes=await saved.arrayBuffer();if(await sha256(bytes)===hash)return bytes;await cache.delete(key);}
 emit({message:'Downloading '+label+'…'});
 const response=await fetch(key,{signal});if(!response.ok)throw Error('Model file download failed.');
 let bytes:ArrayBuffer;
 if(response.body){
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let received=0;
  const total=Number(response.headers.get('content-length'));
  while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;
   emit({message:'Downloading '+label+'… '+(total?Math.min(100,Math.round(received/total*100))+'%':(received/1048576).toFixed(1)+' MB')});}
  const joined=new Uint8Array(received);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}bytes=joined.buffer;
 }else bytes=await response.arrayBuffer();
 if(await sha256(bytes)!==hash)throw Error('Model file integrity check failed.');
 await cache.put(key,new Response(bytes));return bytes;
}
export async function downloadCategory(category:string,signal:AbortSignal,emit:(s:Update)=>void,candidate=false){
 if(!window.isSecureContext || !('caches' in window))throw Error('Recognition requires HTTPS or localhost.');
 emit({message:'Checking category model…'});
 const release=candidate?await fetchCandidateRelease(category,signal):await fetchModelRelease(category,signal);
 const metadata=JSON.parse(new TextDecoder().decode(await artifact(release.modelUrl,release.modelSha256,signal,emit,'model details')));
 // Every model names how its landmarks are normalized; one that doesn't (or names another) would get wrong numbers.
 const normalization=metadata.preprocessing?.normalization,faceLocation=normalization===HAND_FACE_LOCATION;
 if(metadata.category!==release.id || metadata.format!=='fsl-conv1d-bilstm-v1'||metadata.inputShape?.join(',')!==(faceLocation?'32,141':'32,128')
  ||![HAND_RELATIVE,HAND_RELATIVE_SEQUENCE,HAND_FACE_LOCATION].includes(normalization)||(faceLocation&&!(release.faceUrl&&release.faceSha256)))throw Error('Unsupported category model.');
 const weights=await artifact(release.weightsUrl,release.weightsSha256,signal,emit,'recognition model');
 const hand=await artifact(release.handUrl,release.handSha256,signal,emit,'hand detector');
 // The face detector is downloaded only for models that use where the hands are against the face (Family).
 const face=faceLocation?await artifact(release.faceUrl!,release.faceSha256!,signal,emit,'face detector'):undefined;
 return {release,metadata,weights,hand,face};
}
export async function createCategoryRuntime(category:string,signal:AbortSignal,emit:(s:Update)=>void,options:RuntimeOptions=BASELINE_OPTIONS){
 const {release,metadata,weights,hand,face}=await downloadCategory(category,signal,emit,category==='alphabet'&&options.alphabetModel==='candidate');
 // Models trained on hand-relative landmarks get the same normalization at prediction time.
 // handRelative: each frame on its own; handRelativeSequence: the whole clip (the wrist moves from its first frame).
 const handRelative=metadata.preprocessing?.normalization===HAND_RELATIVE;
 const handRelativeSequence=metadata.preprocessing?.normalization===HAND_RELATIVE_SEQUENCE;
 // faceLocation (Family): each frame as handRelative, plus where the hands are against the face found in that frame.
 const faceLocation=metadata.preprocessing?.normalization===HAND_FACE_LOCATION,features=faceLocation?141:128;
 const frameFaces=new WeakMap<Float32Array,FacePoint[]|null>();
 // Each captured frame remembers the size of the image it came from, for normalization.
 const frameSizes=new WeakMap<Float32Array,{width:number;height:number}>();
 if(signal.aborted)throw Error('Cancelled');
 emit({message:'Starting recognition engine…',version:release.version});
 await tf.ready();
 const model=buildModel(tf,metadata.classes.length,features);
 let detector:HandLandmarker|undefined,faceDetector:FaceLandmarker|undefined;
 try {
  loadWeights(tf,model,metadata,weights);
  emit({message:'Starting hand tracking…',version:release.version});
  const vision=await FilesetResolver.forVisionTasks(import.meta.env.BASE_URL+'mediapipe/wasm');
  const alphabet=release.id==='alphabet',imageMode=alphabet&&!options.alphabetTracking;
  const createDetector=(delegate:'CPU'|'GPU')=>HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetBuffer:new Uint8Array(hand),delegate},runningMode:imageMode?'IMAGE':'VIDEO',numHands:alphabet?options.alphabetHands:2,
   minHandDetectionConfidence:metadata.preprocessing.extraction.detection_confidence,minHandPresenceConfidence:metadata.preprocessing.extraction.detection_confidence,minTrackingConfidence:.5});
  let delegate=options.delegate;
  try{detector=await createDetector(delegate);}
  catch(error){
   if(delegate==='CPU')throw error;
   // GPU needs WebGL2 support MediaPipe can use; older phones/tablets refuse it, so fall back.
   console.warn('GPU hand tracking unavailable; using CPU.',error);
   delegate='CPU';detector=await createDetector(delegate);
  }
  if(face){
   emit({message:'Starting face tracking…',version:release.version});
   const createFace=(d:'CPU'|'GPU')=>FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetBuffer:new Uint8Array(face),delegate:d},runningMode:imageMode?'IMAGE':'VIDEO',numFaces:1});
   try{faceDetector=await createFace(delegate);}
   catch(error){if(delegate==='CPU')throw error;console.warn('GPU face tracking unavailable; using CPU.',error);faceDetector=await createFace('CPU');}
  }
  let lastTimestamp=0;
  const score=async(input:tf.Tensor):Promise<Prediction>=>{
   let output:tf.Tensor|undefined;
   try{output=model.predict(input) as tf.Tensor;const scores=await output.data();const index=scores.indexOf(Math.max(...scores));
    return {message:scores[index]>=.6?'Model estimate — compare with the reference.':'Not sure yet. Try the sign again.',prediction:metadata.classes[index] as string,score:scores[index],margin:scores[index]-Math.max(...Array.from(scores).filter((_,i)=>i!==index))};
   }finally{input.dispose();output?.dispose();}
  };
  if(signal.aborted)throw Error('Cancelled');
  let disposed=false;
  return {version:release.version,category:release.id,classes:metadata.classes as string[],delegate,handRelative,handRelativeSequence,faceLocation,
   capture(video:HTMLVideoElement|HTMLCanvasElement){
    if(disposed)throw Error('Model released');
    const size=video instanceof HTMLVideoElement?{width:video.videoWidth,height:video.videoHeight}:{width:video.width,height:video.height};
    let frame:Float32Array,faces:{faceLandmarks:FacePoint[][]}|undefined;
    if(imageMode){frame=packResult(detector!.detect(video),metadata.preprocessing.extraction.swap_hands);faces=faceDetector?.detect(video);}
    else{
     // VIDEO mode requires strictly increasing timestamps.
     lastTimestamp=Math.max(lastTimestamp+1,performance.now());
     frame=packResult(detector!.detectForVideo(video,lastTimestamp),metadata.preprocessing.extraction.swap_hands);
     // The face on the same (unmirrored) frame and timestamp as the hands.
     faces=faceDetector?.detectForVideo(video,lastTimestamp);
    }
    frameSizes.set(frame,size);
    if(faceDetector)frameFaces.set(frame,faces?.faceLandmarks[0]??null);
    return frame;
   },
   async predict(frames:Float32Array[]):Promise<Prediction>{
    if(disposed)throw Error('Model released');
    // Frames stay raw (steadiness and hints use them); only the model's input is normalized.
    const sizeOf=(frame:Float32Array)=>frameSizes.get(frame)??{width:0,height:0};
    let modelFrames=frames;
    if(faceLocation){
     // Interpolated like the training samples: a hand's location only between frames that both have the hand and the face.
     const located=frames.map(frame=>{const size=sizeOf(frame);return normalizeFrameLocation(frame,frameFaces.get(frame)??null,size.width,size.height);});
     if(!located.some(f=>f[126]||f[127]))return {message:'No hand detected.'};
     return score(tf.tensor3d(Float32Array.from(resampleSign(located).flat()),[1,32,141]));
    }
    if(handRelative)modelFrames=frames.map(frame=>{const size=sizeOf(frame);return normalizeFrame(frame,size.width,size.height);});
    // A clip comes from one camera, so its first frame's size is the clip's.
    else if(handRelativeSequence&&frames.length){const size=sizeOf(frames[0]!);modelFrames=normalizeSequence(frames,size.width,size.height);}
    // Checked after normalization: a hand that can't be scaled is dropped, never sent as zeros.
    if(!modelFrames.some(f=>f[126]||f[127]))return {message:'No hand detected.'};
    return score(tf.tensor3d(resample(modelFrames),[1,32,128]));
   },
   /** DABEST: the size of the image a captured frame came from. */
   frameSize(frame:Float32Array){return frameSizes.get(frame)??{width:0,height:0};},
   /** DABEST: a captured frame as the model sees it (hand-relative when the model is). */
   normalize(frame:Float32Array){
    const size=frameSizes.get(frame)??{width:0,height:0};
    if(faceLocation)return normalizeFrameLocation(frame,frameFaces.get(frame)??null,size.width,size.height);
    if(!handRelative)return frame;
    return normalizeFrame(frame,size.width,size.height);
   },
   /** Whether a face was found in a captured frame (null: this model does not look for faces). */
   faceFound(frame:Float32Array){return faceDetector?Boolean(frameFaces.get(frame)):null;},
   /** DABEST: predict a ready 32 x 128 input (32 x 141 for faceLocation; from sign-capture's recommendedInput). */
   async predictInput(rows:ArrayLike<number>[]){
    if(disposed)throw Error('Model released');
    if(rows.length!==32||rows.some(row=>row.length!==features))throw Error('The model needs 32 frames of '+features+' values.');
    // As in predict(): a clip whose hands were all dropped by normalization is never sent as zeros.
    if(!rows.some(row=>row[126]||row[127]))return {message:'No hand detected.'};
    const input=new Float32Array(32*features);rows.forEach((row,t)=>input.set(row,t*features));
    return score(tf.tensor3d(input,[1,32,features]));
   },
   dispose(){if(!disposed){disposed=true;detector?.close();faceDetector?.close();model.dispose();}}
  };
 }catch(error){detector?.close();faceDetector?.close();model.dispose();throw error;}
}
export type CategoryRuntime=Awaited<ReturnType<typeof createCategoryRuntime>>;
