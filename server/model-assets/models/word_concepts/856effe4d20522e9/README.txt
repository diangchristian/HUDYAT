HUDYAT app model: word_concepts, version 856effe4d20522e9 (trainer run final-word_concepts-20261110-175618).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/word_concepts/856effe4d20522e9/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "word_concepts" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
