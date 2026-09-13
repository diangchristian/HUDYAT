import assert from "node:assert/strict";
import { test } from "node:test";
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
    assert.equal(meta.source_sha256, ALPHABET_RELEASE.sourceHash);
    assert.deepEqual(meta.classes, ALPHABET_RELEASE.classes);
    assert.deepEqual(meta.classes, fixture.classes);
    let maxError = 0;
    for(const sample of fixture.cases) {
      const points = sample.raw.map(([x,y,z]) => ({x,y,z}));
      assert.deepEqual(normalize(points,meta), sample.prepared);
      const scores = await predictPrepared(runtime, normalize(points,meta));
      scores.forEach((score,i) => {maxError = Math.max(maxError, Math.abs(score.score - sample.scores[i]));});
      assert.equal((await predictPose(runtime,points))[0].label, sample.expected_top_label);
    }
    assert.ok(maxError <= 1e-4, `Keras score difference: ${maxError}`);
    const before = tf.memory().numTensors;
    for(let i=0;i<20;i++) await predictPrepared(runtime,fixture.cases[0].prepared);
    assert.equal(tf.memory().numTensors,before);
    await assert.rejects(predictPrepared(runtime,Array(30).fill(fixture.cases[0].prepared)),/Expected input shape/);
    await assert.rejects(predictPrepared(runtime,Array.from({length:21},()=>[NaN,0,0])),/non-finite/);
    await assert.rejects(predictClip(runtime,[],[]),/No trained 30-frame/);
    assert.throws(()=>validateMetadata({...meta,classes:["A","A"]}),/label order/);
    assert.throws(()=>validateMetadata({...meta,std:[0,1,1]}),/normalization/);
    assert.throws(()=>validateModel(model,{...meta,classes:["A","B"]}),/label list/);
    console.log(JSON.stringify({cases:fixture.cases.length,maxError,tensorGrowth:tf.memory().numTensors-before}));
  } finally {model.dispose();}
});

test("untrained categories cannot select the alphabet release and dynamic signs are not marked correct", () => {
  assert.equal(modelForCategory("alphabet"), ALPHABET_RELEASE);
  for(const category of ["numbers","family","wh-questions","wh_words","../alphabet",undefined]) assert.equal(modelForCategory(category),undefined);
  assert.match(describePrediction([{label:"J",score:.99}],"J"),/cannot check the movement/);
  assert.match(describePrediction([{label:"A",score:.99}],"Z"),/cannot check the movement/);
  assert.match(describePrediction([{label:"A",score:.4}],"A"),/Not certain/);
  assert.match(describePrediction([{label:"A",score:.9}],"A"),/Possible match/);
  assert.match(describePrediction([{label:"B",score:.9}],"A"),/Possible B/);
});
