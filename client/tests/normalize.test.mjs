import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {normalizeFrame,normalizeSequence} from '../src/features/fsl-recognition/normalize.ts';

/** A right-hand frame from pixel positions (wrist, middle knuckle, one fingertip) in a width×height image. */
const frameFrom=(points,width,height)=>{
 const f=new Float32Array(128);
 points.forEach(([x,y,z],i)=>f.set([x/width,y/height,z/width],63+i*3));
 f[127]=1;return f;
};
const close=(actual,expected)=>expected.forEach((v,i)=>assert.ok(Math.abs(actual[i]-v)<1e-5,`index ${i}: ${actual[i]} vs ${v}`));

test('expresses each hand relative to its wrist in palm lengths',()=>{
 // wrist (50,50), knuckle (50,40): palm 10px. Tip (60,50,z 5px) -> (1, 0, 0.5)
 const points=Array.from({length:21},()=>[50,50,0]);points[9]=[50,40,0];points[8]=[60,50,5];
 const out=normalizeFrame(frameFrom(points,100,100),100,100);
 close(out.slice(63+8*3,63+9*3),[1,0,.5]);
 close(out.slice(63+9*3,63+10*3),[0,-1,0]);
 close(out.slice(63,66),[0,0,0]);
 assert.equal(out[127],1);assert.equal(out[126],0);
});
test('the same hand gives the same features wherever it is and whatever the camera shape',()=>{
 const hand=Array.from({length:21},(_,i)=>[30+i*2,40+i,i*.5]);
 const a=normalizeFrame(frameFrom(hand,100,100),100,100);
 const moved=normalizeFrame(frameFrom(hand.map(([x,y,z])=>[x+500,y+200,z]),1280,720),1280,720);
 close(Array.from(moved),Array.from(a));
});
test('absent hands and a frame without hands stay zero',()=>{
 assert.deepEqual(Array.from(normalizeFrame(new Float32Array(128),640,480)),new Array(128).fill(0));
});
const fixture=new URL('./fixtures-normalize.json',import.meta.url);
test('matches the training pipeline (fixture exported by fsl-alphabet-model)',{skip:!existsSync(fixture)&&'no fixture yet'},()=>{
 const {cases}=JSON.parse(readFileSync(fixture,'utf8'));
 for(const c of cases)close(Array.from(normalizeFrame(Float32Array.from(c.raw),c.width,c.height)),c.expected);
});

test('a single frame gives the same sequence features as hand-relative-v1',()=>{
 const hand=Array.from({length:21},(_,i)=>[30+i*2,40+i,i*.5]);
 const frame=frameFrom(hand,640,480);
 close(Array.from(normalizeSequence([frame],640,480)[0]),Array.from(normalizeFrame(frame,640,480)));
});
test('the wrist is its movement since the first frame, in median palm lengths',()=>{
 // Palm 10px in every frame; the wrist moves 5px right, then 20px down.
 const at=(dx,dy)=>{const p=Array.from({length:21},()=>[50+dx,50+dy,0]);p[9]=[50+dx,40+dy,0];return frameFrom(p,100,100);};
 const out=normalizeSequence([at(0,0),at(5,0),at(5,20)],100,100);
 close(out[0].slice(63,66),[0,0,0]);
 close(out[1].slice(63,66),[.5,0,0]);
 close(out[2].slice(63,66),[.5,2,0]);
 close(out[2].slice(63+9*3,63+10*3),[0,-1,0]);
});
const sequenceFixture=new URL('./fixtures-normalize-sequence.json',import.meta.url);
test('matches hand-relative-sequence-v1 models (camera parity cases exported with the model)',()=>{
 const {preprocessing,cases}=JSON.parse(readFileSync(sequenceFixture,'utf8'));
 assert.equal(preprocessing.normalization,'hand-relative-sequence-v1');
 for(const c of cases){
  const out=normalizeSequence(c.frames.map(f=>Float32Array.from(f)),c.width,c.height);
  out.forEach((frame,t)=>close(Array.from(frame),c.expected[t]));
 }
});
