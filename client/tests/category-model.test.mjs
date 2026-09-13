// Run against the validation server on port 5011; no training or camera access.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as tf from '@tensorflow/tfjs';
import {buildModel,loadWeights} from '../src/features/fsl-recognition/category-core.js';
const api=process.env.MODEL_TEST_API || 'http://localhost:5011';
await tf.setBackend('cpu');
for(const category of ['alphabet','colors']){
 const response=await fetch(api+'/api/models/'+category);
 if(!response.ok)throw Error('API failed '+response.status);
 const {data:entry}=await response.json();
 if(entry.id!==category)throw Error('Wrong category');
 const metaBytes=await (await fetch(api+entry.modelUrl)).arrayBuffer();
 const bytes=await (await fetch(api+entry.weightsUrl)).arrayBuffer();
 for(const [buffer,hash] of [[metaBytes,entry.modelSha256],[bytes,entry.weightsSha256]])if(createHash('sha256').update(new Uint8Array(buffer)).digest('hex')!==hash)throw Error('Integrity mismatch');
 const metadata=JSON.parse(new TextDecoder().decode(metaBytes));
 const probe=JSON.parse(await readFile('../server/model-assets/models/'+category+'/'+entry.version+'/parity.json','utf8'));
 const model=buildModel(tf,metadata.classes.length);loadWeights(tf,model,metadata,bytes);
 const input=tf.tensor(probe.inputs),output=model.predict(input),actual=await output.array();
 let max=0;actual.forEach((row,i)=>row.forEach((v,j)=>max=Math.max(max,Math.abs(v-probe.expected[i][j]))));
 if(max>0.0002)throw Error('Prediction mismatch '+max);
 console.log(category,entry.version,'API + hashes + Python parity passed; max error',max);
 input.dispose();output.dispose();model.dispose();
}
if((await fetch(api+'/api/models/__unpublished_test_category__')).status!==404)throw Error('Missing category must return 404');
console.log('Unpublished category returns 404');
