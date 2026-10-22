/*
 * DABEST diagnostics: why each moving-sign answer was given (hands down, a 3 s cut, or the early check),
 * shown in the Recognition lab (?lab=1) and in the browser console.
 */
export type SignDecision={
 at:number;
 /** hands_gone: no hand for 0.2 s; max_length: the 3 s limit; early: the sign so far, while still signing. */
 reason:'hands_gone'|'max_length'|'early';
 target:string;
 /** From the first frame of the sign to this decision. */
 signMs:number;
 /** Longest run of frames without a hand inside the sign (a tracking gap), in ms. */
 longestGapMs:number;
 prediction?:string;
 score?:number;
 margin?:number;
 accepted:boolean;
};

const KEEP=12;
let entries:SignDecision[]=[];
const listeners=new Set<()=>void>();

export const signLog={
 add(entry:SignDecision){
  entries=[entry,...entries].slice(0,KEEP);
  console.info('[DABEST sign]',entry.reason,`${Math.round(entry.signMs)} ms`,entry.prediction,entry.score?.toFixed(2),
   entry.accepted?'accepted':'not accepted',`longest gap ${Math.round(entry.longestGapMs)} ms`);
  listeners.forEach(listener=>listener());
 },
 entries:()=>entries,
 clear(){entries=[];listeners.forEach(listener=>listener());},
 subscribe(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
};

/** Longest stretch without a hand between the first and last frame with one. */
export function longestGap(items:{at:number}[],present:boolean[]){
 const first=present.indexOf(true),last=present.lastIndexOf(true);
 let longest=0,since:number|undefined;
 for(let i=first;i>=0&&i<=last;i++){
  if(!present[i])since??=items[i-1]!.at;
  else if(since!==undefined){longest=Math.max(longest,items[i]!.at-since);since=undefined;}
 }
 return longest;
}
