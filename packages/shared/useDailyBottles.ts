import {useEffect,useRef,useState} from 'react';
import {dailyBottleCards,discoveryCard,discoveryAllowance,localDay,palFor,postcardScore,randomPostcard,type PreviewState,type DiscoveryCard} from '@rymzi/core';
export type DailyBottlesProps={state:PreviewState;now:Date;onPrepare:()=>void|Promise<void>;onPlay:(id:string)=>void|Promise<void>;onInvite:()=>void;onUnlock:()=>void|Promise<void>;onRoamie:(id:string)=>void;onResumeLegacy?:()=>void};
export function useDailyBottles({state,now,onPrepare,onPlay,onRoamie}:DailyBottlesProps){
 const [busy,setBusy]=useState(false),[preparing,setPreparing]=useState(true),[error,setError]=useState(''),[unlock,setUnlock]=useState(false),lock=useRef(false),alive=useRef(true),prepareRef=useRef(onPrepare);prepareRef.current=onPrepare;
 const day=localDay(now),cards=dailyBottleCards(state,now),gate=discoveryAllowance(state,now),active=state.postcardDiscovery?.active,resume=gate.resuming&&active?discoveryCard(state,active.cardId):undefined;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function prepare(){setPreparing(true);setError('');try{await prepareRef.current();}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setPreparing(false);}}
 useEffect(()=>{void prepare();},[day,state.profile?.name,state.profile?.ageBand]);
 function status(card:DiscoveryCard){const result=state.postcardDiscovery?.results.find(r=>r.cardId===card.id),pal=palFor(state,card.ownerId),continuing=resume?.id===card.id;return {result,pal,continuing,matched:!!result&&postcardScore(card,result.answers).connects,disabled:busy||preparing||!!resume&&!continuing&&!result&&!pal};}
 async function play(card:DiscoveryCard){if(lock.current||preparing)return;const info=status(card);if(info.pal){onRoamie(card.ownerId);return;}if(!info.result&&gate.locked){setUnlock(true);return;}if(info.disabled)return;lock.current=true;setBusy(true);setError('');try{await onPlay(card.id);}catch(e){if(alive.current)setError((e as Error).message);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 function surprise(){const card=randomPostcard(state,Math.random,now);if(card)void play(card);}
 const remaining=Math.max(0,Date.parse(gate.resetAt)-now.getTime()),hours=Math.floor(remaining/3600000),minutes=Math.floor(remaining%3600000/60000),resetLabel=hours?`${hours}h ${minutes}m`:`${Math.max(1,minutes)}m`;
 return {cards,gate,resume,busy,preparing,error,unlock,setUnlock,play,surprise,status,prepare,resetLabel};
}
