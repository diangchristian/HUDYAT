Label: wayfinder:map

# Recognize signs within 2 seconds

## Destination

Recognition on `feature/recog-enhancement` meets **≤ 2s time to recognize** (see CONTEXT.md) on
laptop, phone and tablet while keeping false accepts rare; the winning configuration is the
default, backed by lab measurements the panel can see.

## Notes

- **Execution is carried into this map** (overrides wayfinder's plan-only default): each ticket
  builds its change as a switch in the Recognition lab (`?lab=1`) and is decided by the user's
  measurements. Merge to main only if recognition actually improves.
- Student side only. Code: `client/src/features/fsl-recognition/`, camera in
  `client/src/components/common/practice-camera.tsx`, camera constraints in `client/src/hooks/use-camera.ts`.
- Every session consults the `grilling` and `domain-modeling` skills; vocabulary in `CONTEXT.md`.
- Supersedes the earlier background-blur-only plan: blur is now one ticket here.
- Starting evidence: on the user's phone, Enhanced lab settings still took ~6–7s per letter.

## Decisions so far

- Charting: "fast" means **time to recognize ≤ 2s** (hand in view → correct accepted).
- Charting: a **false accept is worse than slowness**; keep false accepts rare.
- Charting: target devices are **laptops, phones and tablets** (all must meet the target).
- Charting: the map **decides, builds and measures** on the experiment branch.
- [MediaPipe hand tracking speed on mobile browsers](issues/02-mediapipe-mobile-speed.md): GPU throws on failure (fall back to CPU; check iOS), VIDEO mode only helps with numHands 1, resolution changes only upload cost; detector alone likely isn't the 6–7 s.

## Not yet specified

- Per-device fallback: automatically lowering settings on slow or GPU-less devices, once we know
  how much devices differ.
- Model-side fixes (score calibration, retraining with phone-camera data) if "low score" /
  "low margin" still dominate dropped holds after tuning.
- How the before/after results are presented in the manuscript and defense.
- Running hand detection in a web worker (official guidance) if the main thread turns out to be the bottleneck.
- A "more light" hint (needs a cheap brightness check on camera pixels).

## Out of scope

- Teacher/admin side and the server.
- Replacing MediaPipe's hand detector.
