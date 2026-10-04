/*
 * "hand-relative-v1" landmark features, for models whose metadata declares
 * preprocessing.normalization === 'hand-relative-v1' (trained in fsl-alphabet-model,
 * src/features.py — tests/normalize.test.mjs checks both agree).
 *
 * Each present hand becomes pixels relative to its wrist, divided by the
 * wrist-to-middle-knuckle length, so where the hand is, how big it is and the
 * camera's aspect ratio no longer change what the model sees.
 */
export const HAND_RELATIVE='hand-relative-v1';
const WRIST=0,MIDDLE_MCP=9;

/** frame: the 128-float layout from packResult (x/width, y/height, z at x scale + presence flags). */
export function normalizeFrame(frame:Float32Array,width:number,height:number):Float32Array{
 const out=new Float32Array(128);
 for(let slot=0;slot<2;slot++){
  if(!frame[126+slot])continue;
  const base=slot*63,px=(i:number)=>frame[base+i*3]*width,py=(i:number)=>frame[base+i*3+1]*height,pz=(i:number)=>frame[base+i*3+2]*width;
  const ox=px(WRIST),oy=py(WRIST),oz=pz(WRIST);
  const palm=Math.hypot(px(MIDDLE_MCP)-ox,py(MIDDLE_MCP)-oy);
  // A degenerate detection can't be scaled; treat that hand as absent (training drops it too).
  if(!Number.isFinite(palm)||palm<1e-6)continue;
  for(let i=0;i<21;i++)out.set([(px(i)-ox)/palm,(py(i)-oy)/palm,(pz(i)-oz)/palm],base+i*3);
  out[126+slot]=1;
 }
 return out;
}
