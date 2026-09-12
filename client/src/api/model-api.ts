export type Release={id:string;name:string;version:string;modelUrl:string;weightsUrl:string;handUrl:string;modelSha256:string;weightsSha256:string;handSha256:string};
const base=import.meta.env.VITE_API_URL || '';
export const modelAssetUrl=(url:string)=>new URL(url,base || location.origin).href;
export async function fetchModelRelease(category:string,signal:AbortSignal):Promise<Release>{
 const cache=await caches.open('hudyat-model-catalog-v1');
 const url=modelAssetUrl('/api/models/'+encodeURIComponent(category));
 try {
  const response=await fetch(url,{signal,cache:'no-store'});
  if(response.status===404){await cache.delete(url);throw new Error('No model has been published for this category yet.');}
  if(!response.ok)throw Error('Model catalog unavailable.');
  const payload=await response.clone().json();
  if(!payload.data?.version || !payload.data?.modelUrl)throw Error('Invalid model release.');
  await cache.put(url,response);return payload.data;
 }catch(error){
  if(signal.aborted)throw error;
  const saved=await cache.match(url);if(saved)return (await saved.json()).data;
  throw error;
 }
}
