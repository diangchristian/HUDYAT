import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planAlphabetExtensions} from '../prisma/scripts/alphabetExtensions.ts';
const alphabet=JSON.parse(readFileSync(new URL('../prisma/data/learning/alphabet.json',import.meta.url),'utf8'));
const extensions=alphabet.filter((entry:{label:string})=>['Ñ','Ng'].includes(entry.label));
const signs=Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ',(label,i)=>({id:String(i),label,modelClass:label}));
const links=signs.map((sign,i)=>({gestureId:sign.id,displayOrder:i+1}));

test('seed adds Ñ and Ng after A–Z without inventing reference media',()=>{
 assert.equal(alphabet.length,28);
 assert.deepEqual(alphabet.slice(0,26).map((e:{label:string})=>e.label),Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
 assert.deepEqual(extensions.map((e:{displayOrder:number})=>e.displayOrder),[27,28]);
 assert.ok(extensions.every((e:{referenceImageUrl?:string;referenceVideoUrl?:string})=>!e.referenceImageUrl&&!e.referenceVideoUrl));
});
test('appends the two missing signs without mutating existing records',()=>{
 const original=JSON.stringify({signs,links});
 const plan=planAlphabetExtensions(signs,links,extensions);
 assert.deepEqual(plan.map(p=>[p.label,p.createGesture,p.createLink,p.displayOrder]),[['Ñ',true,true,27],['Ng',true,true,28]]);
 assert.equal(JSON.stringify({signs,links}),original);
});
test('a repeated run makes no changes and preserves existing IDs, classes, and order',()=>{
 const existing=[...signs,{id:'enye',label:'N\u0303',modelClass:'letter_enye'},{id:'ng',label:'Ng',modelClass:'Ng'}];
 const joined=[...links,{gestureId:'enye',displayOrder:27},{gestureId:'ng',displayOrder:28}];
 const plan=planAlphabetExtensions(existing,joined,extensions);
 assert.ok(plan.every(p=>!p.createGesture&&!p.createLink));
 assert.deepEqual(plan.map(p=>[p.gestureId,p.modelClass,p.displayOrder]),[['enye','letter_enye',27],['ng','Ng',28]]);
});
test('reuses an existing unlinked sign and appends after occupied positions',()=>{
 const plan=planAlphabetExtensions([...signs,{id:'enye',label:'Ñ',modelClass:'Ñ'}],[...links,{gestureId:'other',displayOrder:30}],extensions);
 assert.equal(plan[0]!.createGesture,false);assert.equal(plan[0]!.createLink,true);
 assert.deepEqual(plan.map(p=>p.displayOrder),[31,32]);
});
test('conflicting labels or duplicate semantic signs abort rather than overwrite data',()=>{
 assert.throws(()=>planAlphabetExtensions([...signs,{id:'bad',label:'Ñ',modelClass:'N'}],links,extensions),/Conflicting/);
 assert.throws(()=>planAlphabetExtensions([...signs,{id:'x',label:'Ñ',modelClass:'Ñ'},{id:'y',label:'N\u0303',modelClass:'letter_enye'}],links,extensions),/Ambiguous/);
});
