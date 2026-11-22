import {useEffect,useRef,useState} from 'react';

export const PLACE_ADD_FEEDBACK_MS=4000;
export const PLACE_ADD_FADE_MS=180;
/** Feedback belongs to one attraction browsing session, never persisted places. */
export function usePlaceAddFeedback(selected:string[],active=true){
 const [recent,setRecent]=useState<string[]>([]),[shown,setShown]=useState(false),[fading,setFading]=useState(false),[paused,setPaused]=useState(false),[revision,setRevision]=useState(0);
 const activeRef=useRef(active);activeRef.current=active;
 const ids=recent.filter(id=>selected.includes(id));
 useEffect(()=>{if(!active){setShown(false);setFading(false);setPaused(false);}},[active]);
 useEffect(()=>{
  if(!shown||paused||!active)return;
  let fade:ReturnType<typeof setTimeout>|undefined;
  const timer=setTimeout(()=>{setFading(true);fade=setTimeout(()=>{setShown(false);setFading(false);},PLACE_ADD_FADE_MS);},PLACE_ADD_FEEDBACK_MS);
  return()=>{clearTimeout(timer);if(fade)clearTimeout(fade);};
 },[shown,paused,active,revision]);
 function added(id:string){if(!activeRef.current)return;setRecent(previous=>[...previous.filter(value=>value!==id),id]);setShown(true);setFading(false);setRevision(value=>value+1);}
 return {ids,visible:active&&shown&&ids.length>0,fading,added,setPaused};
}
