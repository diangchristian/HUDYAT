HUDYAT app model: calendar, version 8f1bc49d95cbbcc4 (trainer run final-calendar-20261111-164442).

1. Copy model.json, weights.bin and parity.json to
   HUDYAT/server/model-assets/models/calendar/8f1bc49d95cbbcc4/
2. In HUDYAT/server/model-assets/catalog.json, replace the entry with "id": "calendar" by the one in
   catalog_entry.json (the hand detector in shared/ is the same file the app already has).
3. In HUDYAT/server run: npm run models:register
