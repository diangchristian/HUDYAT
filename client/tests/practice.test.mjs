import assert from "node:assert/strict";
import { test } from "node:test";
import { createCameraSession, cameraErrorMessage, cameraGrantRemembered, forgetCameraGrant, rememberCameraGrant } from "../src/lib/camera-session.ts";
import { categorySlug, nextUnstarred } from "../src/lib/practice.ts";

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

test("the camera only auto-starts while the remembered grant is still valid", async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const permissions = (query) => Object.defineProperty(globalThis, "navigator", { configurable: true, value: { permissions: { query } } });

  permissions(async () => ({ state: "granted" }));
  assert.equal(await cameraGrantRemembered(), false, "never granted here, so no surprise prompt");

  rememberCameraGrant();
  assert.equal(await cameraGrantRemembered(), true);

  permissions(async () => { throw new TypeError("camera is not queryable"); });
  assert.equal(await cameraGrantRemembered(), true, "unqueryable browsers rely on the flag");

  permissions(async () => ({ state: "prompt" }));
  assert.equal(await cameraGrantRemembered(), false, "an expired grant must not prompt unasked");
  permissions(async () => ({ state: "granted" }));
  assert.equal(await cameraGrantRemembered(), false, "the stale flag was cleared");

  rememberCameraGrant();
  forgetCameraGrant();
  assert.equal(await cameraGrantRemembered(), false);
});

test("camera problems have actionable messages", () => {
  assert.match(cameraErrorMessage({ name: "NotAllowedError" }), /site settings/);
  assert.match(cameraErrorMessage({ name: "NotFoundError" }), /No camera/);
  assert.match(cameraErrorMessage({ name: "NotReadableError" }), /other apps/);
  assert.match(cameraErrorMessage({ name: "SecurityError" }), /disabled/);
  assert.match(cameraErrorMessage(new Error("unknown")), /couldn't start/);
});

test("category titles become the practice URL slugs", () => {
  assert.equal(categorySlug("WH Questions"), "wh-questions");
  assert.equal(categorySlug("  Word Concepts "), "word-concepts");
});

test("after a correct sign, practice moves to the next sign without a star, wrapping around", () => {
  assert.equal(nextUnstarred(new Set([0]), 0, 4), 1);
  assert.equal(nextUnstarred(new Set([0, 1, 3]), 3, 4), 2);
  assert.equal(nextUnstarred(new Set([2]), 2, 3), 0);
});

test("practice is finished once every sign has a star", () => {
  assert.equal(nextUnstarred(new Set([0, 1, 2]), 1, 3), null);
  assert.equal(nextUnstarred(new Set(), 0, 0), null);
});
