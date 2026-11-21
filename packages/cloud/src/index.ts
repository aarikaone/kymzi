import {useEffect,useState,useSyncExternalStore} from 'react';
import {catalogueCdnImage,catalogueImageKnown,catalogueImageRevision,loadTravelCityPlaces,publicCdnImage,subscribeCatalogueImages} from '@rymzi/core';
import {cityForAttraction,connectKymzi} from './catalogue.ts';
export {connectKymzi,kymziDatabase} from './catalogue.ts';
export {firebaseConfig} from './firebase-config.ts';
export {publicCdnImage};
export function useKymziConnection(){
 const [attempt,setAttempt]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{let alive=true;setStatus('loading');connectKymzi().then(()=>{if(alive)setStatus('ready');},()=>{if(alive)setStatus('error');});return()=>{alive=false;};},[attempt]);
 return {status,retry:()=>setAttempt(value=>value+1)};
}
export function useCatalogueImage(kind:'city'|'place',id:string){
 useSyncExternalStore(subscribeCatalogueImages,catalogueImageRevision,catalogueImageRevision);
 const [attempt,setAttempt]=useState(0),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{let alive=true;if(kind==='city'||catalogueImageKnown(kind,id)){setState('ready');return;}
  const city=cityForAttraction(id);if(!city){setState('ready');return;}
  setState('loading');loadTravelCityPlaces(city).then(()=>{if(alive)setState('ready');},()=>{if(alive)setState('error');});return()=>{alive=false;};
 },[kind,id,attempt]);
 return {image:catalogueCdnImage(kind,id),loading:!catalogueImageKnown(kind,id)&&state==='loading',error:!catalogueImageKnown(kind,id)&&state==='error',retry:()=>setAttempt(value=>value+1)};
}
/** Deferred URI lookup keeps module-level native avatar/category maps network-only. */
export function publicImageSource(path:string){return {get uri(){return publicCdnImage(path);},cache:'force-cache' as const};}
