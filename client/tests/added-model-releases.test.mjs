import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as tf from '@tensorflow/tfjs';
import {buildModel,loadWeights} from '../src/features/fsl-recognition/category-core.js';
import {matchesTarget} from '../src/features/fsl-recognition/gesture-lock.ts';
import {usesCompleteSignCapture} from '../src/features/fsl-recognition/sign-mode.ts';
import {fileModelId,hasCameraModel} from '../../server/src/config/file-models.ts';
const root=new URL('../../server/model-assets/',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('catalog.json',root)));
for(const [id,count] of [['calendar',22],['shapes',8],['word_concepts',10],['wh_questions',6]])test(id+' integrity, target coverage and browser parity',async()=>{
 const entry=catalog.categories.find(e=>e.id===id);assert.ok(entry.available);
 const bytes=readFileSync(new URL(entry.modelUrl,root)),bin=readFileSync(new URL(entry.weightsUrl,root));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(sha(bytes),entry.modelSha256);assert.equal(sha(bin),entry.weightsSha256);assert.equal(bytes.length+bin.length,entry.bytes);
 assert.equal(sha(readFileSync(new URL(entry.handUrl,root))),entry.handSha256);
 const meta=JSON.parse(bytes),p=JSON.parse(readFileSync(new URL('models/'+id+'/'+entry.version+'/parity.json',root)));
 assert.equal(meta.classes.length,count);assert.equal(meta.category,id);assert.ok(usesCompleteSignCapture({category:id,version:entry.version}));
 const read=name=>JSON.parse(readFileSync(new URL('../../server/prisma/data/learning/'+name+'.json',import.meta.url)));
 const targets=id==='calendar'?[...read('calendar'),...read('days')]:read(id.replaceAll('_','-'));
 const missing=targets.filter(t=>!meta.classes.some(c=>matchesTarget(c,t.label))).map(t=>t.label);
 assert.deepEqual(missing,[]);
 assert.equal(meta.classes.filter(c=>matchesTarget(c,'Family')).length,id==='word_concepts'?1:0);
 await tf.setBackend('cpu');const model=buildModel(tf,count,128),input=tf.tensor(p.inputs);let output;
 try{loadWeights(tf,model,meta,bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength));output=model.predict(input);let error=0;
 (await output.array()).forEach((r,i)=>{assert.equal(r.indexOf(Math.max(...r)),p.expected[i].indexOf(Math.max(...p.expected[i])));r.forEach((v,j)=>error=Math.max(error,Math.abs(v-p.expected[i][j])));});assert.ok(error<0.0002);
 }finally{input.dispose();output?.dispose();model.dispose();}
});
test('unknown releases do not force full capture',()=>assert.equal(usesCompleteSignCapture({category:'unknown'}),false));
test('Colors lesson contains only the six supported targets',()=>{
 const targets=JSON.parse(readFileSync(new URL('../../server/prisma/data/learning/colors.json',import.meta.url)));
 const entry=catalog.categories.find(e=>e.id==='colors');
 const meta=JSON.parse(readFileSync(new URL(entry.modelUrl,root)));
 assert.equal(targets.length,6);
 for(const [i,target] of targets.entries()){
  assert.equal(target.displayOrder,i+1);
  assert.equal(meta.classes.filter(c=>matchesTarget(c,target.label)).length,1);
 }
});
test('lesson slugs resolve to exports and every lesson model can start all-signs tests',()=>{
 for(const name of ['Word Concepts','word-concepts','word_concepts'])assert.equal(fileModelId(name),'word_concepts');
 assert.equal(fileModelId('WH Questions'),'wh_questions');
 for(const name of ['Calendar','Word Concepts','Family','Shapes','WH Questions'])assert.equal(hasCameraModel(name),true);
 assert.equal(hasCameraModel('Unknown'),false);
});
