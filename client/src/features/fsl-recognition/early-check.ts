/*
 * DABEST: check a moving sign while it is still being made, so a learner who holds the finished sign steady
 * gets an answer without lowering the hand. Only a confident match with the target is accepted early; any other
 * guess is ignored until the sign ends as usual (sign-capture.js), so no "wrong" is ever given mid-sign.
 */
export const EARLY_EVERY_MS=500;
/** A sign so far with less hand time than this is too short to check. */
export const EARLY_MIN_HANDS_MS=400;
/** Frames kept from before the first hand; recommendedInput cuts the window to the hands ±0.1 s anyway. */
const KEEP_BEFORE=10;

type Timed={at:number};

/** push() every frame with whether a sign is in progress; returns the sign so far when it is time to check it. */
export function createEarlyCheck<T extends Timed>(everyMs=EARLY_EVERY_MS,minHandsMs=EARLY_MIN_HANDS_MS){
 let before:T[]=[],sign:T[]|null=null,handMs=0,lastHand:number|undefined,lastCheck=0;
 return {
  push(item:T,present:boolean,signing:boolean):T[]|null{
   if(!signing){
    sign=null;handMs=0;lastHand=undefined;
    before.push(item);if(before.length>KEEP_BEFORE)before.shift();
    return null;
   }
   if(!sign){sign=[...before,item];before=[];lastCheck=item.at;}
   else sign.push(item);
   // Hand time: the time between consecutive frames that both have a hand.
   if(present&&lastHand!==undefined)handMs+=item.at-lastHand;
   lastHand=present?item.at:undefined;
   if(handMs<minHandsMs||item.at-lastCheck<everyMs)return null;
   lastCheck=item.at;
   return [...sign];
  },
 };
}
