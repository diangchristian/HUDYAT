import 'dotenv/config';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../../src/generated/prisma/client.js';
import {planAlphabetExtensions,type Extension} from './alphabetExtensions.js';

const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--apply'))throw Error('Usage: npm run models:alphabet-signs -- [--apply]');
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
const apply=args.includes('--apply');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
const seed=JSON.parse(await readFile(new URL('../data/learning/alphabet.json',import.meta.url),'utf8')) as Extension[];
const extensions=seed.filter(item=>['Ñ','Ng'].includes(item.label));
if(extensions.length!==2)throw Error('Alphabet seed must include Ñ and Ng');
try{
 const report=await db.$transaction(async tx=>{
  const categories=await tx.category.findMany({where:{name:{equals:'Alphabet',mode:'insensitive'},isActive:true}});
  if(categories.length!==1)throw Error('Expected exactly one active Alphabet category');
  const category=categories[0]!;
  const before=await tx.categoryGesture.findMany({where:{categoryId:category.id},include:{gesture:true},orderBy:{displayOrder:'asc'}});
  for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')if(before.filter(link=>link.gesture.label===letter).length!==1)
   throw Error('Expected existing Alphabet sign '+letter+'; run the normal initial seed first');
  const signs=await tx.fslGesture.findMany({select:{id:true,label:true,modelClass:true}});
  const plan=planAlphabetExtensions(signs,before,extensions);
  const changes=plan.filter(item=>item.createGesture||item.createLink);
  let backup:string|null=null;
  if(apply&&changes.length){
   // Saved before writes; holds existing teacher data and IDs without credentials or learner records.
   backup=resolve('backups','alphabet-extensions-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
   await mkdir(resolve('backups'),{recursive:true});
   await writeFile(backup,JSON.stringify({category,before,plan},null,2)+'\n',{flag:'wx'});
   for(const item of changes){
    let gestureId=item.gestureId;
    if(item.createGesture){
     const gesture=await tx.fslGesture.create({data:{label:item.label,modelClass:item.modelClass,meaning:item.meaning,isValidated:false}});
     gestureId=gesture.id;
    }
    if(item.createLink)await tx.categoryGesture.create({data:{categoryId:category.id,gestureId:gestureId!,displayOrder:item.displayOrder,exampleUsage:item.exampleUsage}});
   }
   const preserved=await tx.categoryGesture.findMany({where:{id:{in:before.map(row=>row.id)}},include:{gesture:true},orderBy:{displayOrder:'asc'}});
   if(JSON.stringify(preserved)!==JSON.stringify(before))throw Error('Existing Alphabet data changed; rolling back');
  }
  const after=await tx.categoryGesture.findMany({where:{categoryId:category.id},include:{gesture:true},orderBy:{displayOrder:'asc'}});
  return {mode:apply?'applied':'preview',category:category.name,changes,backup,count:after.length,
   signs:after.map(link=>({label:link.gesture.label,modelClass:link.gesture.modelClass,displayOrder:link.displayOrder})),
   preservedExistingSigns:true};
 },{isolationLevel:'Serializable',timeout:30000,maxWait:10000});
 console.log(JSON.stringify(report,null,2));
}finally{await db.$disconnect();}
