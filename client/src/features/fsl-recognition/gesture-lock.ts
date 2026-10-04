export type LockState={candidate?:string;since:number;last:number;count:number;locked?:string;missingSince?:number;misses?:number};
/**
 * How long a sign must be held to lock, how many weak/unsteady frames in a row a hold survives,
 * and the gates a frame must pass (defaults in DEFAULT_GATES).
 */
export type LockRules={holdMs:number;minFrames:number;graceFrames:number;minScore?:number;minMargin?:number;maxMotion?:number};
export const DEFAULT_LOCK_RULES:LockRules={holdMs:1200,minFrames:5,graceFrames:0};
/** The gates a frame (or a moving-sign guess) must pass unless lock rules override them. */
export const DEFAULT_GATES={minScore:.8,minMargin:.15,maxMotion:.025};
export const gates=(rules:LockRules)=>({minScore:rules.minScore??DEFAULT_GATES.minScore,minMargin:rules.minMargin??DEFAULT_GATES.minMargin,maxMotion:rules.maxMotion??DEFAULT_GATES.maxMotion});
export type FrameIssue='no hand'|'no prediction'|'low score'|'low margin'|'unsteady';
export type LockResetCause=FrameIssue|'changed sign'|'frame gap';
export const emptyLock=():LockState=>({since:0,last:0,count:0});
export function advanceLock(state:LockState,input:{now:number;present:boolean;label?:string;score?:number;margin?:number;steady:boolean;maxGapMs?:number},rules:LockRules=DEFAULT_LOCK_RULES):LockState{
 const {now}=input;
 if(!input.present){
  const missingSince=state.missingSince??now;
  return state.locked && now-missingSince<500?{...state,missingSince}:{...emptyLock(),missingSince};
 }
 if(state.locked)return {...state,missingSince:undefined};
 const {minScore,minMargin}=gates(rules);
 if(!input.label || (input.score??0)<minScore || (input.margin??0)<minMargin || !input.steady){
  const misses=(state.misses??0)+1;
  return state.candidate && misses<=rules.graceFrames?{...state,misses}:emptyLock();
 }
 const continuing=state.candidate===input.label && now-state.last<=(input.maxGapMs??600);
 const next={candidate:input.label,since:continuing?state.since:now,last:now,count:continuing?state.count+1:1};
 return now-next.since>=rules.holdMs && next.count>=rules.minFrames?{...next,locked:input.label}:next;
}
export type LockInput=Parameters<typeof advanceLock>[1];
/** Why this frame can't count towards a hold, if it can't. */
export function frameIssue(input:LockInput,rules:LockRules=DEFAULT_LOCK_RULES):FrameIssue|undefined{
 const {minScore,minMargin}=gates(rules);
 if(!input.present)return 'no hand';
 if(!input.label)return 'no prediction';
 if((input.score??0)<minScore)return 'low score';
 if((input.margin??0)<minMargin)return 'low margin';
 if(!input.steady)return 'unsteady';
 return undefined;
}
/** EXPERIMENT metrics: why a hold in progress was dropped, if it was. */
export function lockResetCause(before:LockState,after:LockState,input:LockInput,rules:LockRules=DEFAULT_LOCK_RULES):LockResetCause|undefined{
 if(!before.candidate||before.locked||after.locked||after.candidate===before.candidate)return undefined;
 return frameIssue(input,rules)??(input.label!==before.candidate?'changed sign':'frame gap');
}
/** 0–1: how far a hold in progress is towards locking (whichever of time or frames lags). */
export function holdProgress(state:LockState,rules:LockRules,now:number){
 if(state.locked)return 1;
 if(!state.candidate)return 0;
 const time=rules.holdMs>0?(now-state.since)/rules.holdMs:1;
 return Math.max(0,Math.min(1,time,state.count/rules.minFrames));
}
/** Motion threshold for steadiness; lock rules carry it as `maxMotion`. */
export const motionLimit=(rules:LockRules)=>gates(rules).maxMotion;
export function isSteady(previous:Float32Array|undefined,current:Float32Array,maxMotion=DEFAULT_GATES.maxMotion){
 if(!previous || previous[126]!==current[126] || previous[127]!==current[127])return false;
 let sum=0,count=0;
 for(let h=0;h<2;h++)if(current[126+h])for(let i=h*63;i<(h+1)*63;i++){sum+=(current[i]-previous[i])**2;count++;}
 return count>0 && Math.sqrt(sum/count)<=maxMotion;
}
export function matchesTarget(predicted:string,target:string){return predicted.trim().toLocaleLowerCase()===target.trim().toLocaleLowerCase();}

/** A prompt can complete once, regardless of how many matching frames arrive. */
export function createMatchCompletion(target:string,onCorrect:()=>void,onWrong:(label:string)=>void=()=>{}){
 let done=false,lastWrong:string|undefined,missingSince:number|undefined;
 return {completed:()=>done,
  observePresence:(present:boolean,now:number)=>{
   if(present){missingSince=undefined;return;}
   missingSince??=now;
   if(now-missingSince>=500)lastWrong=undefined;
  },
  accept:(label:string)=>{
   if(done)return false;
   if(!matchesTarget(label,target)){
    if(lastWrong!==label){lastWrong=label;onWrong(label);}
    return false;
   }
   done=true;onCorrect();return true;
  }
 };
}
