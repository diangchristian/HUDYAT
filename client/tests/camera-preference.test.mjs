import { beforeEach, afterEach, test, expect } from "vitest";
import {useCameraPreference} from '../src/lib/camera-preference.ts';

beforeEach(() => useCameraPreference.getState().decline());
afterEach(() => useCameraPreference.getState().decline());
test('camera is not wanted until the learner starts it',()=>{
 expect(useCameraPreference.getState().wanted).toBe(false);
});
test('starting remembers the choice and an explicit stop forgets it',()=>{
 useCameraPreference.getState().want();
 expect(useCameraPreference.getState().wanted).toBe(true);
 useCameraPreference.getState().decline();
 expect(useCameraPreference.getState().wanted).toBe(false);
});
