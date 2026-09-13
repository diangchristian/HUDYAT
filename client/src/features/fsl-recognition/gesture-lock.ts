export type LockState={candidate?:string;since:number;last:number;count:number;locked?:string;missingSince?:number};
export const emptyLock=():LockState=>({since:0,last:0,count:0});
export function advanceLock(state:LockState,input:{now:number;present:boolean;label?:string;score?:number;margin?:number;steady:boolean;maxGapMs?:number}):LockState{
 const {now}=input;
 if(!input.present){
  const missingSince=state.missingSince??now;
  return state.locked && now-missingSince<500?{...state,missingSince}:{...emptyLock(),missingSince};
 }
 if(state.locked)return {...state,missingSince:undefined};
 if(!input.label || (input.score??0)<.8 || (input.margin??0)<.15 || !input.steady)return emptyLock();
 const continuing=state.candidate===input.label && now-state.last<=(input.maxGapMs??600);
 const next={candidate:input.label,since:continuing?state.since:now,last:now,count:continuing?state.count+1:1};
 return now-next.since>=1200 && next.count>=5?{...next,locked:input.label}:next;
}
export function isSteady(previous:Float32Array|undefined,current:Float32Array){
 if(!previous || previous[126]!==current[126] || previous[127]!==current[127])return false;
 let sum=0,count=0;
 for(let h=0;h<2;h++)if(current[126+h])for(let i=h*63;i<(h+1)*63;i++){sum+=(current[i]-previous[i])**2;count++;}
 return count>0 && Math.sqrt(sum/count)<=.025;
}
export function matchesTarget(predicted:string,target:string){return predicted.trim().toLocaleLowerCase()===target.trim().toLocaleLowerCase();}

/** A prompt can complete once, regardless of how many matching frames arrive. */
export function createMatchCompletion(target:string,onCorrect:()=>void,onWrong:()=>void=()=>{}){
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
    if(lastWrong!==label){lastWrong=label;onWrong();}
    return false;
   }
   done=true;onCorrect();return true;
  }
 };
}
