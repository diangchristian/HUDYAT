import {useEffect,useState} from 'react';
export function CategoryDownload({category}:{category:string}){
 const [message,setMessage]=useState('Preparing selected category…');
 useEffect(()=>{const abort=new AbortController();
  void import('./category-runtime').then(m=>m.downloadCategory(category,abort.signal,s=>{if(!abort.signal.aborted)setMessage(s.message);}))
   .then(({release})=>{if(!abort.signal.aborted)setMessage(release.name+' model saved · '+release.version);})
   .catch(error=>{if(!abort.signal.aborted)setMessage(error.message);});
  return()=>abort.abort();
 },[category]);
 return <p role="status" className="mb-3 text-center text-sm text-muted-foreground">{message}</p>;
}
