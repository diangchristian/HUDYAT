HUDYAT app model: colors, version b87e44bcae7c53f9 (trainer run final-colors-20261109-014711).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/colors/b87e44bcae7c53f9/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "colors" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
