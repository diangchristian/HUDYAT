HUDYAT app model: alphabet, version 7665532badb74b9f (trainer run final-alphabet-20261108-131532).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/alphabet/7665532badb74b9f/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "alphabet" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
