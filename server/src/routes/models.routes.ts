import { Router } from "express";
import express from "express";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "../config/db.js";
import { DABEST_FILE_MODELS } from "../config/dabest.js";
const router=Router();
// DABEST: these categories use the release in model-assets/catalog.json, not the one stored in the shared database.
async function fileRelease(name:string){
 if(!DABEST_FILE_MODELS.includes(name.toLowerCase()))return null;
 const catalog=JSON.parse(await readFile(path.resolve('model-assets/catalog.json'),'utf8'));
 const entry=catalog.categories.find((e:{id:string;available:boolean})=>e.id===name.toLowerCase()&&e.available);
 if(!entry)return null;
 const release={...entry,name};
 for(const field of ['modelUrl','weightsUrl','handUrl'])release[field]='/api/models/files/'+entry[field].replace(/^\.\//,'');
 return release;
}
// Public inference artifacts contain model parameters only, never camera recordings.
router.use('/files',express.static(path.resolve('model-assets'),{immutable:true,maxAge:'1y',dotfiles:'deny'}));
router.get('/:category',async(req,res)=>{
 try {
  const key=String(req.params.category);
  const name=key.replace(/-/g,' ');
  const category=await prisma.category.findFirst({where:{isActive:true,OR:[{id:key},{name:{equals:name,mode:'insensitive'}}]},select:{id:true,name:true,modelRelease:true}});
  const release=category?(await fileRelease(category.name))??category.modelRelease:null;
  if(!category || !release)return res.status(404).json({message:'No model has been published for this category yet.'});
  res.setHeader('Cache-Control','no-store');
  return res.json({data:release});
 } catch {return res.status(503).json({message:'Model catalog is temporarily unavailable.'});}
});
export default router;
