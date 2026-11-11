import 'dotenv/config';
import {mkdir,writeFile} from 'node:fs/promises';
import {prisma} from '../../src/config/db.js';

const order=[...'ABCDEFGHIJKLMN','Ñ','Ng',...'OPQRSTUVWXYZ'];
const apply=process.argv.includes('--apply');
try {
 const result=await prisma.$transaction(async tx=>{
  const categories=await tx.category.findMany({where:{name:'Alphabet'}});
  if(categories.length!==1)throw Error('Expected one Alphabet category');
  const categoryId=categories[0]!.id;
  const links=await tx.categoryGesture.findMany({where:{categoryId},include:{gesture:true},orderBy:{displayOrder:'asc'}});
  if(links.length!==28||order.some(label=>links.filter(l=>l.gesture.label===label).length!==1))throw Error('Expected exactly the 28 Alphabet signs');
  const sorted=order.map(label=>links.find(l=>l.gesture.label===label)!);
  const changed=sorted.some((l,i)=>l.displayOrder!==i+1);
  const checkpoints=await tx.categoryProgress.findMany({where:{categoryId},select:{id:true,lastGestureIndex:true}});
  if(checkpoints.some(p=>p.lastGestureIndex<0||p.lastGestureIndex>=links.length))throw Error('Unexpected checkpoint index; review before reordering');
  if(apply&&changed){
   await mkdir('backups',{recursive:true});
   await writeFile('backups/alphabet-order-'+Date.now()+'.json',JSON.stringify({categoryId,links:links.map(l=>({id:l.id,displayOrder:l.displayOrder})),checkpoints},null,2),{flag:'wx'});
   // Temporary positions avoid the category/order unique constraint.
   const offset=Math.max(...links.map(l=>l.displayOrder))+100;
   for(let i=0;i<sorted.length;i++)await tx.categoryGesture.update({where:{id:sorted[i]!.id},data:{displayOrder:offset+i}});
   for(let i=0;i<sorted.length;i++)await tx.categoryGesture.update({where:{id:sorted[i]!.id},data:{displayOrder:i+1}});
   for(const p of checkpoints){
    const next=sorted.findIndex(l=>l.id===links[p.lastGestureIndex]!.id);
    if(next!==p.lastGestureIndex)await tx.categoryProgress.update({where:{id:p.id},data:{lastGestureIndex:next}});
   }
  }
  return {mode:apply?'applied':'preview',changed,order:sorted.map(l=>l.gesture.label),checkpointsPreserved:checkpoints.length};
 },{isolationLevel:'Serializable',timeout:30000});
 console.log(JSON.stringify(result));
} finally {await prisma.$disconnect();}
