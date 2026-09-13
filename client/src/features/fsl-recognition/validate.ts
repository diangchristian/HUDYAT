import * as tf from "@tensorflow/tfjs";
import { loadAlphabet } from "./engine";
import { normalize, predictPrepared, rank } from "./prediction.ts";
import { publicAsset } from "./registry.ts";

type Fixture = { source_sha256: string; classes: string[]; reference_engine: string;
  cases: {raw: number[][]; prepared: number[][]; scores: number[]; expected_top_label: string}[] };
export async function validateSavedExamples() {
  const runtime = await loadAlphabet();
  const response = await fetch(publicAsset("test-data/alphabet-poses.json"));
  if (!response.ok) throw new Error("Saved examples could not be loaded.");
  const fixture = await response.json() as Fixture;
  if (fixture.source_sha256 !== runtime.meta.source_sha256 ||
      fixture.classes.join(",") !== runtime.meta.classes.join(",") || fixture.cases.length !== 26)
    throw new Error("Saved examples do not match this model.");
  let maxError = 0;
  for (const example of fixture.cases) {
    const prepared = normalize(example.raw.map(([x,y,z]) => ({x,y,z})), runtime.meta);
    const scores = await predictPrepared(runtime, prepared);
    if (scores.length !== example.scores.length || rank(scores,1)[0].label !== example.expected_top_label)
      throw new Error("The model's labels differ from the Keras reference.");
    scores.forEach((value,i) => { maxError = Math.max(maxError, Math.abs(value.score - example.scores[i])); });
  }
  if (!Number.isFinite(maxError) || maxError > 0.0001) throw new Error("Predictions differ from the saved Keras reference.");
  await predictPrepared(runtime, fixture.cases[0].prepared);
  const before = tf.memory().numTensors;
  for(let i=0;i<20;i++) await predictPrepared(runtime, fixture.cases[0].prepared);
  const tensorGrowth = tf.memory().numTensors - before;
  if(tensorGrowth !== 0) throw new Error("Repeated predictions did not release their temporary tensors.");
  return { cases: fixture.cases.length, backend: tf.getBackend(), maxError, tensorGrowth,
    inputShape: [1,21,3], outputShape: [1,26], labelOrder: "matches Keras", reference: fixture.reference_engine };
}
