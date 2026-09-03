import assert from "node:assert/strict";
import { test } from "node:test";
import { createCameraSession, cameraErrorMessage } from "../src/lib/camera-session.ts";
import { PRACTICE_PROMPTS, categorySlug, practicePosition } from "../src/lib/practice.ts";

function mockStream() {
  const tracks = [{ stops: 0, stop() { this.stops += 1; } }, { stops: 0, stop() { this.stops += 1; } }];
  return { getTracks: () => tracks };
}

test("camera session releases every active track and tolerates repeated cleanup", async () => {
  const camera = createCameraSession();
  const stream = mockStream();
  assert.equal(await camera.start(async () => stream), stream);
  camera.stop();
  camera.stop();
  assert.deepEqual(stream.getTracks().map((track) => track.stops), [1, 1]);
});

test("a permission request resolving after navigation cannot leave the camera running", async () => {
  const camera = createCameraSession();
  const stream = mockStream();
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  camera.stop();
  deferred.resolve(stream);
  assert.equal(await pending, null);
  assert.deepEqual(stream.getTracks().map((track) => track.stops), [1, 1]);
});

test("a newer camera request wins even if an older request resolves later", async () => {
  const camera = createCameraSession();
  const stale = mockStream();
  const fresh = mockStream();
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  assert.equal(await camera.start(async () => fresh), fresh);
  deferred.resolve(stale);
  assert.equal(await pending, null);
  assert.deepEqual(stale.getTracks().map((track) => track.stops), [1, 1]);
  assert.deepEqual(fresh.getTracks().map((track) => track.stops), [0, 0]);
  camera.stop();
});

test("restarting releases the previous stream", async () => {
  const camera = createCameraSession();
  const first = mockStream();
  const second = mockStream();
  await camera.start(async () => first);
  await camera.start(async () => second);
  assert.deepEqual(first.getTracks().map((track) => track.stops), [1, 1]);
  camera.stop();
  assert.deepEqual(second.getTracks().map((track) => track.stops), [1, 1]);
});

test("active permission errors reach the UI but cancelled errors do not", async () => {
  const camera = createCameraSession();
  const error = new Error("Permission denied");
  error.name = "NotAllowedError";
  await assert.rejects(camera.start(async () => { throw error; }), { name: "NotAllowedError" });
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  camera.stop();
  deferred.reject(error);
  assert.equal(await pending, null);
});

test("camera problems have actionable messages", () => {
  assert.match(cameraErrorMessage({ name: "NotAllowedError" }), /site settings/);
  assert.match(cameraErrorMessage({ name: "NotFoundError" }), /No camera/);
  assert.match(cameraErrorMessage({ name: "NotReadableError" }), /other apps/);
  assert.match(cameraErrorMessage({ name: "SecurityError" }), /disabled/);
  assert.match(cameraErrorMessage(new Error("unknown")), /couldn't start/);
});

test("every category has a working slug and unique starter prompts", () => {
  const titles = ["Alphabet", "Numbers", "Shapes", "Colors", "Greetings", "Calendar", "WH Questions", "Word Concepts"];
  for (const title of titles) {
    const prompts = PRACTICE_PROMPTS[categorySlug(title)];
    assert.ok(prompts.length > 0);
    assert.equal(new Set(prompts.map((prompt) => prompt.label)).size, prompts.length);
  }
  assert.equal(PRACTICE_PROMPTS.alphabet[0].label, "A");
  assert.equal(PRACTICE_PROMPTS.alphabet.at(-1).label, "Z");
  assert.equal(PRACTICE_PROMPTS["not-a-category"], undefined);
});

test("progress reflects prompt position without overflowing", () => {
  assert.equal(practicePosition(0, 5), 20);
  assert.equal(practicePosition(4, 5), 100);
  assert.equal(practicePosition(99, 5), 100);
  assert.equal(practicePosition(-5, 5), 0);
  assert.equal(practicePosition(0, 0), 0);
});
