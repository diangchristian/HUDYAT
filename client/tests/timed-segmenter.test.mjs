import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimedSegmenter} from '../src/features/fsl-recognition/timed-segmenter.ts';

// frames: [present, ms since the previous frame]; returns every sign as [first item, length, reason]
const run=(frames,options)=>{
 const s=createTimedSegmenter(options),signs=[];let at=0;
 frames.forEach(([present,dt],i)=>{at+=dt;const sign=s.push({i,at},present,at);if(sign)signs.push([sign.items[0].i,sign.items.length,sign.reason]);});
 return signs;
};
const frames=(n,present,dt=40)=>Array(n).fill([present,dt]);

test('a 0.3 s tracking gap inside a sign does not end it',()=>{
 assert.deepEqual(run([...frames(5,false),...frames(15,true),...frames(8,false),...frames(15,true),...frames(14,false)]),
  [[3,53,'hands_gone']]);                  // 0.1 s before the hand, the whole sign, and 0.5 s of no hand
});
test('the sign ends 0.5 s after the hands go down, in real time even when frames are slow',()=>{
 assert.deepEqual(run([...frames(10,true,80),...frames(7,false,80)]),[[0,17,'hands_gone']]);   // 7 x 80 ms >= 0.5 s
 assert.deepEqual(run([...frames(10,true,80),...frames(6,false,80)]),[]);                       // 480 ms: not yet
});
test('the 3 s limit is 3 s of real time, then the hands must go down before the next sign',()=>{
 const signs=run([...frames(60,true,60),...frames(10,false,60)]);
 assert.deepEqual(signs,[[0,51,'max_length']]);                  // 50 x 60 ms = 3.0 s after the first frame
});
test('a detection blip shorter than 0.2 s of hands is not a sign',()=>{
 assert.deepEqual(run([...frames(4,true),...frames(20,false)]),[]);
});
test('the wait for a missing hand can be changed',()=>{
 assert.deepEqual(run([...frames(10,true),...frames(6,false),...frames(10,true),...frames(20,false)],{endAbsentS:.2}).length,2);
});
