import {TRAVEL_CITIES,travelCityById,type TravelCityId} from './world-catalogue.ts';
export const POSTCARD_DAY_MS=86400000,POSTCARD_DRIFT_STOPS=10;
export type PostcardDrift={id:string;cities:TravelCityId[];startsAt:string};
export type PostcardDriftDraft=Omit<PostcardDrift,'id'>;
export function defaultPostcardDrift(start:TravelCityId,startsAt=new Date().toISOString()):PostcardDriftDraft{
 const preferred=['JP','FR','IT','GB','BR','KR','TH','KE','AU','PT',...TRAVEL_CITIES.map(c=>c.id)] as TravelCityId[];
 const cities=[start,...preferred.filter(id=>id!==start&&!!travelCityById(id))].filter((id,i,all)=>all.indexOf(id)===i).slice(0,POSTCARD_DRIFT_STOPS);return {cities,startsAt};
}
export function readPostcardDrift(value:unknown):PostcardDrift|undefined{if(!value||typeof value!=='object')return;const v=value as PostcardDrift;if(typeof v.id!=='string'||!v.id||v.id.length>100||!Array.isArray(v.cities)||v.cities.length!==POSTCARD_DRIFT_STOPS||new Set(v.cities).size!==POSTCARD_DRIFT_STOPS||v.cities.some(id=>!travelCityById(id))||typeof v.startsAt!=='string'||!Number.isFinite(Date.parse(v.startsAt)))return;return {id:v.id,cities:[...v.cities],startsAt:new Date(v.startsAt).toISOString()};}
export function replaceDriftCity(cities:TravelCityId[],index:number,id:TravelCityId){if(!Number.isInteger(index)||index<0||index>=cities.length||!travelCityById(id))return cities;const next=[...cities],other=next.indexOf(id);if(other>=0)next[other]=next[index];next[index]=id;return next;}
export function driftAt(plan:PostcardDrift,at=new Date()){
 const elapsed=at.getTime()-Date.parse(plan.startsAt),started=elapsed>=0,day=started?Math.floor(elapsed/POSTCARD_DAY_MS):-1,index=started?day%POSTCARD_DRIFT_STOPS:0,cycle=started?Math.floor(day/POSTCARD_DRIFT_STOPS):0;
 const starts=Date.parse(plan.startsAt)+(started?day:0)*POSTCARD_DAY_MS;return {started,day,index,cycle,cityId:plan.cities[index],nextCityId:plan.cities[(index+1)%POSTCARD_DRIFT_STOPS],startsAt:new Date(starts).toISOString(),endsAt:new Date(starts+(started?POSTCARD_DAY_MS:0)).toISOString(),remainingMs:started?starts+POSTCARD_DAY_MS-at.getTime():-elapsed};
}
export function postcardDriftRows(plan:PostcardDrift,plays:{at:string;matched:boolean;driftId?:string}[],now=new Date()){
 const current=driftAt(plan,now),loopStart=Date.parse(plan.startsAt)+current.cycle*POSTCARD_DRIFT_STOPS*POSTCARD_DAY_MS;
 return plan.cities.map((cityId,index)=>{const start=loopStart+index*POSTCARD_DAY_MS,end=start+POSTCARD_DAY_MS,returned=plays.filter(p=>p.driftId===plan.id&&Date.parse(p.at)>=start&&Date.parse(p.at)<end);return {cityId,index,startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),current:current.started&&index===current.index,played:returned.length,matched:returned.filter(p=>p.matched).length,missed:returned.filter(p=>!p.matched).length};});
}
