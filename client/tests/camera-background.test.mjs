import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory localStorage so the persisted choice can be inspected and planted.
const store=new Map();
// zustand's persist reads window.localStorage.
globalThis.window={localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};
const {useCameraBackground}=await import('../src/lib/camera-background.ts');
const KEY='hudyat-camera-background';

test('no background until the learner picks one',()=>{
 assert.equal(useCameraBackground.getState().choice,'off');
});
test('a picked background is saved on the device',()=>{
 useCameraBackground.getState().choose('blur');
 assert.equal(useCameraBackground.getState().choice,'blur');
 assert.equal(JSON.parse(store.get(KEY)).state.choice,'blur');
});
test('a saved picture is restored',async()=>{
 store.set(KEY,JSON.stringify({state:{choice:'sky'},version:0}));
 await useCameraBackground.persist.rehydrate();
 assert.equal(useCameraBackground.getState().choice,'sky');
});
test('a saved picture that no longer exists falls back to none',async()=>{
 store.set(KEY,JSON.stringify({state:{choice:'removed-picture'},version:0}));
 await useCameraBackground.persist.rehydrate();
 assert.equal(useCameraBackground.getState().choice,'off');
});
