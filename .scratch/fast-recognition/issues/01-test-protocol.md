# Test protocol for a fair before/after comparison

Type: grilling
Status: open
Blocked by: none
Map: [Recognize signs within 2 seconds](../map.md)

## Question

Which letters and moving signs (include easily confused pairs), how many repetitions per sign,
which conditions (good/dim light, plain/cluttered background, near/far) and which devices
(laptop, phone, tablet) make a fair, repeatable before/after comparison — and what result counts as
"meets ≤ 2s with rare false accepts" (e.g. median and 90th percentile time to recognize, false
accepts per 20 attempts)?

## Draft proposal (for the user to confirm — not decided)

- **Signs**: alphabet A, B, C, E, M, N, S, T, Y + 3 moving signs from one category. M/N and S/T/A
  are easily confused, so they expose false accepts.
- **Reps**: 5 per sign per configuration, in a fixed order; Reset results between configurations.
- **Conditions**: good light + plain background as the main run; then dim light, and cluttered background.
- **Devices**: the defense laptop, one Android phone, one tablet (iPhone/iPad too if available — GPU
  may misbehave on iOS).
- **Configurations**: Baseline, Enhanced, then Enhanced with one switch off at a time to see which switch helps.
- **Pass**: median time to recognize ≤ 2 s, 90th percentile ≤ 3 s, and ≤ 1 false accept per 20 attempts.
- **Record**: type the condition into the lab, then Copy results (JSON) after each run.
