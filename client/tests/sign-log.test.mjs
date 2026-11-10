import { test, expect } from "vitest";
import {longestGap,signLog} from '../src/features/fsl-recognition/sign-log.ts';

const at=n=>Array.from({length:n},(_,i)=>({at:i*40}));
test('the longest tracking gap counts only gaps between frames with a hand',()=>{
 expect(longestGap(at(10),[false,true,true,false,false,false,true,true,false,false])).toBe(160);   // frames 2..6
 expect(longestGap(at(4),[true,true,true,true])).toBe(0);
 expect(longestGap(at(3),[false,false,false])).toBe(0);
});
test('the log keeps the newest decisions first',()=>{
 signLog.clear();
 for(let i=0;i<15;i++)signLog.add({at:i,reason:'early',target:'red',signMs:900,longestGapMs:0,accepted:false});
 expect(signLog.entries().length).toBe(12);expect(signLog.entries()[0].at).toBe(14);
});
