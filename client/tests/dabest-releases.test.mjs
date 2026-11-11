import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as tf from '@tensorflow/tfjs';
import {buildModel,loadWeights} from '../src/features/fsl-recognition/category-core.js';
import {matchesTarget,createMatchCompletion} from '../src/features/fsl-recognition/gesture-lock.ts';
const assets=new URL('../../server/model-assets/',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('catalog.json',assets),'utf8'));
test('recorder Alphabet IDs match lesson targets without confusing N and Ñ',()=>{
 for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')assert.equal(matchesTarget('letter_'+c.toLowerCase(),c),true);
 assert.equal(matchesTarget('letter_enye','Ñ'),true);assert.equal(matchesTarget('letter_ng','Ng'),true);
 assert.equal(matchesTarget('letter_n','Ñ'),false);assert.equal(matchesTarget('letter_enye','N'),false);
 assert.equal(matchesTarget('letter_ng','N'),false);assert.equal(matchesTarget('letter_a','B'),false);
 assert.equal(matchesTarget('violet','Purple'),true);assert.equal(matchesTarget('blue','Blue'),true);
 let count=0;const c=createMatchCompletion('Ñ',()=>count++);c.accept('letter_n');assert.equal(count,0);c.accept('letter_enye');c.accept('letter_enye');assert.equal(count,1);
});
for(const [category,version,count] of [['alphabet','7665532badb74b9f',28],['colors','b87e44bcae7c53f9',6]])test(category+' release integrity and TF.js parity',async()=>{
 await tf.setBackend('cpu');const entry=catalog.categories.find(e=>e.id===category);assert.equal(entry.version,version);assert.equal(entry.classes,count);
 const metaBytes=readFileSync(new URL(entry.modelUrl,assets)),bin=readFileSync(new URL(entry.weightsUrl,assets));
 const sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(metaBytes),entry.modelSha256);assert.equal(sha(bin),entry.weightsSha256);assert.equal(metaBytes.length+bin.length,entry.bytes);
 assert.equal(sha(readFileSync(new URL(entry.handUrl,assets))),entry.handSha256);
 const meta=JSON.parse(metaBytes),probe=JSON.parse(readFileSync(new URL('models/'+category+'/'+version+'/parity.json',assets),'utf8'));
 assert.equal(meta.classes.length,count);assert.equal(meta.preprocessing.normalization,'hand-relative-v1');assert.equal(meta.preprocessing.sign_window.trim_margin_s,0.1);assert.equal(meta.preprocessing.sign_window.trim_min_frames,8);assert.equal(probe.inputs.length,8);
 if(category==='alphabet'){assert.ok(meta.classes.includes('letter_enye'));assert.ok(meta.classes.includes('letter_ng'));}
 const model=buildModel(tf,count,128),input=tf.tensor(probe.inputs);let output;
 try{loadWeights(tf,model,meta,bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength));output=model.predict(input);const actual=await output.array();
 let error=0;actual.forEach((row,i)=>{assert.equal(row.indexOf(Math.max(...row)),probe.expected[i].indexOf(Math.max(...probe.expected[i])));row.forEach((v,j)=>error=Math.max(error,Math.abs(v-probe.expected[i][j])));});assert.ok(error<0.0002,'max error '+error);
 }finally{input.dispose();output?.dispose();model.dispose();}
});
