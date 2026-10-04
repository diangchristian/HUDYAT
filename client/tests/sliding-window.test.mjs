import test from 'node:test';
import assert from 'node:assert/strict';
import {createSlidingWindow} from '../src/features/fsl-recognition/sliding-window.ts';
const frame=(present=true)=>{const f=new Float32Array(128);f[127]=present?1:0;return f;};
const options={spanMs:2000,minSpanMs:1200,everyMs:500,minFrames:8,agree:2};

test('asks for a prediction once enough of a sign is buffered, then at most every 500ms',()=>{
 const w=createSlidingWindow(options);const asked=[];
 for(let t=0;t<=2000;t+=100)if(w.push(frame(),t))asked.push(t);
 assert.deepEqual(asked,[1200,1700]);
});
test('predicts on only the most recent 2 seconds of frames',()=>{
 const w=createSlidingWindow(options);let last;
 for(let t=0;t<=3000;t+=100)last=w.push(frame(),t)??last;
 assert.equal(last.length,21);
});
test('a hand missing for over 500ms ends the sign and empties the window',()=>{
 const w=createSlidingWindow(options);
 for(let t=0;t<1000;t+=100)w.push(frame(),t);
 for(let t=1000;t<=1600;t+=100)assert.equal(w.push(frame(false),t),undefined);
 for(let t=1700;t<2800;t+=100)assert.equal(w.push(frame(),t),undefined);
 assert.ok(w.push(frame(),2900));
});
test('accepts a label only after consecutive confident agreeing guesses',()=>{
 const w=createSlidingWindow(options);
 const sure=label=>({prediction:label,score:.9,margin:.3});
 assert.equal(w.vote(sure('blue')),undefined);
 assert.equal(w.vote(sure('red')),undefined);
 assert.equal(w.vote(sure('red')),'red');
 assert.equal(w.vote(sure('red')),undefined,'streak restarts after an accept');
 assert.equal(w.vote({prediction:'red',score:.6,margin:.3}),undefined);
 assert.equal(w.vote(sure('red')),undefined,'a weak guess breaks the streak');
 assert.equal(w.vote(sure('red')),'red');
});
test('progress counts buffering and agreeing guesses, so a full buffer is not shown as done',()=>{
 const w=createSlidingWindow(options);const sure={prediction:'red',score:.9,margin:.3};
 assert.equal(w.progress(0),0);
 for(let t=0;t<=900;t+=100)w.push(frame(),t);
 assert.equal(w.progress(900),.25,'buffer 3/4 full of the first of three steps');
 for(let t=1000;t<=1500;t+=100)w.push(frame(),t);
 assert.equal(w.progress(1500),1/3);
 w.vote(sure);
 assert.equal(w.progress(1500),2/3);
 w.vote({prediction:'red',score:.5,margin:.3});
 assert.equal(w.progress(1500),1/3,'a weak guess loses the agreement');
});
