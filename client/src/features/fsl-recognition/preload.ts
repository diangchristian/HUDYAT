/*
 * EXPERIMENT: warm up a category's model and hand tracker before the
 * camera step, so the student never waits for start-up at the camera.
 *
 * While a page that preloads a category is open, its runtime lives here:
 * each camera step borrows it (takeRuntime) and gives it back on close,
 * so moving between steps — or React StrictMode's dev remount — reuses
 * it instead of loading again. When the page closes, it is disposed.
 * Without a preloading page, a borrowed runtime is disposed on release,
 * exactly as before.
 */
import {useEffect} from 'react';
import type {CategoryRuntime,Update} from './category-runtime';
import {loadSettings,runtimeOptions,type RuntimeOptions} from './experiment';

type Entry={promise:Promise<CategoryRuntime>;abort:AbortController};
const parked=new Map<string,Entry>();
const openPages=new Map<string,number>();
const keyOf=(category:string,options:RuntimeOptions)=>category+'|'+JSON.stringify(options);

function start(category:string,options:RuntimeOptions,emit:(s:Update)=>void):Entry{
 const abort=new AbortController();
 const promise=import('./category-runtime').then(m=>m.createCategoryRuntime(category,abort.signal,emit,options));
 return {promise,abort};
}
function dispose(entry:Entry){entry.abort.abort();void entry.promise.then(runtime=>runtime.dispose(),()=>{});}

/** Borrows the parked runtime for this category/options, or starts a new one. */
export function takeRuntime(category:string,options:RuntimeOptions,emit:(s:Update)=>void){
 const key=keyOf(category,options);
 const found=parked.get(key);
 if(found)parked.delete(key);
 const entry=found??start(category,options,emit);
 let released=false;
 return {
  promise:entry.promise,
  /** True when this runtime was already loading or loaded before the camera step asked. */
  preloaded:Boolean(found),
  release(){
   if(released)return;released=true;
   if((openPages.get(category)??0)>0&&!parked.has(key)){
    parked.set(key,entry);
    entry.promise.catch(()=>{if(parked.get(key)===entry)parked.delete(key);});
   }else dispose(entry);
  },
 };
}

/** Pages call this so recognition is warm by the time the camera step opens. */
export function usePreloadRecognition(category:string|undefined){
 useEffect(()=>{
  const settings=loadSettings();
  if(!category||!settings.preload)return;
  openPages.set(category,(openPages.get(category)??0)+1);
  const options=runtimeOptions(settings),key=keyOf(category,options);
  if(!parked.has(key)){
   const entry=start(category,options,()=>{});
   parked.set(key,entry);
   entry.promise.catch(()=>{if(parked.get(key)===entry)parked.delete(key);});
  }
  return ()=>{
   const left=(openPages.get(category)??1)-1;
   if(left>0){openPages.set(category,left);return;}
   openPages.delete(category);
   for(const [parkedKey,entry] of parked)if(parkedKey.startsWith(category+'|')){parked.delete(parkedKey);dispose(entry);}
  };
 },[category]);
}
