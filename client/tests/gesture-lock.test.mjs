import { test, expect } from "vitest";
import {advanceLock,emptyLock,frameIssue,holdProgress,isSteady,matchesTarget} from '../src/features/fsl-recognition/gesture-lock.ts';
const sample=(now,overrides={})=>({now,present:true,label:'M',score:.95,margin:.5,steady:true,...overrides});
const hold=()=>{let s=emptyLock();for(let t=0;t<=1200;t+=200)s=advanceLock(s,sample(t));return s;};
test('consistent confident hold locks only after the duration',()=>{
 let s=emptyLock();for(let t=0;t<1200;t+=200){s=advanceLock(s,sample(t));expect(s.locked).toBe(undefined);}
 s=advanceLock(s,sample(1200));expect(s.locked).toBe('M');
});
test('changing predictions, low confidence, small margin, motion and stalled frames reset a hold',()=>{
 for(const overrides of [{label:'N'},{score:.7},{margin:.1},{steady:false},{now:1000}]){
  let s=advanceLock(emptyLock(),sample(0));s=advanceLock(s,sample(200,overrides));expect(s.locked).toBe(undefined);
  expect(s.count<=1).toBeTruthy();
 }
});
test('locked answer survives a detection flicker but resets after 500ms with no hand',()=>{
 let s=hold();s=advanceLock(s,sample(1400,{present:false}));expect(s.locked).toBe('M');
 s=advanceLock(s,sample(1600));expect(s.locked).toBe('M');
 s=advanceLock(s,sample(1800,{present:false}));s=advanceLock(s,sample(2400,{present:false}));expect(s.locked).toBe(undefined);
});
test('target comparison uses labels, not confidence or the target as prediction',()=>{
 expect(matchesTarget('M','N')).toBe(false);expect(matchesTarget('blue','Blue')).toBe(true);
 expect(matchesTarget('violet','Red')).toBe(false);
});
test('steadiness ignores absent slots but detects hand changes and movement',()=>{
 const a=new Float32Array(128);a[126]=1;const b=a.slice();b[0]=.01;
 expect(isSteady(a,b)).toBe(true);b.fill(.5,0,63);expect(isSteady(a,b)).toBe(false);
 expect(isSteady(undefined,a)).toBe(false);b[126]=0;expect(isSteady(a,b)).toBe(false);
});
import {createMatchCompletion} from '../src/features/fsl-recognition/gesture-lock.ts';
test('only the correct target advances, and repeated matches advance once',()=>{
 let count=0;const completion=createMatchCompletion('M',()=>count++);
 expect(completion.accept('N')).toBe(false);expect(count).toBe(0);
 expect(completion.accept('M')).toBe(true);expect(completion.accept('M')).toBe(false);
 expect(count).toBe(1);expect(completion.completed()).toBe(true);
 const next=createMatchCompletion('N',()=>count++);
 expect(next.accept('M')).toBe(false);expect(next.accept('N')).toBe(true);expect(count).toBe(2);
});
test('wrong sound fires once per wrong hold and rearms after hand removal',()=>{
 let right=0,wrong=0;const c=createMatchCompletion('M',()=>right++,()=>wrong++);
 c.accept('N');c.accept('N');expect(wrong).toBe(1);expect(right).toBe(0);expect(c.completed()).toBe(false);
 c.observePresence(false,0);c.observePresence(true,200);c.accept('N');expect(wrong).toBe(1);
 c.observePresence(false,400);c.observePresence(false,1000);c.accept('N');expect(wrong).toBe(2);
 c.accept('M');c.accept('N');expect(right).toBe(1);expect(wrong).toBe(2);
});
const relaxed={holdMs:600,minFrames:3,graceFrames:1};
test('relaxed rules lock after a shorter hold with fewer frames',()=>{
 let s=emptyLock();
 for(const t of [0,200,400]){s=advanceLock(s,sample(t),relaxed);expect(s.locked).toBe(undefined);}
 s=advanceLock(s,sample(600),relaxed);expect(s.locked).toBe('M');
});
test('relaxed rules tolerate one bad frame mid-hold but not two in a row',()=>{
 let s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(100),relaxed);
 s=advanceLock(s,sample(200,{score:.5}),relaxed);
 s=advanceLock(s,sample(300),relaxed);s=advanceLock(s,sample(600),relaxed);
 expect(s.locked).toBe('M');
 s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);
 s=advanceLock(s,sample(100,{steady:false}),relaxed);s=advanceLock(s,sample(200,{steady:false}),relaxed);
 s=advanceLock(s,sample(300),relaxed);s=advanceLock(s,sample(600),relaxed);
 expect(s.locked).toBe(undefined);
});
test('a different confident label is never forgiven as a bad frame',()=>{
 let s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(200),relaxed);
 s=advanceLock(s,sample(400,{label:'N'}),relaxed);s=advanceLock(s,sample(600),relaxed);
 expect(s.locked).not.toBe('M');
});
test('confidence, margin and motion gates are tunable lock rules',()=>{
 const loose={...relaxed,minScore:.6,minMargin:.05,maxMotion:.05};
 let s=emptyLock();
 for(const t of [0,200,400])s=advanceLock(s,sample(t,{score:.7,margin:.08}),loose);
 s=advanceLock(s,sample(600,{score:.7,margin:.08}),loose);
 expect(s.locked).toBe('M');
 s=emptyLock();
 for(const t of [0,200,400,600])s=advanceLock(s,sample(t,{score:.7,margin:.08}),relaxed);
 expect(s.locked, 'default gates still require .8 confidence').toBe(undefined);
});
test('steadiness threshold is configurable',()=>{
 const a=new Float32Array(128);a[126]=1;const b=a.slice();b.fill(.04,0,63);
 expect(isSteady(a,b)).toBe(false);
 expect(isSteady(a,b,.05)).toBe(true);
});
test('hold progress reports how close a hold is to locking',()=>{
 let s=emptyLock();
 expect(holdProgress(s,relaxed,0)).toBe(0);
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(300),relaxed);
 expect(holdProgress(s,relaxed,300), 'limited by hold time (300/600) and frames (2/3)').toBe(.5);
 s=advanceLock(s,sample(450),relaxed);
 expect(holdProgress(s,relaxed,450)).toBe(.75);
 s=advanceLock(s,sample(600),relaxed);
 expect(holdProgress(s,relaxed,600)).toBe(1);
});
test('frameIssue names why a frame cannot count towards a hold, even before any hold exists',()=>{
 expect(frameIssue(sample(0))).toBe(undefined);
 expect(frameIssue(sample(0,{present:false}))).toBe('no hand');
 expect(frameIssue(sample(0,{score:.5}))).toBe('low score');
 expect(frameIssue(sample(0,{score:.5}),{...relaxed,minScore:.4})).toBe(undefined);
 expect(frameIssue(sample(0,{margin:.05}))).toBe('low margin');
 expect(frameIssue(sample(0,{steady:false}))).toBe('unsteady');
});
test('matchesTarget ignores case, spaces, underscores and apostrophes',()=>{
 expect(matchesTarget('good_afternoon','Good Afternoon')).toBe(true);
 expect(matchesTarget('how_are_you','How are you')).toBe(true);
 expect(matchesTarget('im_fine',"I'm fine")).toBe(true);
 expect(matchesTarget('youre_welcome',"You're welcome")).toBe(true);
 expect(matchesTarget('good_morning','Good Afternoon')).toBe(false);
});
test("the Colors model's violet is the lesson's Purple",()=>{
 expect(matchesTarget('violet','Purple')).toBe(true);
 expect(matchesTarget('purple','Violet')).toBe(true);
 expect(matchesTarget('violet','Blue')).toBe(false);
});
