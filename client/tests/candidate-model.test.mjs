import { test, expect } from "vitest";
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as tf from '@tensorflow/tfjs';
import {buildModel,loadWeights} from '../src/features/fsl-recognition/category-core.js';

// The retrained alphabet candidate (published by fsl-alphabet-model) must load with the app's
// own loader and reproduce Keras' outputs, and its files must match candidate.json's hashes.
const assets=new URL('../../server/model-assets/',import.meta.url);
const candidateFile=new URL('models/alphabet/candidate.json',assets);
test('alphabet candidate loads in the browser loader and matches Keras',async({skip})=>{
 if(!existsSync(candidateFile)) skip('no candidate published');
 await tf.setBackend('cpu');
 const entry=JSON.parse(readFileSync(candidateFile,'utf8'));
 const file=url=>readFileSync(new URL(url.replace('/api/models/files/',''),assets));
 const metaBytes=file(entry.modelUrl),weightBytes=file(entry.weightsUrl);
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 expect(sha(metaBytes)).toBe(entry.modelSha256);
 expect(sha(weightBytes)).toBe(entry.weightsSha256);
 const metadata=JSON.parse(metaBytes.toString('utf8'));
 expect(metadata.version).toBe(entry.version);
 expect(metadata.preprocessing.normalization).toBe('hand-relative-v1');
 const probe=JSON.parse(readFileSync(new URL(`models/alphabet/${entry.version}/parity.json`,assets),'utf8'));
 const model=buildModel(tf,metadata.classes.length);
 const buffer=weightBytes.buffer.slice(weightBytes.byteOffset,weightBytes.byteOffset+weightBytes.byteLength);
 loadWeights(tf,model,metadata,buffer);
 const input=tf.tensor(probe.inputs),output=model.predict(input),actual=await output.array();
 let max=0;actual.forEach((row,i)=>row.forEach((v,j)=>max=Math.max(max,Math.abs(v-probe.expected[i][j]))));
 expect(max<2e-4, 'max error '+max).toBeTruthy();
 input.dispose();output.dispose();model.dispose();
});
