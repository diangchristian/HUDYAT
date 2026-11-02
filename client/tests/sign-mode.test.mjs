import test from 'node:test';
import assert from 'node:assert/strict';
import {cutSign,usesSignCapture} from '../src/features/fsl-recognition/sign-mode.ts';

const model=(category,normalization)=>({category,handRelative:normalization==='v1',handRelativeSequence:normalization==='sequence'});
const settings={alphabetMotion:true,dynamicCapture:'sign'};

test('every letter is recorded sign by sign, like Numbers, when the Alphabet model was trained on clips',()=>{
 assert.equal(usesSignCapture(model('alphabet','sequence'),settings),true);
 assert.equal(usesSignCapture(model('numbers','v1'),settings),true);
});
test('letters keep the hold-still lock with a model trained on still photos, or with the switch off',()=>{
 assert.equal(usesSignCapture(model('alphabet','v1'),settings),false);
 assert.equal(usesSignCapture(model('alphabet','none'),settings),false);
 assert.equal(usesSignCapture(model('alphabet','sequence'),{...settings,alphabetMotion:false}),false);
});
test('the Alphabet does not follow the moving-sign capture switch',()=>{
 assert.equal(usesSignCapture(model('alphabet','sequence'),{...settings,dynamicCapture:'fixed'}),true);
});
test('other categories use sign capture as before, for either hand-relative model',()=>{
 assert.equal(usesSignCapture(model('colors','v1'),settings),true);
 assert.equal(usesSignCapture(model('greetings','sequence'),settings),true);
 assert.equal(usesSignCapture(model('numbers','none'),settings),false);
 assert.equal(usesSignCapture(model('colors','v1'),{...settings,dynamicCapture:'fixed'}),false);
});
test('a sign is cut to the frames with a hand plus 0.1 s on each side, as raw frames',()=>{
 const frame=hand=>{const f=new Float32Array(128);f[127]=hand?1:0;return f;};
 // 10 fps: 5 empty, 10 with a hand, 5 empty -> 1 frame either side, and at least 8 frames.
 const items=[...Array(5)].map(()=>({raw:frame(false)})).concat([...Array(10)].map(()=>({raw:frame(true)})),[...Array(5)].map(()=>({raw:frame(false)})));
 const cut=cutSign(items,10);
 assert.equal(cut.length,12);
 assert.equal(cut[0],items[4].raw);
 assert.equal(cut[11],items[15].raw);
});
