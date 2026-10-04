import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {normalizeFrame} from '../src/features/fsl-recognition/normalize.ts';

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
