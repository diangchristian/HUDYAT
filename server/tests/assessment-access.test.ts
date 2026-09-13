import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessmentAccess} from '../src/services/assessment-access.ts';
const item=(passed=false)=>({passed,published:true,questionCount:10});
test('first assessment opens; subsequent assessments require predecessors',()=>{
 assert.deepEqual(assessmentAccess([item(),item(),item()]).map(v=>v.isUnlocked),[true,false,false]);
 assert.deepEqual(assessmentAccess([item(true),item(),item()]).map(v=>v.isUnlocked),[true,true,false]);
 assert.deepEqual(assessmentAccess([item(true),item(true),item()]).map(v=>v.isUnlocked),[true,true,true]);
});
test('missing, draft, and empty assessments stay visible but unavailable',()=>{
 for(const override of [{published:false},{questionCount:0}]){
  const states=assessmentAccess([{...item(),...override},item()]);
  assert.equal(states.length,2);assert.equal(states[0].isUnlocked,false);assert.match(states[0].lockedReason!,/not available/);assert.equal(states[1].isUnlocked,false);
 }
});
test('passed assessments remain retakable',()=>{
 const state=assessmentAccess([item(),item(true)])[1];assert.equal(state.isUnlocked,true);assert.equal(state.status,'completed');
});
