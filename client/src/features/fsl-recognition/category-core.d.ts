import type * as tf from '@tensorflow/tfjs';
export function buildModel(t:typeof tf,classes:number):tf.Sequential;
export function loadWeights(t:typeof tf,model:tf.LayersModel,metadata:unknown,buffer:ArrayBuffer):void;
export function packResult(result:unknown,swap?:boolean):Float32Array;
export function resample(frames:Float32Array[]):Float32Array;
export function sha256(buffer:ArrayBuffer):Promise<string>;
