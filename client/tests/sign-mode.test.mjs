import { test, expect } from "vitest";
import {cutSign,usesSignCapture} from '../src/features/fsl-recognition/sign-mode.ts';

const model=(category,normalization)=>({category,handRelative:normalization==='v1',handRelativeSequence:normalization==='sequence'});
const settings={alphabetMotion:true,dynamicCapture:'sign'};

test('every letter is recorded sign by sign, like Numbers, when the Alphabet model was trained on clips',()=>{
 expect(usesSignCapture(model('alphabet','sequence'),settings)).toBe(true);
 expect(usesSignCapture(model('numbers','v1'),settings)).toBe(true);
});
test('letters keep the hold-still lock with a model trained on still photos, or with the switch off',()=>{
 expect(usesSignCapture(model('alphabet','v1'),settings)).toBe(false);
 expect(usesSignCapture(model('alphabet','none'),settings)).toBe(false);
 expect(usesSignCapture(model('alphabet','sequence'),{...settings,alphabetMotion:false})).toBe(false);
});
test('the Alphabet does not follow the moving-sign capture switch',()=>{
 expect(usesSignCapture(model('alphabet','sequence'),{...settings,dynamicCapture:'fixed'})).toBe(true);
});
test('other categories use sign capture as before, for either hand-relative model',()=>{
 expect(usesSignCapture(model('colors','v1'),settings)).toBe(true);
 expect(usesSignCapture(model('greetings','sequence'),settings)).toBe(true);
 expect(usesSignCapture(model('numbers','none'),settings)).toBe(false);
 expect(usesSignCapture(model('colors','v1'),{...settings,dynamicCapture:'fixed'})).toBe(false);
});
test('a sign is cut to the frames with a hand plus 0.1 s on each side, as raw frames',()=>{
 const frame=hand=>{const f=new Float32Array(128);f[127]=hand?1:0;return f;};
 // 10 fps: 5 empty, 10 with a hand, 5 empty -> 1 frame either side, and at least 8 frames.
 const items=[...Array(5)].map(()=>({raw:frame(false)})).concat([...Array(10)].map(()=>({raw:frame(true)})),[...Array(5)].map(()=>({raw:frame(false)})));
 const cut=cutSign(items,10);
 expect(cut.length).toBe(12);
 expect(cut[0]).toBe(items[4].raw);
 expect(cut[11]).toBe(items[15].raw);
});
