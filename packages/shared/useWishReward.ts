import {useEffect,useState} from 'react';
const celebrated=new Set<string>();
export function useWishReward(id:string,at:string,enabled=true){const [playing,setPlaying]=useState(false);useEffect(()=>{if(!enabled||celebrated.has(id)||Date.now()-Date.parse(at)>120000){setPlaying(false);return;}setPlaying(true);const timer=setTimeout(()=>{celebrated.add(id);setPlaying(false);},2400);return()=>clearTimeout(timer);},[id,at,enabled]);return playing;}
