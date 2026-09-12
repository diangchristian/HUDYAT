import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { loadModel, predictPose } from "./prediction.ts";
import { ALPHABET_RELEASE, publicAsset } from "./registry.ts";
import type { RecognitionUpdate } from "./feedback.ts";

export async function loadAlphabet() {
  const runtime = await loadModel(publicAsset(ALPHABET_RELEASE.folder));
  if (runtime.meta.category !== "alphabet" ||
      runtime.meta.source_sha256 !== ALPHABET_RELEASE.sourceHash ||
      runtime.meta.input_shape.join(",") !== "21,3" ||
      runtime.meta.classes.join(",") !== ALPHABET_RELEASE.classes.join(",")) {
    throw new Error("The alphabet release does not match its validated labels and input format.");
  }
  return runtime;
}

/** Owns a detector and loop, but never requests or owns the user's camera stream. */
export function startLiveRecognition(video: HTMLVideoElement, update: (value: RecognitionUpdate) => void) {
  let stopped = false, frame = 0, detector: HandLandmarker | undefined;
  const emit = (value: RecognitionUpdate) => { if (!stopped) update(value); };
  const closeDetector = () => { detector?.close(); detector = undefined; };
  void (async () => {
    // Defer the first update so React effect setup remains side-effect-safe.
    await Promise.resolve();
    if (stopped) return;
    emit({ phase: "loading", matches: [], message: "Loading recognition on this device…" });
    const runtime = await loadAlphabet();
    if (stopped) return;
    const vision = await FilesetResolver.forVisionTasks(publicAsset("mediapipe/wasm"));
    if (stopped) return;
    detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: publicAsset("mediapipe/hand_landmarker.task") },
      runningMode: "VIDEO", numHands: 2,
      minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    if (stopped) { closeDetector(); return; }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot prepare camera frames.");
    let lastVideoTime = -1, lastRun = -Infinity;
    emit({ phase: "ready", matches: [], message: "Bring one hand into view." });
    const draw = async (now: number) => {
      if (stopped) return;
      try {
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastRun >= 200) {
          lastRun = now; lastVideoTime = video.currentTime;
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          // Python's LEGACY camera flips pixels before detection. CSS mirroring alone is insufficient.
          context.setTransform(-1, 0, 0, 1, canvas.width, 0);
          context.drawImage(video, 0, 0);
          context.setTransform(1, 0, 0, 1, 0, 0);
          const result = detector!.detectForVideo(canvas, performance.now());
          if (result.landmarks.length !== 1) {
            emit({ phase: result.landmarks.length ? "multiple-hands" : "no-hand", matches: [],
              message: result.landmarks.length ? "Use one hand for alphabet pose recognition." : "Bring one hand into view." });
          } else {
            const matches = await predictPose(runtime, result.landmarks[0]);
            emit({ phase: "prediction", matches, message: "" });
          }
        }
        if (!stopped) frame = requestAnimationFrame(draw);
      } catch (error) {
        emit({ phase: "error", matches: [], message: error instanceof Error ? error.message : "Recognition stopped. Try again." });
        closeDetector();
      }
    };
    frame = requestAnimationFrame(draw);
  })().catch(error => {
    emit({ phase: "error", matches: [], message: error instanceof Error ? error.message : "Could not load recognition." });
    closeDetector();
  });
  return () => { stopped = true; cancelAnimationFrame(frame); closeDetector(); };
}
