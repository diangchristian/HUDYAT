import test from 'node:test';
import assert from 'node:assert/strict';
import {longestGap,signLog} from '../src/features/fsl-recognition/sign-log.ts';

const at=n=>Array.from({length:n},(_,i)=>({at:i*40}));
test('the longest tracking gap counts only gaps between frames with a hand',()=>{
 assert.equal(longestGap(at(10),[false,true,true,false,false,false,true,true,false,false]),160);   // frames 2..6
 assert.equal(longestGap(at(4),[true,true,true,true]),0);
 assert.equal(longestGap(at(3),[false,false,false]),0);
});
test('the log keeps the newest decisions first',()=>{
 signLog.clear();
 for(let i=0;i<15;i++)signLog.add({at:i,reason:'early',target:'red',signMs:900,longestGapMs:0,accepted:false});
 assert.equal(signLog.entries().length,12);assert.equal(signLog.entries()[0].at,14);
});
