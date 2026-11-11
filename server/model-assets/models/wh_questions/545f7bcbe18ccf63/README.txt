HUDYAT app model: wh_questions, version 545f7bcbe18ccf63 (trainer run final-wh_questions-20261105-091232).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/wh_questions/545f7bcbe18ccf63/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "wh_questions" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
