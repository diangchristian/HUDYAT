import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDiagnostics, inspectFrame, landmarkDiagnostics } from "../src/features/fsl-recognition/landmark-diagnostics.ts";

/** Builds a frame in packResult's layout with the given hands present. */
function makeFrame(hands = []) {
  const frame = new Float32Array(128);
  for (const hand of hands) {
    for (let i = 0; i < 63; i++) frame[hand * 63 + i] = 0.1 + i / 1000;
    frame[126 + hand] = 1;
  }
  return frame;
}

const context = { category: "alphabet", target: "A" };
const passed = () => evaluateDiagnostics(landmarkDiagnostics.summary());

test("inspectFrame reports no hand, one hand and two hands", () => {
  assert.deepEqual(inspectFrame(makeFrame()), { length: 128, hands: 0, landmarksPerHand: [], valid: true });
  assert.deepEqual(inspectFrame(makeFrame([1])), { length: 128, hands: 1, landmarksPerHand: [21], valid: true });
  assert.deepEqual(inspectFrame(makeFrame([0, 1])), { length: 128, hands: 2, landmarksPerHand: [21, 21], valid: true });
});

test("inspectFrame flags missing landmarks, bad values and a wrong frame length", () => {
  const zeroed = makeFrame([0]);
  zeroed.fill(0, 0, 3);
  assert.equal(inspectFrame(zeroed).landmarksPerHand[0], 20);
  assert.equal(inspectFrame(zeroed).valid, false);

  const notANumber = makeFrame([0]);
  notANumber[4] = NaN;
  assert.equal(inspectFrame(notANumber).valid, false);

  assert.equal(inspectFrame(new Float32Array(64)).valid, false);
});

test("the result waits until a hand reaches the model, then passes", () => {
  landmarkDiagnostics.reset();
  assert.equal(passed().result, "WAITING");

  landmarkDiagnostics.recordCapture(makeFrame(), context);
  assert.equal(passed().result, "WAITING", "no hand yet");

  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  assert.equal(passed().result, "WAITING", "detected, but not yet supplied to the model");

  landmarkDiagnostics.recordModelCall([frame], { prediction: "A", score: 0.9 });
  assert.equal(passed().result, "PASS");
  assert.equal(landmarkDiagnostics.summary().modelCalls, 1);
});

test("a call that never reached the model does not count as supplied", () => {
  landmarkDiagnostics.reset();
  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  landmarkDiagnostics.recordModelCall([frame], {});
  landmarkDiagnostics.recordModelCall([makeFrame()], { prediction: "A", score: 0.9 });
  assert.equal(landmarkDiagnostics.summary().modelCalls, 0);
  assert.equal(passed().result, "WAITING");
});

test("invalid landmark data blocks a pass", () => {
  landmarkDiagnostics.reset();
  const bad = makeFrame([0]);
  bad[4] = NaN;
  landmarkDiagnostics.recordCapture(bad, context);
  const good = makeFrame([0]);
  landmarkDiagnostics.recordCapture(good, context);
  landmarkDiagnostics.recordModelCall([good], { prediction: "A", score: 0.9 });
  assert.equal(landmarkDiagnostics.summary().invalidFrames, 1);
  assert.equal(passed().result, "WAITING");
});

test("the copied result never contains landmark coordinates", () => {
  landmarkDiagnostics.reset();
  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  landmarkDiagnostics.recordModelCall([frame], { prediction: "A", score: 0.9 });
  const exported = JSON.parse(landmarkDiagnostics.export());
  assert.equal(exported.test, "FT-06");
  assert.equal(exported.result, "PASS");
  assert.deepEqual(Object.values(exported).filter((value) => ArrayBuffer.isView(value)), []);
  assert.deepEqual(exported.latestLandmarksPerHand, [21]);
});
