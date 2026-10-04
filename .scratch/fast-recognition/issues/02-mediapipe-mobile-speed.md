# MediaPipe hand tracking speed on mobile browsers

Type: research
Status: resolved
Blocked by: none
Map: [Recognize signs within 2 seconds](../map.md)

## Question

For @mediapipe/tasks-vision HandLandmarker in the browser: does the GPU delegate work on Android
Chrome, iOS Safari and common tablets (and how does it fail)? How much faster is VIDEO mode
(tracking) than IMAGE mode per frame? How much does camera resolution (1280×720 vs 640×480) and
numHands (2 vs 1) change per-frame cost? Primary sources only; cite versions.

## Answer

Findings on branch `research/mediapipe-mobile-speed` (`.scratch/fast-recognition/research/mediapipe-mobile-speed.md`). Gist:
- **GPU delegate**: WebGL-based in 0.10.32. Failure throws at `createFromOptions` (no silent fallback),
  so catch → retry on CPU. One iOS Safari report of silently wrong GPU output: measure iOS before trusting GPU there.
- **VIDEO vs IMAGE**: no official numbers. VIDEO skips palm detection only when `numHands` hands were
  tracked last frame, so VIDEO must pair with `numHands: 1` for one-handed signs.
- **Resolution / numHands**: models run at 192/224 px, so resolution only changes upload/convert cost;
  the landmark model runs once per detected hand.
- **Guidance**: VIDEO mode for camera input; run detection in a web worker. Native Pixel 6: hand
  pipeline ~17 ms CPU / ~12 ms GPU; selfie segmenter ~34 ms.
- Implication: the detector alone likely doesn't explain 6–7 s per letter; dropped holds and the
  prediction step must be measured too.
