/*
 * Which prompts are recorded sign by sign (the hands going down ends the sign) instead of the Alphabet
 * hold-still lock. When the Alphabet model was trained on clips (hand-relative-sequence-v1), every letter
 * works like Numbers: a letter held still is answered early (early-check.ts), and J and Z, drawn in the air,
 * are answered when the hands go down. With an Alphabet model trained on still photos, every letter keeps
 * the hold-still lock.
 */
import {hasHand,signWindow} from './sign-capture.js';
import type {RecognitionSettings} from './experiment.ts';

type Model={category:string;handRelative:boolean;handRelativeSequence:boolean;faceLocation?:boolean};

export function usesSignCapture(model:Model,settings:Pick<RecognitionSettings,'alphabetMotion'|'dynamicCapture'>){
 if(model.category==='alphabet')return settings.alphabetMotion&&model.handRelativeSequence;
 return settings.dynamicCapture==='sign'&&(model.handRelative||model.handRelativeSequence||Boolean(model.faceLocation));
}

/** The raw frames of a finished sign, cut to its hands ±0.1 s (sign-capture.js); for models that convert the whole clip. */
export function cutSign(items:{raw:Float32Array}[],fps:number){
 const [start,end]=signWindow(items.map(item=>hasHand(item.raw)),fps);
 return items.slice(start,end+1).map(item=>item.raw);
}
