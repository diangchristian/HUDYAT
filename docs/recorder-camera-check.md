# Recorder model camera check

Use the original `HUDYAT` folder, branch `feature/dabest-camera-integration`. Stop old development servers first. Start `npm run dev` in `server`, then `npm run dev -- --port 5173 --strictPort` in `client`. Open http://localhost:5173 and log in with a learner account.

## Confirm the release and signs

Open Practice → Alphabet. “All signs” must include A–Z, Ñ, and Ng; the final two follow Z to preserve saved lesson positions. Lessons reads the same 28-sign service. Missing reference media for Ñ/Ng is displayed as a placeholder; it is not evidence of a missing model class.

Append `?lab=1` to the category practice URL and choose Baseline with the published model. Once recognition starts, the lab must show Alphabet `7665532badb74b9f` or Colors `b87e44bcae7c53f9`. Record that version, browser/device, camera frame rate and lighting with any test results.

## Supervised device test — pending

This checklist requires a real signer; automated capture and parity checks do not replace it.

| Check | Expected app behavior |
|---|---|
| A/B/C, Ñ, Ng, J and Z: perform a sign, then lower the hand | Collect the entire gesture; evaluate after 0.5 seconds of no detected hand. No “Hold still” guidance. |
| Pause midway through J/Z with the hand visible | No early success or progression. |
| Keep the hand visible beyond three seconds | Request hands down and retry; no success from the timeout clip. |
| Retry after lowering the hand | Start a fresh clip; no frames from the timed-out attempt. |
| Incorrect or incomplete movement, then hands down | Record any false acceptance. The current v1 model cannot guarantee rejection of an incorrect movement path. |
| Correct accepted sign | Advance once only. |
| N versus Ñ versus Ng | Distinct prompts and distinct target matching. |
| Left-handed signing | Clip is canonicalized as specified by the model; record performance separately. |
| Each Color | Existing full-gesture recognition remains available. |

Repeat attempts and record accepted/rejected outcomes rather than deriving accuracy from the confidence display. Use “Copy results (JSON)” for app timing diagnostics; supplement it with a record of what was actually signed. No live recognition score is claimed by this integration.

## Automated checks

Client: `npm test`, `npm run build`, and `npm run test:models` with `MODEL_TEST_API` pointing to the running server. Server: `npm run test:alphabet-signs`, `npm run build`, and `npm run models:alphabet-signs` for a read-only database preview. The applied update has been repeated once and reported zero changes.

The pre-update lesson snapshot is in the ignored server `backups/alphabet-extensions-2026-11-09T04-01-27-808Z.json`. Existing learner progress and assessments are not changed by the update.
