/*
 * EXPERIMENT (feature/recog-enhancement): switchable recognition
 * enhancements so they can be A/B tested against today's behavior on
 * real devices. "baseline" reproduces the pre-experiment pipeline exactly.
 * Open any practice page with `?lab=1` to show the Recognition lab panel.
 */
import {DEFAULT_LOCK_RULES,type LockRules} from './gesture-lock';
import type {SlidingWindowOptions} from './sliding-window';

/** What the segmenter does to the background before hand detection. */
export type BackgroundMode='off'|'blur'|'remove';

export type RecognitionSettings={
 profile:'baseline'|'enhanced'|'custom';
 /** Alphabet: ms between frames. */
 alphabetPollMs:number;
 lock:LockRules;
 /** Moving signs: fixed 2s clips (today) or a sliding window. */
 dynamicCapture:'fixed'|'sliding';
 window:SlidingWindowOptions;
 /** Background processing applied to the frames the hand detector sees. */
 detectionBackground:BackgroundMode;
 /** Show the learner a background-blurred preview instead of the raw camera. */
 previewBlur:boolean;
 /** Alphabet: track the hand between frames (VIDEO mode) instead of re-detecting it every frame. */
 alphabetTracking:boolean;
 /** Where MediaPipe runs hand tracking; GPU falls back to CPU if it can't start. */
 delegate:'CPU'|'GPU';
 /** Camera frame size requested from the browser. Applies the next time the camera starts. */
 cameraResolution:'720p'|'480p';
 /** Alphabet signs use one hand; looking for two costs time every frame. */
 alphabetHands:1|2;
 /** Start the model and hand tracker when the page opens, not at the camera step. */
 preload:boolean;
 /** Show hold progress and coaching ("Hold still") while a sign is being recognized. */
 holdFeedback:boolean;
 /** Alphabet model: the published release, or the retrained candidate (candidate.json). */
 alphabetModel:'published'|'candidate';
};

export type RuntimeOptions=Pick<RecognitionSettings,'alphabetTracking'|'delegate'|'alphabetHands'|'alphabetModel'>;
export const runtimeOptions=(settings:RecognitionSettings):RuntimeOptions=>({alphabetTracking:settings.alphabetTracking,delegate:settings.delegate,alphabetHands:settings.alphabetHands,alphabetModel:settings.alphabetModel});
export const CAMERA_SIZE={'720p':{width:1280,height:720},'480p':{width:640,height:480}} as const;

export const BASELINE:RecognitionSettings={
 profile:'baseline',alphabetPollMs:200,lock:DEFAULT_LOCK_RULES,
 dynamicCapture:'fixed',window:{spanMs:2000,minSpanMs:1800,everyMs:500,minFrames:8,agree:2},
 detectionBackground:'off',previewBlur:false,
 alphabetTracking:false,delegate:'CPU',cameraResolution:'720p',alphabetHands:2,preload:false,holdFeedback:false,alphabetModel:'published',
};

export const ENHANCED:RecognitionSettings={
 ...BASELINE,profile:'enhanced',alphabetPollMs:100,
 lock:{holdMs:700,minFrames:4,graceFrames:1},
 dynamicCapture:'sliding',
 alphabetTracking:true,delegate:'GPU',cameraResolution:'480p',alphabetHands:1,preload:true,holdFeedback:true,
 // Blur stays off (inherited): segmentation costs a second model per frame. Test it separately.
};

const KEY='hudyat-recognition-settings';

/** Saved lab settings apply only while the lab is on, so a forgotten test profile can't leak into normal use. */
export function loadSettings():RecognitionSettings{
 if(!isLabEnabled())return BASELINE;
 try{
  const saved=localStorage.getItem(KEY);
  if(saved){
   const parsed=JSON.parse(saved) as Partial<RecognitionSettings>;
   // Named profiles always mean their current definition; only custom settings are restored field by field.
   if(parsed.profile==='baseline')return BASELINE;
   if(parsed.profile==='enhanced')return ENHANCED;
   return {...BASELINE,...parsed,lock:{...BASELINE.lock,...parsed.lock}};
  }
 }catch{/* storage blocked or corrupt: fall back */}
 return BASELINE;
}

export function saveSettings(settings:RecognitionSettings){
 try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{/* ignore */}
}

/** `?lab=1` turns the lab on for this tab; `?lab=0` turns it off. */
export function isLabEnabled(){
 try{
  const param=new URLSearchParams(location.search).get('lab');
  if(param!==null)sessionStorage.setItem('hudyat-lab',param);
  return sessionStorage.getItem('hudyat-lab')==='1';
 }catch{return false;}
}
