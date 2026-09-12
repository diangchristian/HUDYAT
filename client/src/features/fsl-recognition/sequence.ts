/** Port of fsl_sequence.prepare_clip: unmirrored Left/Right slots, seconds, null for absence. */
export const SEQUENCE_FORMAT='fsl-two-hands-v2';
export const SEQUENCE_NORMALIZATION='shared-first-wrist-xy_shared-palm-scale_local-z_presence';
export type RawClip=(number|null)[][][][];
export type Sequence=number[][][];
const f=Math.fround;
export function assignHands(result:{landmarks:{x:number;y:number;z:number}[][];handedness:{categoryName:string;score:number}[][]}):(number|null)[][][]{
 const empty=()=>Array.from({length:2},()=>Array.from({length:21},()=>[null,null,null] as (number|null)[]));
 const slots=empty(),used=new Set<number>();
 for(let i=0;i<result.landmarks.length;i++){
  const c=result.handedness[i]?.[0];if(!c||c.score<.6)continue;
  const slot=['Left','Right'].indexOf(c.categoryName);if(slot<0)continue;
  if(used.has(slot))return empty();used.add(slot);
  slots[slot]=result.landmarks[i].map(p=>[f(p.x),f(p.y),f(p.z)]);
 }
 return slots;
}
export function prepareClip(coords:RawClip,timestamps:number[]):Sequence{
 if(!Array.isArray(coords)||coords.length!==timestamps.length||coords.some(frame=>
  !Array.isArray(frame)||frame.length!==2||frame.some(hand=>!Array.isArray(hand)||hand.length!==21||
   hand.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>v!==null&&typeof v!=='number')))))
  throw Error('Clip needs aligned (T,2,21,3) coordinates and timestamps.');
 const n=timestamps.length;
 if(n<8||timestamps.some((t,i)=>!Number.isFinite(t)||(i>0&&t<=timestamps[i-1])))throw Error('Need at least 8 frames with strictly increasing timestamps.');
 const duration=timestamps[n-1]-timestamps[0];
 if(duration<.25||duration>10)throw Error('Record a complete gesture lasting 0.25 to 10 seconds.');
 const x=coords.map(frame=>frame.map(hand=>hand.map(p=>p.map(v=>v===null?NaN:f(v)))));
 const present=x.map(frame=>frame.map(hand=>hand.every(p=>p.every(Number.isFinite))));
 const any=present.map(p=>p.some(Boolean));
 if(!any[0]||!any[n-1]||any.filter(Boolean).length/n<.9)throw Error('Both hands missing at a boundary or in over 10% of frames.');
 const detected=timestamps.filter((_,i)=>any[i]);
 if(detected.some((t,i)=>i>0&&t-detected[i-1]>.25))throw Error('Tracking gap exceeds 0.25 seconds; record again.');
 const target=Array.from({length:30},(_,i)=>i===29?timestamps[n-1]:timestamps[0]+duration/29*i);
 const sampled=Array.from({length:30},()=>Array.from({length:2},()=>Array.from({length:21},()=>[NaN,NaN,NaN])));
 for(let slot=0;slot<2;slot++){
  const ids=timestamps.map((_,i)=>i).filter(i=>present[i][slot]);if(!ids.length)continue;
  const vt=ids.map(i=>timestamps[i]);
  for(let ti=0;ti<30;ti++){
   const t=target[ti];let hi=vt.findIndex(v=>v>=t);if(hi<0)hi=vt.length-1;const lo=Math.max(hi-1,0);
   if(t<vt[0]||t>vt[vt.length-1]||(vt[hi]-vt[lo]>.25&&Math.abs(t-vt[hi])>1e-8))continue;
   const ratio=hi===lo?0:(t-vt[lo])/(vt[hi]-vt[lo]);
   for(let p=0;p<21;p++)for(let axis=0;axis<3;axis++){
    const a=x[ids[lo]][slot][p][axis],b=x[ids[hi]][slot][p][axis];sampled[ti][slot][p][axis]=f(a+(b-a)*ratio);
   }
  }
 }
 const lengths:number[]=[];let anchor:number[]|undefined;
 for(const frame of sampled)for(const hand of frame){
  if(!hand.every(p=>p.every(Number.isFinite)))continue;anchor??=hand[0].slice(0,2);
  const dx=f(hand[9][0]-hand[0][0]),dy=f(hand[9][1]-hand[0][1]);lengths.push(f(Math.sqrt(f(f(dx*dx)+f(dy*dy)))));
 }
 if(!anchor)throw Error('No detected hands.');lengths.sort((a,b)=>a-b);const middle=Math.floor(lengths.length/2);
 const scale=lengths.length%2?lengths[middle]:f(f(lengths[middle-1]+lengths[middle])/2);
 if(!Number.isFinite(scale)||scale<1e-5)throw Error('Degenerate hand scale; record again.');
 return sampled.map(frame=>frame.flatMap(hand=>{
  if(!hand.every(p=>p.every(Number.isFinite)))return Array.from({length:21},()=>[0,0,0,0]);
  return hand.map(p=>[f(f(p[0]-anchor![0])/scale),f(f(p[1]-anchor![1])/scale),f(f(p[2]-hand[0][2])/scale),1]);
 }));
}
