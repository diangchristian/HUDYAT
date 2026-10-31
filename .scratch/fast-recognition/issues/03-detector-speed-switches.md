# Detector speed switches

Type: task
Status: claimed
Blocked by: 01, 02
Map: [Recognize signs within 2 seconds](../map.md)

## Question

Build as lab switches, then decide by measurement: VIDEO (tracking) mode for alphabet hand
detection, GPU delegate with CPU fallback, 640×480 camera, and one hand for alphabet. Which
combination should be the default on each device class?

## Build (awaiting measurement)

Lab switches built: alphabet tracking (VIDEO), hand tracking on CPU/GPU (GPU falls back to CPU on a start-up error; the lab shows which is in use), camera 1280×720 / 640×480, alphabet hands 1/2. All on in Enhanced, off in Baseline.

Decide with the test protocol's numbers (Baseline vs Enhanced vs single switches).
