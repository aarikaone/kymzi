import {useEffect,useRef,useState} from 'react';
import {gemPlaceFromMaps,makePhotoGemDraft,searchGemPlaces,MAX_GEM_PHOTOS,type GemSearchPlace,type PlaceDraft,type PlacePhoto} from '@rymzi/core';

export function useHiddenGemShare(onConfirm:(draft:PlaceDraft)=>void|Promise<void>,initialText=''){
 const [query,setQuery]=useState(''),[place,setPlace]=useState<GemSearchPlace|null>(null),[photos,setPhotos]=useState<PlacePhoto[]>([]),[tip,setTip]=useState(''),[editing,setEditing]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[saved,setSaved]=useState<PlaceDraft|null>(null);
 const alive=useRef(true),lock=useRef(false),draftId=useRef(''),received=useRef('');
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(initialText&&received.current!==initialText){received.current=initialText;importLink(initialText);}},[initialText]);
 function choose(next:GemSearchPlace){setPlace(next);setPhotos([]);setTip('');setError('');setEditing(!next.address||!next.name||!next.city||!next.country);draftId.current=`gem-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;}
 function importLink(text:string){try{choose(gemPlaceFromMaps(text));}catch(e){setError((e as Error).message);}}
 function changePlace(next:Partial<GemSearchPlace>){setPlace(p=>p?{...p,...(next.city!==undefined||next.country!==undefined?{latitude:undefined,longitude:undefined}:{}),...next}:p);setError('');}
 function addPhotos(images:string[],replace=false){setPhotos(previous=>{const added=images.map((image,i)=>({id:`gem-photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`,image}));return (replace?[...added.slice(0,1),...previous.slice(1)]:[...previous,...added]).slice(0,MAX_GEM_PHOTOS);});setError('');}
 function cover(id:string){setPhotos(p=>{const photo=p.find(i=>i.id===id);return photo?[photo,...p.filter(i=>i.id!==id)]:p;});}
 async function publish(){if(!place||lock.current)return;let draft:PlaceDraft;try{draft=makePhotoGemDraft(place,photos,tip,draftId.current);}catch(e){setError((e as Error).message);return;}lock.current=true;setBusy(true);setError('');try{await onConfirm(draft);if(alive.current){setSaved(draft);setDone(true);}}catch(e){if(alive.current)setError((e as Error).message);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return {query,setQuery,results:searchGemPlaces(query),place,choose,changePlace,importLink,photos,addPhotos,cover,removePhoto:(id:string)=>setPhotos(p=>p.filter(i=>i.id!==id)),tip,setTip,editing,setEditing,error,setError,busy,done,saved,publish,back:()=>{setPlace(null);setPhotos([]);setError('');},canShare:!!place?.name.trim()&&!!place.address.trim()&&!!place.city.trim()&&!!place.country.trim()&&photos.length>0};
}
