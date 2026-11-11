import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRecordedSignCapture} from '../src/features/fsl-recognition/recorded-sign.ts';
import {usesCompleteSignCapture,usesSignCapture} from '../src/features/fsl-recognition/sign-mode.ts';
import {normalizeFrame} from '../src/features/fsl-recognition/normalize.ts';
import {isSteady,matchesTarget,createMatchCompletion} from '../src/features/fsl-recognition/gesture-lock.ts';

const meta=JSON.parse(readFileSync(new URL('../../server/model-assets/models/alphabet/7665532badb74b9f/model.json',import.meta.url),'utf8'));
const model={category:meta.category,version:meta.version,handRelative:true,handRelativeSequence:false};
const item=(at,present=true,left=false)=>{
 const raw=new Float32Array(128),base=left?0:63;
 if(present){
  raw[126+(left?0:1)]=1;
  for(let p=0;p<21;p++)raw.set([.3+(p%4)*.025+at*.00002,.3+Math.floor(p/4)*.025,0],base+p*3);
  // A changing finger shape as well as a moving hand, preserved by the model's v1 features.
  raw[base+24]+=.03*Math.sin(at/200);
 }
 return {at,raw,norm:normalizeFrame(raw,640,480)};
};
const push=(s,f)=>s.push(f,640,480);

test('actual selected release uses complete capture even with legacy motion disabled',()=>{
 assert.equal(usesCompleteSignCapture(model),true);
 for(const mode of ['sign','fixed','sliding'])assert.equal(usesSignCapture(model,{alphabetMotion:false,dynamicCapture:mode}),true);
 assert.equal(usesCompleteSignCapture({...model,version:'older'}),false);
 assert.equal(usesCompleteSignCapture({...model,category:'colors'}),false);
 assert.equal(usesSignCapture({...model,category:'colors'},{alphabetMotion:false,dynamicCapture:'sign'}),true);
});
test('all 28 database/seed labels map to exactly one model output, including decomposed Ñ',()=>{
 const seed=JSON.parse(readFileSync(new URL('../../server/prisma/data/learning/alphabet.json',import.meta.url),'utf8'));
 assert.equal(seed.length,28);
 for(const entry of seed)assert.equal(meta.classes.filter(c=>matchesTarget(c,entry.label)).length,1,entry.label);
 assert.equal(matchesTarget('letter_enye','N\u0303'),true);
 assert.equal(matchesTarget('letter_n','N\u0303'),false);
 assert.equal(matchesTarget('letter_ng','N'),false);
});
test('moving Alphabet input reaches inference only after 500ms of hands down, as 32 varied frames',()=>{
 const capture=createRecordedSignCapture();let ready;
 const a=item(0),b=item(400);b.raw[63]+=.4;
 assert.equal(isSteady(a.raw,b.raw),false,'motion would fail the old hold gate');
 for(let at=0;at<=1200;at+=40){assert.equal(push(capture,at===400?b:item(at)),null);}
 assert.equal(capture.message(true),'Perform the full sign, then lower your hand');
 for(let at=1240;at<1720;at+=40)assert.equal(push(capture,item(at,false)),null);
 ready=push(capture,item(1720,false));
 assert.equal(ready.kind,'ready');assert.equal(ready.input.length,32);
 assert.ok(ready.input.every(row=>row.length===128));
 assert.ok(new Set(ready.input.map(row=>JSON.stringify(row))).size>10,'not a repeated still frame');
 // One blank frame either side after 0.1s trim at 25fps, instead of retaining 0.5s of hands down.
 assert.ok(ready.input.filter(row=>!row[126]&&!row[127]).length<8);
 for(let at=1760;at<=2200;at+=40)assert.equal(push(capture,item(at,false)),null);
 let completions=0;const complete=createMatchCompletion('J',()=>completions++);
 complete.accept('letter_i');assert.equal(completions,0);
 complete.accept('letter_j');complete.accept('letter_j');assert.equal(completions,1);
});
test('brief tracking gaps do not end a gesture',()=>{
 const capture=createRecordedSignCapture();
 for(let at=0;at<=1600;at+=40){const present=at<600||at>=900;assert.equal(push(capture,item(at,present)),null);}
 let decision;
 for(let at=1640;at<=2120;at+=40)decision=push(capture,item(at,false))??decision;
 assert.equal(decision.kind,'ready');
});
test('the 3-second cutoff rejects the clip, requires rest, then allows a fresh attempt',()=>{
 const capture=createRecordedSignCapture();let decision;
 for(let at=0;at<=3000;at+=40)decision=push(capture,item(at))??decision;
 assert.deepEqual(decision,{kind:'retry',reason:'max_length'});
 assert.equal(capture.message(true),'Lower your hand, then try again');
 for(let at=3040;at<=4000;at+=40)assert.equal(push(capture,item(at)),null);
 for(let at=4040;at<=4560;at+=40)assert.equal(push(capture,item(at,false)),null);
 for(let at=4600;at<=5400;at+=40)assert.equal(push(capture,item(at)),null);
 let second;
 for(let at=5440;at<=5920;at+=40)second=push(capture,item(at,false))??second;
 assert.equal(second.kind,'ready');
});
test('very sparse observations and hand-detection blips do not produce predictions',()=>{
 const capture=createRecordedSignCapture();
 assert.equal(push(capture,item(0)),null);assert.equal(push(capture,item(250)),null);
 assert.deepEqual(push(capture,item(800,false)),{kind:'retry',reason:'too_short'});
 const blip=createRecordedSignCapture();
 assert.equal(push(blip,item(0)),null);assert.equal(push(blip,item(600,false)),null);
});
test('left-hand clips use the exported canonical-hand conversion',()=>{
 const capture=createRecordedSignCapture();let decision;
 for(let at=0;at<=800;at+=40)assert.equal(push(capture,item(at,true,true)),null);
 for(let at=840;at<=1320;at+=40)decision=push(capture,item(at,false,true))??decision;
 assert.equal(decision.kind,'ready');
 const hands=decision.input.filter(row=>row[126]||row[127]);
 assert.ok(hands.length>0);assert.ok(hands.every(row=>row[126]===0&&row[127]===1));
 assert.ok(hands.every(row=>row[66]<0),'canonical mirroring negates x and swaps slots');
});
