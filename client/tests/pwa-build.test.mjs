import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import {test} from "node:test";

test("production worker caches the recognition release and never handles private API responses", async t => {
  let worker, precache;
  try {
    worker = await fs.readFile(new URL("../dist/sw.js",import.meta.url),"utf8");
    precache = JSON.parse(await fs.readFile(new URL("../dist/precache.json",import.meta.url),"utf8"));
  } catch { t.skip("Run npm run build first to validate generated PWA assets."); return; }
  assert.ok(precache.assets.includes("./models/alphabet/weights.bin"));
  assert.ok(precache.assets.includes("./mediapipe/hand_landmarker.task"));
  assert.ok(!precache.assets.some(path => path.includes("/api/")));
  for(const asset of precache.assets) await fs.access(new URL("../dist/"+asset.slice(2),import.meta.url));
  const handlers={};
  const context={URL,Response,self:{registration:{scope:"https://hudyat.test/"},location:{origin:"https://hudyat.test"},addEventListener:(name,fn)=>handlers[name]=fn},
    fetch:()=>{throw Error("Unexpected fetch");},caches:{}};
  vm.runInNewContext(worker,context);
  for(const [url,method] of [["https://hudyat.test/api/auth/me","GET"],["https://hudyat.test/api/progress","POST"],["https://other.test/profile","GET"]]) {
    handlers.fetch({request:{url,method,mode:"cors"},respondWith(){assert.fail("Private/API request intercepted");}});
  }
});
