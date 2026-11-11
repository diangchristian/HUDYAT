import {createTimedSegmenter} from './timed-segmenter.ts';
import {recommendedInput} from './sign-capture.js';

export type RecordedFrame={raw:Float32Array;norm:Float32Array;at:number};
type Decision={kind:'retry';reason:'max_length'|'too_short'}|
 {kind:'ready';input:number[][];items:RecordedFrame[]};

/** Complete-clip capture for the selected recorder Alphabet release. Never predicts a partial pose.
 * Keep its v1 normalization/canonical-hand contract: trim ±0.1s, minimum 8 frames, resample to 32.
 */
export function createRecordedSignCapture(){
 const segmenter=createTimedSegmenter<RecordedFrame>({endAbsentS:.5,maxWindowS:3});
 let retry=false;
 return {
  message(present:boolean){
   if(segmenter.needsRest)return 'Lower your hand, then try again';
   if(segmenter.signing)return present?'Perform the full sign, then lower your hand':'Checking…';
   return retry?'Try again with a complete sign':'Show your hand';
  },
  push(item:RecordedFrame,width:number,height:number):Decision|null{
   const present=Boolean(item.raw[126]||item.raw[127]);
   const ended=segmenter.push(item,present,item.at);
   if(segmenter.signing)retry=false;
   if(!ended)return null;
   if(ended.reason==='max_length'){
    retry=true;
    return {kind:'retry',reason:'max_length'};
   }
   const items=ended.items;
   const span=(items.at(-1)!.at-items[0]!.at)/1000;
   // A slow device must supply real frames, not inflate a very short observation to 32.
   if(items.length<8||span<=0){retry=true;return {kind:'retry',reason:'too_short'};}
   const fps=(items.length-1)/span;
   const {input}=recommendedInput(items,fps,width,height,'auto');
   return {kind:'ready',input,items};
  },
 };
}
