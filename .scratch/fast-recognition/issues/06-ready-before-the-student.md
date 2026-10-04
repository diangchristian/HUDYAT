# Ready before the student is

Type: task
Status: claimed
Blocked by: none
Map: [Recognize signs within 2 seconds](../map.md)

## Question

Preload and warm up the recognition model and hand detector before the camera step (e.g. while
the lesson's reference video plays) so no download or start-up happens while the student waits.
How much time to recognize does that remove on a first attempt, and when should preloading start?

## Build (awaiting measurement)

Built: the lesson page preloads the runtime while the student reads/watches; camera steps borrow and return it. The lab shows preloaded yes/no and how long the camera waited for the model. Practice pages already load at page open (camera mounts immediately), so they don't preload.

Decide with the test protocol's numbers (Baseline vs Enhanced vs single switches).
