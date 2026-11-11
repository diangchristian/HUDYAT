import 'dotenv/config';
import {mkdir,writeFile} from 'node:fs/promises';
import {prisma} from '../../src/config/db.js';

const removed=new Set(['Black','White','Pink','Brown']);
const retained=['Red','Blue','Yellow','Green','Orange','Purple'];
const apply=process.argv.includes('--apply');
try {
 const result=await prisma.$transaction(async tx=>{
  const categories=await tx.category.findMany({where:{name:'Colors'}});
  if(categories.length!==1)throw Error('Expected one Colors category');
  const categoryId=categories[0]!.id;
  const before=await tx.categoryGesture.findMany({where:{categoryId},include:{gesture:true},orderBy:{displayOrder:'asc'}});
  const labelKey=(label:string)=>label==='Violet'?'Purple':label;
  if(before.some(l=>!removed.has(l.gesture.label)&&!retained.includes(labelKey(l.gesture.label)))||retained.some(label=>before.filter(l=>labelKey(l.gesture.label)===label).length!==1))throw Error('Unexpected Colors signs');
  const after=retained.map(label=>before.find(l=>labelKey(l.gesture.label)===label)!);
  const deleted=before.filter(l=>removed.has(l.gesture.label));
  const progress=await tx.categoryProgress.findMany({where:{categoryId},select:{id:true,lastGestureIndex:true,lastLessonStep:true}});
  if(progress.some(p=>p.lastGestureIndex<0||p.lastGestureIndex>=before.length))throw Error('Unexpected learner checkpoint');
  const changed=deleted.length>0||after.some((l,i)=>l.displayOrder!==i+1);
  if(apply&&changed){
   await mkdir('backups',{recursive:true});
   await writeFile('backups/colors-trim-'+Date.now()+'.json',JSON.stringify({categoryId,before,progress},null,2),{flag:'wx'});
   // Remove lesson links only; preserve gestures referenced by historical assessments.
   await tx.categoryGesture.deleteMany({where:{id:{in:deleted.map(l=>l.id)}}});
   const offset=Math.max(...before.map(l=>l.displayOrder))+100;
   for(let i=0;i<after.length;i++)await tx.categoryGesture.update({where:{id:after[i]!.id},data:{displayOrder:offset+i}});
   for(let i=0;i<after.length;i++)await tx.categoryGesture.update({where:{id:after[i]!.id},data:{displayOrder:i+1}});
   for(const p of progress){
    const original=before[p.lastGestureIndex]!;
    const same=after.findIndex(l=>l.id===original.id);
    const next=same>=0?same:Math.max(0,after.findIndex(l=>before.indexOf(l)>p.lastGestureIndex));
    // If no later supported sign remains, resume at the final supported sign.
    const index=same>=0?next:after.some(l=>before.indexOf(l)>p.lastGestureIndex)?next:after.length-1;
    await tx.categoryProgress.update({where:{id:p.id},data:{lastGestureIndex:index,...(same<0?{lastLessonStep:'meaning'}:{})}});
   }
  }
  return {mode:apply?'applied':'preview',changed,removed:deleted.map(l=>l.gesture.label),remaining:after.map(l=>l.gesture.label),checkpoints:progress.length};
 },{isolationLevel:'Serializable',timeout:30000});
 console.log(JSON.stringify(result));
}finally{await prisma.$disconnect();}
