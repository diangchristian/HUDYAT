/*
 * FT-06 evidence: shows that a detected hand's landmark data reaches the
 * recognition pipeline, without drawing landmarks on the camera. Open a page
 * with `?diagnostics=1`. Only counts are kept, never images or coordinates.
 */
const FRAME_LENGTH=128,HAND_VALUES=63,LANDMARKS_PER_HAND=21,PRESENCE_OFFSET=126;

export type FrameInspection={length:number;hands:number;landmarksPerHand:number[];valid:boolean};

/** Frame layout from packResult: 2 hands x 21 landmarks x (x,y,z), then 2 hand-present flags. */
export function inspectFrame(frame:Float32Array):FrameInspection{
 const landmarksPerHand:number[]=[];
 for(let hand=0;hand<2;hand++){
  if(!frame[PRESENCE_OFFSET+hand])continue;
  let count=0;
  for(let point=0;point<LANDMARKS_PER_HAND;point++){
   const offset=hand*HAND_VALUES+point*3;
   const values=[frame[offset],frame[offset+1],frame[offset+2]];
   if(values.every(Number.isFinite)&&values.some(value=>value!==0))count++;
  }
  landmarksPerHand.push(count);
 }
 return {length:frame.length,hands:landmarksPerHand.length,landmarksPerHand,
  valid:frame.length===FRAME_LENGTH&&landmarksPerHand.every(count=>count===LANDMARKS_PER_HAND)};
}

const hasHand=(frame:Float32Array)=>Boolean(frame[PRESENCE_OFFSET]||frame[PRESENCE_OFFSET+1]);

const emptyState=()=>({
 category:undefined as string|undefined,target:undefined as string|undefined,
 frames:0,framesWithHand:0,invalidFrames:0,frameLength:0,
 latestHands:0,latestLandmarksPerHand:[] as number[],
 modelCalls:0,latestClipFrames:0,latestPrediction:undefined as string|undefined,latestScore:undefined as number|undefined,
});
export type DiagnosticsState=ReturnType<typeof emptyState>;

let state=emptyState();
const listeners=new Set<()=>void>();
let notifyQueued=false;

function notify(){
 // Coalesce to one panel update per animation frame; nothing to do when no panel is open.
 if(notifyQueued||!listeners.size)return;notifyQueued=true;
 requestAnimationFrame(()=>{notifyQueued=false;listeners.forEach(listener=>listener());});
}

export type DiagnosticCheck={label:string;passed:boolean};

export function evaluateDiagnostics(current:DiagnosticsState):{result:'PASS'|'WAITING';checks:DiagnosticCheck[]}{
 const checks=[
  {label:'A hand was detected',passed:current.framesWithHand>0},
  {label:`Every detected hand had ${LANDMARKS_PER_HAND} valid landmarks`,passed:current.framesWithHand>0&&current.invalidFrames===0},
  {label:`Each frame has ${FRAME_LENGTH} values`,passed:current.frameLength===FRAME_LENGTH},
  {label:'The model received hand data',passed:current.modelCalls>0},
 ];
 return {result:checks.every(check=>check.passed)?'PASS':'WAITING',checks};
}

export const landmarkDiagnostics={
 subscribe(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
 recordCapture(frame:Float32Array,context:{category:string;target:string}){
  const inspection=inspectFrame(frame);
  state={...state,...context,frames:state.frames+1,frameLength:inspection.length,
   framesWithHand:state.framesWithHand+(inspection.hands?1:0),
   invalidFrames:state.invalidFrames+(inspection.valid?0:1),
   latestHands:inspection.hands,latestLandmarksPerHand:inspection.landmarksPerHand};
  notify();
 },
 /** A result without a prediction means predict() returned before reaching the model. */
 recordModelCall(input:Float32Array[],result:{prediction?:string;score?:number}){
  if(result.prediction===undefined||!input.some(hasHand))return;
  state={...state,modelCalls:state.modelCalls+1,latestClipFrames:input.length,latestPrediction:result.prediction,latestScore:result.score};
  notify();
 },
 reset(){state=emptyState();notify();},
 summary(){return state;},
 export(){
  return JSON.stringify({test:'FT-06',recordedAt:new Date().toISOString(),browser:navigator.userAgent,...evaluateDiagnostics(state),...state},null,2);
 },
};

/** The URL alone decides, so the panel can't stick to a tab or reach students by accident. */
export function isDiagnosticsEnabled(){
 return new URLSearchParams(location.search).get('diagnostics')==='1';
}
