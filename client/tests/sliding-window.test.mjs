import { test, expect } from "vitest";
import {createSlidingWindow} from '../src/features/fsl-recognition/sliding-window.ts';
const frame=(present=true)=>{const f=new Float32Array(128);f[127]=present?1:0;return f;};
const options={spanMs:2000,minSpanMs:1200,everyMs:500,minFrames:8,agree:2};

test('asks for a prediction once enough of a sign is buffered, then at most every 500ms',()=>{
 const w=createSlidingWindow(options);const asked=[];
 for(let t=0;t<=2000;t+=100)if(w.push(frame(),t))asked.push(t);
 expect(asked).toStrictEqual([1200,1700]);
});
test('predicts on only the most recent 2 seconds of frames',()=>{
 const w=createSlidingWindow(options);let last;
 for(let t=0;t<=3000;t+=100)last=w.push(frame(),t)??last;
 expect(last.length).toBe(21);
});
test('a hand missing for over 500ms ends the sign and empties the window',()=>{
 const w=createSlidingWindow(options);
 for(let t=0;t<1000;t+=100)w.push(frame(),t);
 for(let t=1000;t<=1600;t+=100)expect(w.push(frame(false),t)).toBe(undefined);
 for(let t=1700;t<2800;t+=100)expect(w.push(frame(),t)).toBe(undefined);
 expect(w.push(frame(),2900)).toBeTruthy();
});
test('accepts a label only after consecutive confident agreeing guesses',()=>{
 const w=createSlidingWindow(options);
 const sure=label=>({prediction:label,score:.9,margin:.3});
 expect(w.vote(sure('blue'))).toBe(undefined);
 expect(w.vote(sure('red'))).toBe(undefined);
 expect(w.vote(sure('red'))).toBe('red');
 expect(w.vote(sure('red')), 'streak restarts after an accept').toBe(undefined);
 expect(w.vote({prediction:'red',score:.6,margin:.3})).toBe(undefined);
 expect(w.vote(sure('red')), 'a weak guess breaks the streak').toBe(undefined);
 expect(w.vote(sure('red'))).toBe('red');
});
test('progress counts buffering and agreeing guesses, so a full buffer is not shown as done',()=>{
 const w=createSlidingWindow(options);const sure={prediction:'red',score:.9,margin:.3};
 expect(w.progress(0)).toBe(0);
 for(let t=0;t<=900;t+=100)w.push(frame(),t);
 expect(w.progress(900), 'buffer 3/4 full of the first of three steps').toBe(.25);
 for(let t=1000;t<=1500;t+=100)w.push(frame(),t);
 expect(w.progress(1500)).toBe(1/3);
 w.vote(sure);
 expect(w.progress(1500)).toBe(2/3);
 w.vote({prediction:'red',score:.5,margin:.3});
 expect(w.progress(1500), 'a weak guess loses the agreement').toBe(1/3);
});
