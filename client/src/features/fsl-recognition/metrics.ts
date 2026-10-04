/*
 * EXPERIMENT: timing and outcome measurements for the Recognition lab.
 * CategoryRecognition writes; the lab panel reads via subscribe().
 */
import type {RecognitionSettings} from './experiment';

export type FrameTiming={at:number;captureMs:number;segmentMs:number;predictMs?:number};
export type Trial={target:string;startedAt:number;handAt?:number;wrongGuesses:string[];correctAt?:number};

const RECENT_FRAMES=60;
let frames:FrameTiming[]=[];
let trials:Trial[]=[];
let lockResets:Record<string,number>={};
let engine:{delegate?:string;preloaded?:boolean;modelWaitMs?:number}={};
const listeners=new Set<()=>void>();
let notifyQueued=false;

function notify(){
 // Coalesce to one UI update per animation frame.
 if(notifyQueued)return;notifyQueued=true;
 requestAnimationFrame(()=>{notifyQueued=false;listeners.forEach(listener=>listener());});
}
const current=(target:string)=>{
 const last=trials.at(-1);
 return last && last.target===target && last.correctAt===undefined?last:undefined;
};
const average=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;

export const recognitionMetrics={
 subscribe(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
 frame(timing:FrameTiming){frames.push(timing);if(frames.length>RECENT_FRAMES)frames.shift();notify();},
 /** A new prompt is on screen. */
 prompt(target:string,now:number){if(!current(target))trials.push({target,startedAt:now,wrongGuesses:[]});notify();},
 /** A hand was detected while this prompt was showing. */
 handSeen(target:string,now:number){const trial=current(target);if(trial&&trial.handAt===undefined){trial.handAt=now;notify();}},
 wrong(target:string,label:string){current(target)?.wrongGuesses.push(label);notify();},
 correct(target:string,now:number){const trial=current(target);if(trial){trial.correctAt=now;notify();}},
 /** An alphabet hold in progress was dropped, and why. */
 lockReset(cause:string){lockResets[cause]=(lockResets[cause]??0)+1;notify();},
 /** Which processor hand tracking ended up on, and whether the runtime was preloaded. */
 runtime(info:{delegate:string;preloaded:boolean}){engine={...engine,...info};notify();},
 /** How long the camera was live before recognition could start. */
 modelWait(ms:number){engine={...engine,modelWaitMs:ms};notify();},
 reset(){frames=[];trials=[];lockResets={};notify();},
 summary(){
  const span=frames.length>1?frames.at(-1)!.at-frames[0].at:0;
  const done=trials.filter(trial=>trial.correctAt!==undefined&&trial.handAt!==undefined);
  return {
   fps:span>0?(frames.length-1)/(span/1000):0,
   captureMs:average(frames.map(f=>f.captureMs)),
   segmentMs:average(frames.map(f=>f.segmentMs)),
   predictMs:average(frames.flatMap(f=>f.predictMs===undefined?[]:[f.predictMs])),
   trials:trials.length,
   recognized:done.length,
   wrongGuesses:trials.reduce((n,trial)=>n+trial.wrongGuesses.length,0),
   /** Mean time from first detected hand to an accepted correct answer. */
   msToCorrect:average(done.map(trial=>trial.correctAt!-trial.handAt!)),
   lockResets:{...lockResets},
   ...engine,
  };
 },
 export(settings:RecognitionSettings,condition:string){
  return JSON.stringify({condition,device:navigator.userAgent,settings,summary:recognitionMetrics.summary(),
   trials:trials.map(trial=>({target:trial.target,
    msToCorrect:trial.correctAt!==undefined&&trial.handAt!==undefined?Math.round(trial.correctAt-trial.handAt):null,
    wrongGuesses:trial.wrongGuesses}))},null,2);
 },
};
