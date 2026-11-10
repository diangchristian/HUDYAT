import { test, expect } from "vitest";
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
  expect(inspectFrame(makeFrame())).toStrictEqual({ length: 128, hands: 0, landmarksPerHand: [], valid: true });
  expect(inspectFrame(makeFrame([1]))).toStrictEqual({ length: 128, hands: 1, landmarksPerHand: [21], valid: true });
  expect(inspectFrame(makeFrame([0, 1]))).toStrictEqual({ length: 128, hands: 2, landmarksPerHand: [21, 21], valid: true });
});

test("inspectFrame flags missing landmarks, bad values and a wrong frame length", () => {
  const zeroed = makeFrame([0]);
  zeroed.fill(0, 0, 3);
  expect(inspectFrame(zeroed).landmarksPerHand[0]).toBe(20);
  expect(inspectFrame(zeroed).valid).toBe(false);

  const notANumber = makeFrame([0]);
  notANumber[4] = NaN;
  expect(inspectFrame(notANumber).valid).toBe(false);

  expect(inspectFrame(new Float32Array(64)).valid).toBe(false);
});

test("the result waits until a hand reaches the model, then passes", () => {
  landmarkDiagnostics.reset();
  expect(passed().result).toBe("WAITING");

  landmarkDiagnostics.recordCapture(makeFrame(), context);
  expect(passed().result, "no hand yet").toBe("WAITING");

  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  expect(passed().result, "detected, but not yet supplied to the model").toBe("WAITING");

  landmarkDiagnostics.recordModelCall([frame], { prediction: "A", score: 0.9 });
  expect(passed().result).toBe("PASS");
  expect(landmarkDiagnostics.summary().modelCalls).toBe(1);
});

test("a call that never reached the model does not count as supplied", () => {
  landmarkDiagnostics.reset();
  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  landmarkDiagnostics.recordModelCall([frame], {});
  landmarkDiagnostics.recordModelCall([makeFrame()], { prediction: "A", score: 0.9 });
  expect(landmarkDiagnostics.summary().modelCalls).toBe(0);
  expect(passed().result).toBe("WAITING");
});

test("invalid landmark data blocks a pass", () => {
  landmarkDiagnostics.reset();
  const bad = makeFrame([0]);
  bad[4] = NaN;
  landmarkDiagnostics.recordCapture(bad, context);
  const good = makeFrame([0]);
  landmarkDiagnostics.recordCapture(good, context);
  landmarkDiagnostics.recordModelCall([good], { prediction: "A", score: 0.9 });
  expect(landmarkDiagnostics.summary().invalidFrames).toBe(1);
  expect(passed().result).toBe("WAITING");
});

test("the copied result never contains landmark coordinates", () => {
  landmarkDiagnostics.reset();
  const frame = makeFrame([0]);
  landmarkDiagnostics.recordCapture(frame, context);
  landmarkDiagnostics.recordModelCall([frame], { prediction: "A", score: 0.9 });
  const exported = JSON.parse(landmarkDiagnostics.export());
  expect(exported.test).toBe("FT-06");
  expect(exported.result).toBe("PASS");
  expect(Object.values(exported).filter((value) => ArrayBuffer.isView(value))).toStrictEqual([]);
  expect(exported.latestLandmarksPerHand).toStrictEqual([21]);
});
