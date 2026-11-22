import {useEffect,useState} from 'react';
export const BOTTLE_DISCOVERY_STEPS=[
 {label:'Open',title:'A postcard arrived.',copy:'3 travel questions from someone new.',ms:3000},
 {label:'Answer',title:'Answer 3 questions.',copy:'Choose 3 answers. Match any 2.',ms:3300},
 {label:'Connect',title:'You found a Roamie.',copy:'Say hello and explore their city.',ms:0},
] as const;
export function useBottleDiscoveryGuide(reduced:boolean){
 const [step,setStep]=useState(0),[replayKey,setReplayKey]=useState(0);
 useEffect(()=>{if(reduced||step===BOTTLE_DISCOVERY_STEPS.length-1)return;const timer=setTimeout(()=>setStep(s=>Math.min(BOTTLE_DISCOVERY_STEPS.length-1,s+1)),BOTTLE_DISCOVERY_STEPS[step].ms);return()=>clearTimeout(timer);},[step,replayKey,reduced]);
 return {step,story:BOTTLE_DISCOVERY_STEPS[step],replayKey,select:(index:number)=>setStep(Math.max(0,Math.min(BOTTLE_DISCOVERY_STEPS.length-1,index))),replay:()=>{setStep(0);setReplayKey(k=>k+1);}};
}
