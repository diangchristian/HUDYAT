# Client tests

Run these commands from `client/`. In Windows PowerShell, use `npm.cmd` if
execution policy blocks `npm.ps1`.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the 14 local Vitest suites once (79 tests at migration). |
| `npm run test:watch` | Run the same suites and rerun on file changes; press `q` to exit. |
| `npm test -- tests/practice.test.mjs` | Run one suite. |
| `npm run build` then `npm run test:pwa` | Run the separate production service-worker check. |
| `npm run test:models` | Run category-model validation against a live validation API. |

Vitest uses `vitest.config.mjs` and the Node environment, independently of the
application's Vite/PWA plugins. Tests keep their `.test.mjs` filenames and import
`test`, `expect`, and any hooks directly from `vitest`. New local suites matching
`tests/*.test.mjs` are discovered automatically. Tests within a file are sequential.

## Assets and isolation

- The default suite needs no live server or camera. It includes real TensorFlow.js
  checks, not just mocked recognition results.
- `recognition.test.mjs` requires the alphabet release under
  `public/models/alphabet/` and `public/test-data/alphabet-poses.json`.
- `normalize.test.mjs` uses the JSON fixtures in this directory. Its optional
  single-frame fixture check skips with a reason when `fixtures-normalize.json`
  is absent; the sequence fixture is required.
- `candidate-model.test.mjs` skips with a reason when
  `../server/model-assets/models/alphabet/candidate.json` is absent. If present,
  its referenced metadata, weights, and parity fixture must be valid.
- Practice tests restore browser globals after each test. Camera preference tests
  reset the Zustand store before and after each test.
- `recognition-browser.html` and `.tsx` are a manual browser harness, not Vitest suites.

## Separate checks

`category-model.test.mjs` remains a standalone Node script and is excluded from
Vitest. It uses `MODEL_TEST_API` (default `http://localhost:5011`) and local parity
files under `../server/model-assets/models/`. It verifies alphabet, colors, family,
asset hashes, prediction parity, and the missing-category response.

`pwa-build.test.mjs` runs only through `test:pwa`. It preserves the existing
skip when its generated artifacts cannot be read. The current Vite PWA build
produces `dist/sw.js` but does not produce the expected `dist/precache.json`, so
this test skips even after a successful build. A skip is not evidence that the
PWA caching assertions passed; aligning this older check with the current PWA
build is separate work.

## Migration verification

- Before migration: 77 default Node tests passed, plus 2 separately run camera
  preference tests.
- After migration: all 79 tests passed in Vitest run and watch modes, with no skips
  in the default suite. The production build passed.
- The separate PWA test skipped for the artifact mismatch described above.
- Client lint still reports the same pre-existing 13 errors and 4 warnings in
  generated `dev-dist` Workbox code and UI component exports.
- Live category-model validation was not run as part of the runner migration.

The migration preserves test cases, numerical tolerances, real model execution,
and fixtures. It does not add the proposed assessment/progress/UI test coverage.
