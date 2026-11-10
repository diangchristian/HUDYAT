import { test, expect } from "vitest";
import fs from "node:fs/promises";
import * as tf from "@tensorflow/tfjs";
import { normalize, predictPrepared, predictPose, predictClip, validateMetadata, validateModel } from "../src/features/fsl-recognition/prediction.ts";
import { modelForCategory, ALPHABET_RELEASE } from "../src/features/fsl-recognition/registry.ts";
import { describePrediction } from "../src/features/fsl-recognition/feedback.ts";
const root = new URL("../public/", import.meta.url);
const read = async file => JSON.parse(await fs.readFile(new URL(file, root), "utf8"));

test("HUDYAT's copied release matches real Keras examples and releases temporary tensors", async () => {
  await tf.setBackend("cpu"); await tf.ready();
  const [meta, json, fixture, binary] = await Promise.all([
    read("models/alphabet/metadata.json"), read("models/alphabet/model.json"), read("test-data/alphabet-poses.json"), fs.readFile(new URL("models/alphabet/weights.bin", root)),
  ]);
  const model = await tf.loadLayersModel(tf.io.fromMemory({modelTopology: json.modelTopology,
    weightSpecs: json.weightsManifest[0].weights, weightData: binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)}));
  const runtime = {model, meta};
  try {
    validateModel(model, meta);
    expect(meta.source_sha256).toBe(ALPHABET_RELEASE.sourceHash);
    expect(meta.classes).toStrictEqual(ALPHABET_RELEASE.classes);
    expect(meta.classes).toStrictEqual(fixture.classes);
    let maxError = 0;
    for(const sample of fixture.cases) {
      const points = sample.raw.map(([x,y,z]) => ({x,y,z}));
      expect(normalize(points,meta)).toStrictEqual(sample.prepared);
      const scores = await predictPrepared(runtime, normalize(points,meta));
      scores.forEach((score,i) => {maxError = Math.max(maxError, Math.abs(score.score - sample.scores[i]));});
      expect((await predictPose(runtime,points))[0].label).toBe(sample.expected_top_label);
    }
    expect(maxError <= 1e-4, `Keras score difference: ${maxError}`).toBeTruthy();
    const before = tf.memory().numTensors;
    for(let i=0;i<20;i++) await predictPrepared(runtime,fixture.cases[0].prepared);
    expect(tf.memory().numTensors).toBe(before);
    await expect(predictPrepared(runtime,Array(30).fill(fixture.cases[0].prepared))).rejects.toThrow(/Expected input shape/);
    await expect(predictPrepared(runtime,Array.from({length:21},()=>[NaN,0,0]))).rejects.toThrow(/non-finite/);
    await expect(predictClip(runtime,[],[])).rejects.toThrow(/No trained 30-frame/);
    expect(()=>validateMetadata({...meta,classes:["A","A"]})).toThrow(/label order/);
    expect(()=>validateMetadata({...meta,std:[0,1,1]})).toThrow(/normalization/);
    expect(()=>validateModel(model,{...meta,classes:["A","B"]})).toThrow(/label list/);
    console.log(JSON.stringify({cases:fixture.cases.length,maxError,tensorGrowth:tf.memory().numTensors-before}));
  } finally {model.dispose();}
});

test("untrained categories cannot select the alphabet release and dynamic signs are not marked correct", () => {
  expect(modelForCategory("alphabet")).toBe(ALPHABET_RELEASE);
  for(const category of ["numbers","family","wh-questions","wh_words","../alphabet",undefined]) expect(modelForCategory(category)).toBe(undefined);
  expect(describePrediction([{label:"J",score:.99}],"J")).toMatch(/cannot check the movement/);
  expect(describePrediction([{label:"A",score:.99}],"Z")).toMatch(/cannot check the movement/);
  expect(describePrediction([{label:"A",score:.4}],"A")).toMatch(/Not certain/);
  expect(describePrediction([{label:"A",score:.9}],"A")).toMatch(/Possible match/);
  expect(describePrediction([{label:"B",score:.9}],"A")).toMatch(/Possible B/);
});
