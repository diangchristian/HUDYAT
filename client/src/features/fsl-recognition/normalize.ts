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

/*
 * "hand-relative-sequence-v1" (Russel's trainer exports): landmarks 1-20 exactly as hand-relative-v1; the wrist,
 * instead of 0, is how far it moved since the hand's first valid frame, in the clip's median palm length.
 * For a single frame this equals normalizeFrame. tests/normalize.test.mjs checks it against the model's own parity cases.
 */
export const HAND_RELATIVE_SEQUENCE='hand-relative-sequence-v1';

export function normalizeSequence(frames:Float32Array[],width:number,height:number):Float32Array[]{
 const out=frames.map(frame=>normalizeFrame(frame,width,height));
 for(let slot=0;slot<2;slot++){
  const base=slot*63,valid=out.flatMap((frame,t)=>frame[126+slot]?[t]:[]);
  if(!valid.length)continue;
  const wrist=(f:Float32Array)=>[f[base]*width,f[base+1]*height,f[base+2]*width];
  const palms=valid.map(t=>{const f=frames[t]!;return Math.hypot((f[base+27]-f[base])*width,(f[base+28]-f[base+1])*height);}).sort((a,b)=>a-b);
  const mid=palms.length>>1,scale=palms.length%2?palms[mid]!:(palms[mid-1]!+palms[mid]!)/2;
  const origin=wrist(frames[valid[0]!]!);
  for(const t of valid)out[t]!.set(wrist(frames[t]!).map((v,c)=>(v-origin[c]!)/scale),base);
 }
 return out;
}
