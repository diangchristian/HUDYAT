/*
 * Moving-sign capture that doesn't wait for fixed clips: keep the most
 * recent `spanMs` of frames, ask for a prediction every `everyMs` once
 * enough of a sign is buffered, and accept a label only after `agree`
 * consecutive confident guesses agree (one guess mid-transition is noise).
 */
export type SlidingWindowOptions={spanMs:number;minSpanMs:number;everyMs:number;minFrames:number;agree:number};
export type WindowGuess={prediction?:string;score?:number;margin?:number}|undefined;

const handPresent=(frame:Float32Array)=>Boolean(frame[126]||frame[127]);

export function createSlidingWindow(options:SlidingWindowOptions){
 let frames:{at:number;frame:Float32Array}[]=[];
 let lastAsk=-Infinity,missingSince:number|undefined;
 let streak:{label?:string;count:number}={count:0};
 return {
  /** Buffers a frame; returns the frames to predict on when a guess is due. */
  push(frame:Float32Array,now:number):Float32Array[]|undefined{
   if(!handPresent(frame)){
    missingSince??=now;
    if(now-missingSince>500){frames=[];lastAsk=-Infinity;streak={count:0};}
    else frames.push({at:now,frame});
    return undefined;
   }
   missingSince=undefined;
   frames.push({at:now,frame});
   frames=frames.filter(entry=>entry.at>=now-options.spanMs);
   if(now-frames[0].at<options.minSpanMs || frames.length<options.minFrames || now-lastAsk<options.everyMs)return undefined;
   lastAsk=now;
   return frames.map(entry=>entry.frame);
  },
  /** Feeds a guess back; returns the label once enough guesses agree. */
  vote(guess:WindowGuess):string|undefined{
   if(!guess?.prediction || (guess.score??0)<.8 || (guess.margin??0)<.15){streak={count:0};return undefined;}
   streak=streak.label===guess.prediction?{label:guess.prediction,count:streak.count+1}:{label:guess.prediction,count:1};
   if(streak.count<options.agree)return undefined;
   streak={count:0};
   return guess.prediction;
  },
 };
}
