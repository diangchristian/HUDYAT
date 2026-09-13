import * as tf from '@tensorflow/tfjs';
import {prepareClip,SEQUENCE_FORMAT,SEQUENCE_NORMALIZATION} from './sequence.ts';
import type {RawClip,Sequence} from './sequence';
export type Point={x:number;y:number;z:number};
export type Meta={category:string;classes:string[];input_shape:number[];source_sha256?:string;model_type?:string;
 mean?:number[];std?:number[];format?:string;normalization?:string;hand_order?:string[];features?:string[]};
export type Match={label:string;score:number};
export type ModelRuntime={model:tf.LayersModel;meta:Meta};
const pending=new Map<string,Promise<ModelRuntime>>();
export function validateMetadata(value:unknown):asserts value is Meta{
 const m=value as Meta;
 if(!m||typeof m.category!=='string'||!Array.isArray(m.classes)||m.classes.length<2||
  m.classes.some(c=>typeof c!=='string'||!c)||new Set(m.classes).size!==m.classes.length||!Array.isArray(m.input_shape))
  throw Error('Invalid model metadata or label order.');
 if(m.input_shape.join(',')==='21,3'){
  if(m.model_type!=='single-frame-one-hand'||m.mean?.length!==3||m.std?.length!==3||!m.mean.every(Number.isFinite)||!m.std.every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid single-frame normalization.');
 }else if(m.input_shape.join(',')==='30,42,4'){
  if(m.format!==SEQUENCE_FORMAT||m.normalization!==SEQUENCE_NORMALIZATION||m.hand_order?.join(',')!=='Left,Right'||m.features?.join(',')!=='x,y,z,present')throw Error('Unsupported sequence preprocessing contract.');
 }else throw Error('Unsupported input shape; expected (21,3) or (30,42,4).');
}
export function validateModel(model:tf.LayersModel,meta:Meta){
 validateMetadata(meta);
 if(model.inputs.length!==1||model.outputs.length!==1||model.inputs[0].shape.slice(1).join(',')!==meta.input_shape.join(',')||model.outputs[0].shape.length!==2||model.outputs[0].shape[1]!==meta.classes.length)throw Error('The model shape and saved label list do not match.');
}
export function loadModel(base='/models/alphabet'):Promise<ModelRuntime>{
 if(!pending.has(base))pending.set(base,(async()=>{
  await tf.ready();const response=await fetch(`${base}/metadata.json`);
  if(!response.ok)throw Error('Model metadata is unavailable. Train and export this category first.');
  const meta:unknown=await response.json();validateMetadata(meta);
  const model=await tf.loadLayersModel(`${base}/model.json`);
  try{validateModel(model,meta);return {model,meta};}catch(error){model.dispose();throw error;}
 })().catch(error=>{pending.delete(base);throw error;}));return pending.get(base)!;
}
export function normalize(points:Point[],meta:Meta):number[][]{
 validateMetadata(meta);if(meta.input_shape.join(',')!=='21,3')throw Error('This model requires a complete two-hand clip.');
 if(points.length!==21||points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw Error('Expected 21 finite x/y/z landmarks.');
 return points.map(p=>[p.x,p.y,p.z].map((v,i)=>Math.fround(Math.fround(Math.fround(v)-meta.mean![i])/meta.std![i])));
}
function checkShape(value:unknown,shape:number[],depth=0):void{
 if(depth===shape.length){if(typeof value!=='number'||!Number.isFinite(value))throw Error('Input contains a non-finite value.');return;}
 if(!Array.isArray(value)||value.length!==shape[depth])throw Error(`Expected input shape (${shape.join(',')}).`);
 value.forEach(item=>checkShape(item,shape,depth+1));
}
/** Preprocessed input WITHOUT batch dimension. Results retain saved encoder order. */
export async function predictPrepared(runtime:ModelRuntime,prepared:number[][]|Sequence):Promise<Match[]>{
 validateModel(runtime.model,runtime.meta);checkShape(prepared,runtime.meta.input_shape);
 const input=tf.tensor(prepared.flat(2),[1,...runtime.meta.input_shape],'float32');let output:tf.Tensor|tf.Tensor[]|undefined;
 try{
  output=runtime.model.predict(input) as tf.Tensor|tf.Tensor[];
  if(Array.isArray(output)||output.shape.join(',')!==`1,${runtime.meta.classes.length}`)throw Error('Unexpected prediction output shape.');
  const scores=Array.from(await output.data());if(!scores.every(Number.isFinite))throw Error('Model produced non-finite scores.');
  return scores.map((score,i)=>({label:runtime.meta.classes[i],score}));
 }finally{input.dispose();if(output)tf.dispose(output);}
}
export function rank(scores:Match[],count=3):Match[]{return [...scores].sort((a,b)=>b.score-a.score).slice(0,count);}
export async function predictPose(runtime:ModelRuntime,points:Point[]){return rank(await predictPrepared(runtime,normalize(points,runtime.meta)));}
export async function predictClip(runtime:ModelRuntime,coords:RawClip,timestamps:number[]){
 if(runtime.meta.input_shape.join(',')!=='30,42,4')throw Error('No trained 30-frame model is loaded. The single-frame model cannot recognize a clip.');
 return rank(await predictPrepared(runtime,prepareClip(coords,timestamps)));
}
