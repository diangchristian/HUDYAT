import test from 'node:test';
import assert from 'node:assert/strict';
import {createSignSegmenter,recommendedInput,signWindow} from '../src/features/fsl-recognition/sign-capture.js';

const frame=(left,right,x=.1)=>{const f=new Float32Array(128);if(left){f.fill(x,0,63);f[126]=1;}if(right){f.fill(x,63,126);f[127]=1;}return f;};
const feed=(segmenter,presence)=>presence.flatMap((present,i)=>{const sign=segmenter.push(i,present);return sign?[sign]:[];});

test('a sign ends 0.2 s after the hands go down, with 0.1 s before the first hand',()=>{
 const signs=feed(createSignSegmenter(30),[...Array(10).fill(false),...Array(30).fill(true),...Array(8).fill(false)]);
 assert.equal(signs.length,1);
 assert.equal(signs[0].reason,'hands_gone');
 assert.deepEqual([signs[0].items[0],signs[0].items.length],[7,39]);   // 3 frames before, 30 with hands, 6 absent
});
test('a detection blip shorter than 0.2 s is not a sign',()=>{
 assert.equal(feed(createSignSegmenter(30),[...Array(3).fill(true),...Array(10).fill(false)]).length,0);
});
test('a sign longer than 3 s is cut at 3 s, and the hands must go down before the next one',()=>{
 const signs=feed(createSignSegmenter(30),[...Array(120).fill(true),...Array(10).fill(false)]);
 assert.deepEqual(signs.map(s=>[s.reason,s.items.length]),[['max_length',90]]);
});
test('the clip is cut to the frames with a hand, plus 0.1 s on each side',()=>{
 assert.deepEqual(signWindow([...Array(10).fill(false),...Array(20).fill(true),...Array(10).fill(false)],30),[7,32]);
});
test('the model gets 32 frames of 128 values; a left-handed sign is mirrored to the right hand',()=>{
 const items=Array.from({length:20},(_,t)=>({raw:frame(true,false,.2+t*.01),norm:frame(true,false,.5)}));
 const {input,hand}=recommendedInput(items,30,1280,720,'auto');
 assert.equal(hand,'left');
 assert.equal(input.length,32);assert.ok(input.every(row=>row.length===128));
 assert.deepEqual([input[0][126],input[0][127]],[0,1]);              // moved to the right-hand slot
 assert.equal(input[0][63],-.5);                                     // x mirrored
 assert.equal(recommendedInput(items,30,1280,720,'right').input[0][126],1);
});
