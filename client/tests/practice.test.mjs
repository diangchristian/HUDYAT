import { afterEach, test, expect, vi } from "vitest";
import { createCameraSession, cameraErrorMessage, cameraGrantRemembered, forgetCameraGrant, rememberCameraGrant } from "../src/lib/camera-session.ts";
import { categorySlug, nextUnstarred } from "../src/lib/practice.ts";

afterEach(() => vi.unstubAllGlobals());

function mockStream() {
  const tracks = [{ stops: 0, stop() { this.stops += 1; } }, { stops: 0, stop() { this.stops += 1; } }];
  return { getTracks: () => tracks };
}

test("camera session releases every active track and tolerates repeated cleanup", async () => {
  const camera = createCameraSession();
  const stream = mockStream();
  expect(await camera.start(async () => stream)).toBe(stream);
  camera.stop();
  camera.stop();
  expect(stream.getTracks().map((track) => track.stops)).toStrictEqual([1, 1]);
});

test("a permission request resolving after navigation cannot leave the camera running", async () => {
  const camera = createCameraSession();
  const stream = mockStream();
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  camera.stop();
  deferred.resolve(stream);
  expect(await pending).toBe(null);
  expect(stream.getTracks().map((track) => track.stops)).toStrictEqual([1, 1]);
});

test("a newer camera request wins even if an older request resolves later", async () => {
  const camera = createCameraSession();
  const stale = mockStream();
  const fresh = mockStream();
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  expect(await camera.start(async () => fresh)).toBe(fresh);
  deferred.resolve(stale);
  expect(await pending).toBe(null);
  expect(stale.getTracks().map((track) => track.stops)).toStrictEqual([1, 1]);
  expect(fresh.getTracks().map((track) => track.stops)).toStrictEqual([0, 0]);
  camera.stop();
});

test("restarting releases the previous stream", async () => {
  const camera = createCameraSession();
  const first = mockStream();
  const second = mockStream();
  await camera.start(async () => first);
  await camera.start(async () => second);
  expect(first.getTracks().map((track) => track.stops)).toStrictEqual([1, 1]);
  camera.stop();
  expect(second.getTracks().map((track) => track.stops)).toStrictEqual([1, 1]);
});

test("active permission errors reach the UI but cancelled errors do not", async () => {
  const camera = createCameraSession();
  const error = new Error("Permission denied");
  error.name = "NotAllowedError";
  await expect(camera.start(async () => { throw error; })).rejects.toMatchObject({ name: "NotAllowedError" });
  const deferred = Promise.withResolvers();
  const pending = camera.start(() => deferred.promise);
  camera.stop();
  deferred.reject(error);
  expect(await pending).toBe(null);
});

test("the camera only auto-starts while the remembered grant is still valid", async () => {
  const store = new Map();
  vi.stubGlobal("localStorage", { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) });
  const permissions = (query) => vi.stubGlobal("navigator", { permissions: { query } });

  permissions(async () => ({ state: "granted" }));
  expect(await cameraGrantRemembered(), "never granted here, so no surprise prompt").toBe(false);

  rememberCameraGrant();
  expect(await cameraGrantRemembered()).toBe(true);

  permissions(async () => { throw new TypeError("camera is not queryable"); });
  expect(await cameraGrantRemembered(), "unqueryable browsers rely on the flag").toBe(true);

  permissions(async () => ({ state: "prompt" }));
  expect(await cameraGrantRemembered(), "an expired grant must not prompt unasked").toBe(false);
  permissions(async () => ({ state: "granted" }));
  expect(await cameraGrantRemembered(), "the stale flag was cleared").toBe(false);

  rememberCameraGrant();
  forgetCameraGrant();
  expect(await cameraGrantRemembered()).toBe(false);
});

test("camera problems have actionable messages", () => {
  expect(cameraErrorMessage({ name: "NotAllowedError" })).toMatch(/site settings/);
  expect(cameraErrorMessage({ name: "NotFoundError" })).toMatch(/No camera/);
  expect(cameraErrorMessage({ name: "NotReadableError" })).toMatch(/other apps/);
  expect(cameraErrorMessage({ name: "SecurityError" })).toMatch(/disabled/);
  expect(cameraErrorMessage(new Error("unknown"))).toMatch(/couldn't start/);
});

test("category titles become the practice URL slugs", () => {
  expect(categorySlug("WH Questions")).toBe("wh-questions");
  expect(categorySlug("  Word Concepts ")).toBe("word-concepts");
});

test("after a correct sign, practice moves to the next sign without a star, wrapping around", () => {
  expect(nextUnstarred(new Set([0]), 0, 4)).toBe(1);
  expect(nextUnstarred(new Set([0, 1, 3]), 3, 4)).toBe(2);
  expect(nextUnstarred(new Set([2]), 2, 3)).toBe(0);
});

test("practice is finished once every sign has a star", () => {
  expect(nextUnstarred(new Set([0, 1, 2]), 1, 3)).toBe(null);
  expect(nextUnstarred(new Set(), 0, 0)).toBe(null);
});
