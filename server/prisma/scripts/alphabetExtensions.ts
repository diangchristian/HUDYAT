export type ExistingSign={id:string;label:string;modelClass:string};
export type ExistingLink={gestureId:string;displayOrder:number};
export type Extension={label:string;meaning:string;exampleUsage:string;displayOrder:number};
const key=(label:string)=>label.normalize('NFC').toLowerCase();
const modelKey=(label:string)=>{
 const value=key(label);
 if(value==='letter_enye')return 'ñ';
 if(value==='letter_ng')return 'ng';
 return value;
};

/** Append missing signs only. No updates to teacher content, order, progress, or assessments. */
export function planAlphabetExtensions(signs:ExistingSign[],links:ExistingLink[],extensions:Extension[]){
 let next=Math.max(26,...links.map(link=>link.displayOrder))+1;
 return extensions.map(extension=>{
  const matches=signs.filter(sign=>key(sign.label)===key(extension.label)||modelKey(sign.modelClass)===key(extension.label));
  if(matches.length>1)throw Error('Ambiguous existing gesture for '+extension.label);
  const existing=matches[0];
  if(existing&&(key(existing.label)!==key(extension.label)||modelKey(existing.modelClass)!==key(extension.label)))
   throw Error('Conflicting existing label/modelClass for '+extension.label);
  const link=existing&&links.find(item=>item.gestureId===existing.id);
  return {label:extension.label,modelClass:existing?.modelClass??extension.label,
   gestureId:existing?.id??null,createGesture:!existing,createLink:!link,
   displayOrder:link?.displayOrder??next++,meaning:extension.meaning,exampleUsage:extension.exampleUsage};
 });
}
