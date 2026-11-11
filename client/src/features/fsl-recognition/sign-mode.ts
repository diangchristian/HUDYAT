/*
 * Capture policy is separate from normalization: recorded v1 releases also need full gestures.
 * Older releases retain their legacy settings; the selected recorder Alphabet always uses complete capture.
 */
import {hasHand,signWindow} from './sign-capture.js';
import type {RecognitionSettings} from './experiment.ts';

type Model={category:string;version?:string;handRelative:boolean;handRelativeSequence:boolean;faceLocation?:boolean};

/** Capture is a release capability, not a consequence of landmark normalization.
 * This recorder-trained v1 model needs a complete clip, including J/Z, with no early pose acceptance.
 * Its immutable model metadata and weights retain their original preprocessing contract.
 */
export function usesCompleteSignCapture(model:Pick<Model,'category'|'version'>){
 return (model.category==='alphabet'&&model.version==='7665532badb74b9f') ||
  Boolean(model.version&&({shapes:'c857755d0a3b6e5b',calendar:'8f1bc49d95cbbcc4',word_concepts:'856effe4d20522e9',wh_questions:'545f7bcbe18ccf63'} as Record<string,string>)[model.category]===model.version);
}

export function usesSignCapture(model:Model,settings:Pick<RecognitionSettings,'alphabetMotion'|'dynamicCapture'>){
 if(usesCompleteSignCapture(model))return true;
 if(model.category==='alphabet')return settings.alphabetMotion&&model.handRelativeSequence;
 return settings.dynamicCapture==='sign'&&(model.handRelative||model.handRelativeSequence||Boolean(model.faceLocation));
}

/** The raw frames of a finished sign, cut to its hands ±0.1 s (sign-capture.js); for models that convert the whole clip. */
export function cutSign(items:{raw:Float32Array}[],fps:number){
 const [start,end]=signWindow(items.map(item=>hasHand(item.raw)),fps);
 return items.slice(start,end+1).map(item=>item.raw);
}
