# Category model integration

Selecting a category in Learn or Practice requests its model release from GET /api/models/:category. The database Category.modelRelease JSON stores the version, hashes and file URLs. Server/model-assets holds model parameters, served by /api/models/files; the browser performs all landmark extraction and classification. Camera images never go to this API.

Registered releases:
- Alphabet: runs/alphabet/webcam_v2, version 1efc1d730f3d6431.
- Colors: runs/colors/first, version fd6cbabbd4b1082c. This existing checkpoint has low test accuracy; integration does not improve it.

The UI shows the saved version. Only requested categories are downloaded. Each artifact is SHA-256 verified and saved in Cache Storage. Cached catalog entries provide a network-failure fallback; a confirmed 404 removes the old catalog entry. The PWA does not precache model files. The shared MediaPipe runtime is cached on use. Recognition may work offline after use; authenticated lesson retrieval is still dependent on the existing app's data/auth behavior, so full offline lessons are not guaranteed.

Alphabet uses repeated 32-frame held poses; its training sources include only still images, even for J/Z. Other categories capture a complete two-second gesture and uniformly resample its coordinates to 32 frames. Both use the trainer's 128 features, exact label ordering, two hand slots and binary presence flags. Pixels are not flipped; only the camera preview is mirrored. No legacy mean/std or wrist/scale normalization is applied. Results are estimates; no automatic lesson completion or assessment grading was added.

## Run
Use the existing server and client development commands (npm run dev in each folder). Restart the server after updating code, and refresh the client. The additive modelRelease migration and the two model registrations have been applied to the configured database. An older, unrelated column-removal migration was intentionally not applied. Review that separately before any blanket migrate deploy command.

## Publish a future trained run
From fsl_trainer:

```powershell
python pwa-sample/tools/export_model.py --category alphabet --run runs/alphabet/NEW_RUN --site where C:/Users/Russel/Desktop/HUDYAT/server/model-assets
```

Then from HUDYAT/server:

```powershell
npm run models:register
```

The registration script matches a unique database category by name and updates its release. Deploy the model-assets directory with the server (persistent storage in production), alongside the code. Clients fetch the new version when re-entering the category online; existing downloaded weights have versioned URLs.

For a fresh deployment, apply the additive category-model migration after reviewing your migration state, regenerate Prisma, register models, install client dependencies and run npm run models:assets before building. Set VITE_API_URL to the backend origin when the API is hosted separately; configure CLIENT_ORIGIN on the server accordingly. HTTPS is required outside localhost.

## Validation
Both client and server production builds passed. client/tests/category-model.test.mjs runs against a server on port 5011 and checks database-backed model selection, artifact checksums, missing-category 404 behavior, and Python/TF.js output parity for both exported checkpoints. Run from client with node tests/category-model.test.mjs. Live camera recognition and physical-device offline behavior still require manual testing. Existing legacy recognition files remain for their old tests, but the camera component now uses category-recognition.tsx.

## Recognition sound and automatic progression
Recognition is now headless: no prediction panel, hold-progress UI, or result overlay is rendered. The camera controls remain. A sufficiently confident, stable alphabet match to the current target triggers public/sounds/correct.mp3 and advances exactly once. Wrong or uncertain predictions do not advance and can be retried without lowering the hand. New targets start a fresh hold.

