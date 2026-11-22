import {useEffect,useRef,useState} from 'react';
import {discoveryCard,postcardScore,questionById,type PreviewState} from '@rymzi/core';
export function usePostcardGame(state:PreviewState,cardId:string,onAnswer:(answer:string)=>void|Promise<void>,reduced=false){
 const card=discoveryCard(state,cardId),active=state.postcardDiscovery?.active?.cardId===cardId?state.postcardDiscovery.active:null,result=state.postcardDiscovery?.results.slice().reverse().find(r=>r.cardId===cardId),index=active?.answers.length??0,[choice,setChoice]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[opening,setOpening]=useState(false),lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);useEffect(()=>setChoice(''),[cardId,index]);
 useEffect(()=>{if(!opening||active||!result)return;const timer=setTimeout(()=>setOpening(false),reduced?0:700);return()=>clearTimeout(timer);},[opening,active,result?.id,reduced]);
 async function stamp(){if(!choice||lock.current||!active)return;lock.current=true;setBusy(true);setError('');if(index===2)setOpening(true);try{await onAnswer(choice);}catch(e){if(alive.current){setError((e as Error).message||'Couldn’t save your pick. Try again.');setOpening(false);}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 async function run(action:()=>void|Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await action();}catch(e){if(alive.current)setError((e as Error).message||'Couldn’t open this postcard. Try again.');}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return {run,card,active,result,index,question:card?questionById(card.questionIds[index]):undefined,choice,choose:(v:string)=>{if(!busy)setChoice(v);},busy,error,opening,stamp,score:card&&result?postcardScore(card,result.answers):null};
}
