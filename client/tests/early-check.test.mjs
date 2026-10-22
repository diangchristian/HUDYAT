import test from 'node:test';
import assert from 'node:assert/strict';
import {createEarlyCheck} from '../src/features/fsl-recognition/early-check.ts';

// 25 frames per second: one frame every 40 ms.
const run=(frames)=>{const early=createEarlyCheck(),checks=[];
 frames.forEach(([present,signing],i)=>{const sofar=early.push({at:i*40,i},present,signing);if(sofar)checks.push(sofar.map(f=>f.i));});
 return checks;};

test('a held sign is checked every 0.5 s once it has 0.4 s of hands, from just before the first hand',()=>{
 const checks=run([...Array(5).fill([false,false]),...Array(40).fill([true,true])]);
 assert.equal(checks.length,3);                                    // at 0.52 s, 1.04 s and 1.56 s of the sign
 assert.equal(checks[0][0],0);                                     // starts with the frames before the hand
 assert.equal(checks[0].at(-1),5+13);
 assert.deepEqual(checks.map(c=>c.length),[19,32,45]);
});
test('nothing is checked while no sign is in progress, or before 0.4 s of hands',()=>{
 assert.equal(run(Array(30).fill([false,false])).length,0);
 assert.equal(run([...Array(9).fill([true,true]),...Array(20).fill([false,true])]).length,0);   // 0.32 s of hands
});
test('a new sign starts a new check',()=>{
 const checks=run([...Array(20).fill([true,true]),...Array(5).fill([false,false]),...Array(20).fill([true,true])]);
 assert.ok(checks.length>=2);
 assert.ok(checks.at(-1)[0]>=10 && !checks.at(-1).includes(0));   // the second sign does not reach back into the first
});
