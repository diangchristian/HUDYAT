import { readFile } from 'node:fs/promises';
import { prisma } from '../../src/config/db.js';
const catalog=JSON.parse(await readFile('model-assets/catalog.json','utf8'));
try {
 for(const entry of catalog.categories.filter((e:{available:boolean})=>e.available)){
  const categories=await prisma.category.findMany({where:{name:{equals:entry.name,mode:'insensitive'}},select:{id:true,name:true}});
  if(categories.length!==1)throw Error('Expected exactly one category named '+entry.name+'; found '+categories.length);
  const release={...entry};
  for(const field of ['modelUrl','weightsUrl','handUrl'])release[field]='/api/models/files/'+entry[field].replace(/^\.\//,'');
  await prisma.category.update({where:{id:categories[0].id},data:{modelRelease:release}});
  console.log('Registered '+entry.name+' '+entry.version);
 }
}finally{await prisma.$disconnect();}
