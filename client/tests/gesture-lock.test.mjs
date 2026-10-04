import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceLock,emptyLock,frameIssue,holdProgress,isSteady,matchesTarget} from '../src/features/fsl-recognition/gesture-lock.ts';
const sample=(now,overrides={})=>({now,present:true,label:'M',score:.95,margin:.5,steady:true,...overrides});
const hold=()=>{let s=emptyLock();for(let t=0;t<=1200;t+=200)s=advanceLock(s,sample(t));return s;};
test('consistent confident hold locks only after the duration',()=>{
 let s=emptyLock();for(let t=0;t<1200;t+=200){s=advanceLock(s,sample(t));assert.equal(s.locked,undefined);}
 s=advanceLock(s,sample(1200));assert.equal(s.locked,'M');
});
test('changing predictions, low confidence, small margin, motion and stalled frames reset a hold',()=>{
 for(const overrides of [{label:'N'},{score:.7},{margin:.1},{steady:false},{now:1000}]){
  let s=advanceLock(emptyLock(),sample(0));s=advanceLock(s,sample(200,overrides));assert.equal(s.locked,undefined);
  assert.ok(s.count<=1);
 }
});
test('locked answer survives a detection flicker but resets after 500ms with no hand',()=>{
 let s=hold();s=advanceLock(s,sample(1400,{present:false}));assert.equal(s.locked,'M');
 s=advanceLock(s,sample(1600));assert.equal(s.locked,'M');
 s=advanceLock(s,sample(1800,{present:false}));s=advanceLock(s,sample(2400,{present:false}));assert.equal(s.locked,undefined);
});
test('target comparison uses labels, not confidence or the target as prediction',()=>{
 assert.equal(matchesTarget('M','N'),false);assert.equal(matchesTarget('blue','Blue'),true);
 assert.equal(matchesTarget('violet','Purple'),false);
});
test('steadiness ignores absent slots but detects hand changes and movement',()=>{
 const a=new Float32Array(128);a[126]=1;const b=a.slice();b[0]=.01;
 assert.equal(isSteady(a,b),true);b.fill(.5,0,63);assert.equal(isSteady(a,b),false);
 assert.equal(isSteady(undefined,a),false);b[126]=0;assert.equal(isSteady(a,b),false);
});
import {createMatchCompletion} from '../src/features/fsl-recognition/gesture-lock.ts';
test('only the correct target advances, and repeated matches advance once',()=>{
 let count=0;const completion=createMatchCompletion('M',()=>count++);
 assert.equal(completion.accept('N'),false);assert.equal(count,0);
 assert.equal(completion.accept('M'),true);assert.equal(completion.accept('M'),false);
 assert.equal(count,1);assert.equal(completion.completed(),true);
 const next=createMatchCompletion('N',()=>count++);
 assert.equal(next.accept('M'),false);assert.equal(next.accept('N'),true);assert.equal(count,2);
});
test('wrong sound fires once per wrong hold and rearms after hand removal',()=>{
 let right=0,wrong=0;const c=createMatchCompletion('M',()=>right++,()=>wrong++);
 c.accept('N');c.accept('N');assert.equal(wrong,1);assert.equal(right,0);assert.equal(c.completed(),false);
 c.observePresence(false,0);c.observePresence(true,200);c.accept('N');assert.equal(wrong,1);
 c.observePresence(false,400);c.observePresence(false,1000);c.accept('N');assert.equal(wrong,2);
 c.accept('M');c.accept('N');assert.equal(right,1);assert.equal(wrong,2);
});
const relaxed={holdMs:600,minFrames:3,graceFrames:1};
test('relaxed rules lock after a shorter hold with fewer frames',()=>{
 let s=emptyLock();
 for(const t of [0,200,400]){s=advanceLock(s,sample(t),relaxed);assert.equal(s.locked,undefined);}
 s=advanceLock(s,sample(600),relaxed);assert.equal(s.locked,'M');
});
test('relaxed rules tolerate one bad frame mid-hold but not two in a row',()=>{
 let s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(100),relaxed);
 s=advanceLock(s,sample(200,{score:.5}),relaxed);
 s=advanceLock(s,sample(300),relaxed);s=advanceLock(s,sample(600),relaxed);
 assert.equal(s.locked,'M');
 s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);
 s=advanceLock(s,sample(100,{steady:false}),relaxed);s=advanceLock(s,sample(200,{steady:false}),relaxed);
 s=advanceLock(s,sample(300),relaxed);s=advanceLock(s,sample(600),relaxed);
 assert.equal(s.locked,undefined);
});
test('a different confident label is never forgiven as a bad frame',()=>{
 let s=emptyLock();
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(200),relaxed);
 s=advanceLock(s,sample(400,{label:'N'}),relaxed);s=advanceLock(s,sample(600),relaxed);
 assert.notEqual(s.locked,'M');
});
test('confidence, margin and motion gates are tunable lock rules',()=>{
 const loose={...relaxed,minScore:.6,minMargin:.05,maxMotion:.05};
 let s=emptyLock();
 for(const t of [0,200,400])s=advanceLock(s,sample(t,{score:.7,margin:.08}),loose);
 s=advanceLock(s,sample(600,{score:.7,margin:.08}),loose);
 assert.equal(s.locked,'M');
 s=emptyLock();
 for(const t of [0,200,400,600])s=advanceLock(s,sample(t,{score:.7,margin:.08}),relaxed);
 assert.equal(s.locked,undefined,'default gates still require .8 confidence');
});
test('steadiness threshold is configurable',()=>{
 const a=new Float32Array(128);a[126]=1;const b=a.slice();b.fill(.04,0,63);
 assert.equal(isSteady(a,b),false);
 assert.equal(isSteady(a,b,.05),true);
});
test('hold progress reports how close a hold is to locking',()=>{
 let s=emptyLock();
 assert.equal(holdProgress(s,relaxed,0),0);
 s=advanceLock(s,sample(0),relaxed);s=advanceLock(s,sample(300),relaxed);
 assert.equal(holdProgress(s,relaxed,300),.5,'limited by hold time (300/600) and frames (2/3)');
 s=advanceLock(s,sample(450),relaxed);
 assert.equal(holdProgress(s,relaxed,450),.75);
 s=advanceLock(s,sample(600),relaxed);
 assert.equal(holdProgress(s,relaxed,600),1);
});
test('frameIssue names why a frame cannot count towards a hold, even before any hold exists',()=>{
 assert.equal(frameIssue(sample(0)),undefined);
 assert.equal(frameIssue(sample(0,{present:false})),'no hand');
 assert.equal(frameIssue(sample(0,{score:.5})),'low score');
 assert.equal(frameIssue(sample(0,{score:.5}),{...relaxed,minScore:.4}),undefined);
 assert.equal(frameIssue(sample(0,{margin:.05})),'low margin');
 assert.equal(frameIssue(sample(0,{steady:false})),'unsteady');
});