Learn uses prompt.modelClass and its existing Continue transition (the next sign's Meaning step, or the existing finish flow for the final sign). Practice uses prompt.label and advances directly to the next prompt or completion screen. Manual navigation remains available. Existing lesson checkpoint saves still run; no new assessment grades or schema changes were added.

The success sound is prepared during the user's Start Camera click and included in the offline app assets. If playback is blocked by browser policy or device mute, progression still works. Moving categories automatically evaluate two-second clips after a hand enters view; no recording overlay/button remains. J/Z remain pose-only estimates because this checkpoint was trained on still images, not verified motion recognition.

Validation: six unit tests cover hold duration, confidence, ambiguity, motion, missing hands, label comparison, and one completion per target. Client production build and targeted lint passed. Physical camera/audio behavior still needs a device check.

Incorrect confident attempts now play public/sounds/wrong.mp3 without advancing. The same wrong label is sounded once until the hand is removed for at least 500ms; a different confidently held wrong label can sound again. Uncertain/no-hand predictions remain silent. Both sound files are cached with the PWA. Seven gesture-lock tests cover correct advancement and wrong-sound suppression/reset.

A small status pill now appears beside the existing camera status: green check/Correct or red cross/Try again. Incorrect feedback clears after 1.8 seconds. Correct feedback stays visible for 650ms before automatic progression; manual navigation, stopping the camera or unmounting cancels the delayed advance. Sounds are unchanged.

## Clean checkout / push preparation
Use Node.js 22.18+ (or Node.js 24 LTS) for the TypeScript-based Node tests. In each of client and server run npm ci. Set server/.env from .env.example using your own credentials; client/.env.example documents the optional backend origin. Never commit real environment files.

Prisma output, server/dist, and copied browser MediaPipe WASM files remain tracked, preserving this repository's existing deployment convention. npm run dev and npm run build also regenerate the corresponding files automatically. server/model-assets remains versioned and must be deployed with the server. Review migration state before deploying: the unrelated pending column-removal migration still needs its own decision.

Checks: client npm test, client npm run build, server npm run build. For API/model parity start the backend on port 5011 and run npm run test:models in client. MODEL_TEST_API can override that address. The model test reads releases without changing the database.

## Recorder models in the original HUDYAT checkout (2026-11-09)

The current integration is on `feature/dabest-camera-integration` in the original HUDYAT folder. Alphabet release `7665532badb74b9f` has 28 outputs (including Ñ and Ng); Colors release `b87e44bcae7c53f9` has six. Other catalog entries and old release directories remain intact. The catalog selects the releases without model-registration database writes.

The recorder Alphabet now uses complete-gesture capture even though its features are `hand-relative-v1`. It collects actual frames, waits for 0.5 seconds without a hand, trims with a 0.1-second margin and an eight-frame minimum, resamples to 32 frames, and applies the exported canonical-hand convention. It has no steadiness gate or early-pose acceptance. At the three-second limit it requests a retry and waits for hands down. Normal camera guidance is “Perform the full sign, then lower your hand.” Legacy capture settings in the lab cannot turn this release into a repeated-photo model. Colors retains its existing capture policy.

The seed and configured database now include Ñ and Ng, appended at positions 27 and 28 to preserve existing lesson positions. Existing A–Z IDs, teacher content, and ordering were verified unchanged. The targeted update is `npm run models:alphabet-signs` (preview) or `npm run models:alphabet-signs -- --apply` from server; it does not alter progress, assessment questions, or other categories. Ñ and Ng currently have no reference media and remain unvalidated. Lessons and Practice use the existing missing-media placeholder.

Validation: 87 client tests and five isolated Alphabet-update tests passed; client and server production builds passed. The real API served both intended versions, with TF.js parity maximum error `1.1920928955078125e-7`. The lesson service returned 28 targets, each matching exactly one Alphabet output; reapplying the database update reported zero changes. Prior unrelated working-tree edits were preserved. Live signing/device accuracy was not measured.

The installed Alphabet model is `final-alphabet-20261108-131532`, completed 2026-11-08 14:08:33. Its 1,283 historical training/validation originals differ from the currently retained dataset. The separate 93.78% LOSO score does not belong to this saved model. v1 features retain shape/orientation changes but remove wrist translation: complete capture is not evidence that J/Z paths are recognized correctly. Full provenance remains beside each release.

Rollback catalog entries are saved in `docs/dabest-models-rollback.json`. Do not delete the added signs when rolling back a model: learners may already have used them. The older Alphabet has only 26 outputs and will explicitly report Ñ/Ng as unsupported. See `docs/recorder-camera-check.md` for local testing and remaining device checks.

## Family Parents release (2026-11-12)
Family now selects a5cdd13bf84e63d3 from final-family-20261111-175651: 10 classes including parents, 32 x 141 face-location features. Previous entry: docs/family-model-rollback.json. No database writes. Live signing accuracy remains unverified.

## Additional categories (2026-11-12)
Enabled Calendar (22), Shapes (8), Word Concepts (10), and WH Questions (6), preserving trainer IDs, preprocessing and output ordering. All four use full gesture capture. family_concept matches the Family word-concept target. Calendar and Word Concepts support all-signs camera tests. Shapes lacks Pentagon/Hexagon; WH Questions lacks Which/How Many/How Much/Whose, so their all-signs tests remain unavailable. Existing lessons are preserved and unsupported prompts show the existing unsupported-model message. Rollback catalog: docs/four-models-rollback.json. No database writes; live signing remains unverified.

## Colors lesson coverage (2026-11-12)
Removed Black, White, Pink and Brown from Colors lesson links and seed data. The live lesson retains Red, Blue, Yellow, Green, Orange and Violet (Purple in seed; equivalent model target). Historical gestures/assessment references remain intact. The targeted script is server/prisma/scripts/trimColors.ts (preview; --apply writes), with backup and checkpoint remapping. Full Colors camera-test coverage now matches its six-sign lesson.

## Applying lesson updates on another database
From server, run npx tsx prisma/scripts/reorderAlphabet.ts to preview, then add --apply to save A-N, Ñ, Ng, O-Z. Run npx tsx prisma/scripts/trimColors.ts to preview, then add --apply to retain the six supported Colors signs. Both scripts back up affected records and remap learner checkpoints transactionally. Apply these targeted scripts instead of reseeding existing lessons. Restart the API after updating code/model assets. Model integration itself requires no schema migration.

## Shapes and WH Questions lesson coverage (2026-11-12)
Removed Pentagon and Hexagon from Shapes, and Which, How Many, How Much and Whose from WH Questions, so every lesson sign has a model output and all-signs camera tests run in both. Their quizzes, and the Colors quiz left over from the Colors trim, drop questions about removed signs and swap removed wrong answers for kept signs. Gestures and other history stay. On another database run `npx tsx prisma/scripts/trimLessonSigns.ts` from server to preview, then add `--apply`; it backs up, remaps checkpoints and refuses to change a quiz that has attempts.
