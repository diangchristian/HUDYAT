/*
 * DABEST: when a moving sign starts and ends, measured in real time (sign-capture.js's createSignSegmenter counts
 * frames from a frame-rate estimate, which runs long when the camera loop slows down during a sign).
 *
 * The HUDYAT Trainer's recordings almost never lose the hand during a sign (longest gap 0.23 s in 156 clips of all
 * 26 signs), but live tracking does, so a sign ends only after 0.5 s without a hand (0.2 s in sign-capture.js).
 */
export const PRE_BUFFER_S=.1,END_ABSENT_S=.5,MAX_WINDOW_S=3,MIN_HANDS_S=.2;

export type TimedSegmenterOptions={endAbsentS?:number;maxWindowS?:number};
export type TimedSign<T>={items:T[];reason:'hands_gone'|'max_length'};

/**
 * A sign starts with the first frame with a hand (with the 0.1 s before it) and ends when no hand has been seen
 * for endAbsentS, or maxWindowS after its first frame. After a cut at maxWindowS the hands must go down before the
 * next sign. Less than 0.2 s between the first and last hand is a detection blip: no sign.
 */
export function createTimedSegmenter<T>({endAbsentS=END_ABSENT_S,maxWindowS=MAX_WINDOW_S}:TimedSegmenterOptions={}){
 type Entry={item:T;at:number;present:boolean};
 let ring:Entry[]=[],active:Entry[]|null=null,firstHand=0,lastHand=0,waitingForRest=false;
 const remember=(entry:Entry)=>{ring.push(entry);while(entry.at-ring[0]!.at>PRE_BUFFER_S*1000)ring.shift();};
 const finish=(reason:TimedSign<T>['reason']):TimedSign<T>|null=>{
  const items=active!;
  active=null;waitingForRest=reason==='max_length';
  if(lastHand-firstHand<MIN_HANDS_S*1000)return null;
  return {items:items.map(e=>e.item),reason};
 };
 return {
  get signing(){return active!==null;},
  /** now: the frame's time in ms. Returns the sign when it has ended, else null. */
  push(item:T,present:boolean,now:number):TimedSign<T>|null{
   const entry={item,at:now,present};
   if(present)lastHand=now;
   if(!active&&waitingForRest){
    if(!present&&now-lastHand>=endAbsentS*1000)waitingForRest=false;
    remember(entry);
    return null;
   }
   if(!active){
    if(!present){remember(entry);return null;}
    active=[...ring.filter(e=>now-e.at<=PRE_BUFFER_S*1000),entry];ring=[];firstHand=now;
    return null;
   }
   active.push(entry);
   if(!present&&now-lastHand>=endAbsentS*1000)return finish('hands_gone');
   return now-active[0]!.at>=maxWindowS*1000?finish('max_length'):null;
  },
 };
}
