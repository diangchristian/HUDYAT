HUDYAT app model: shapes, version c857755d0a3b6e5b (trainer run final-shapes-20261111-155855).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/shapes/c857755d0a3b6e5b/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "shapes" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
