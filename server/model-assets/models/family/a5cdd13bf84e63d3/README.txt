HUDYAT app model: family, version a5cdd13bf84e63d3 (trainer run final-family-20261111-175651).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/family/a5cdd13bf84e63d3/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "family" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
   This model also needs the face detector: copy face_landmarker.task to
   HUDYAT/server/model-assets/shared/64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff.task
3. In HUDYAT/server run: npm run models:register
