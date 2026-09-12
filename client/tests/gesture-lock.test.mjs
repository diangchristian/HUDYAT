import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceLock,emptyLock,isSteady,matchesTarget} from '../src/features/fsl-recognition/gesture-lock.ts';
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
