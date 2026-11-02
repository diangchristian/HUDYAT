import test from 'node:test';
import assert from 'node:assert/strict';
import {useCameraPreference} from '../src/lib/camera-preference.ts';
test('camera is not wanted until the learner starts it',()=>{
 assert.equal(useCameraPreference.getState().wanted,false);
});
test('starting remembers the choice and an explicit stop forgets it',()=>{
 useCameraPreference.getState().want();
 assert.equal(useCameraPreference.getState().wanted,true);
 useCameraPreference.getState().decline();
 assert.equal(useCameraPreference.getState().wanted,false);
});
