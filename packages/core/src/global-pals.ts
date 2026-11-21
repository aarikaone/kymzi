import {readHomeVisitMeets,type HomeVisitMeet} from './home-visit-meet.ts';
import {demoPeers,dailyQuestions} from './index.ts';
import {countryByName,COUNTRIES} from './countries.ts';
import {connections,meetingDateTime,type MatchProof} from './social.ts';
import {palFor,palSummaries} from './pal-loop.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand} from './types.ts';

export type PalHomeVisit={id:string;peerId:string;ageBand:Exclude<AgeBand,'10-12'>;city:string;country:string;arrivesAt:string;timeZone:string;createdAt:string;simulated:true};
export type GlobalPalsPreview={version:1;seededBands:Exclude<AgeBand,'10-12'>[];homeVisits:PalHomeVisit[];visitMeets?:HomeVisitMeet[]};
const bands=['13-15','16-17','18-20','21-24','25-30'] as const;
const validDate=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function validZone(v:unknown):v is string{if(typeof v!=='string'||v.length>80)return false;try{new Intl.DateTimeFormat('en',{timeZone:v}).format();return true;}catch{return false;}}
function place(v:unknown):v is string{return typeof v==='string'&&!!v.trim()&&v.length<=80;}
export function readGlobalPals(raw:unknown):GlobalPalsPreview|undefined{
 const p=raw as Partial<GlobalPalsPreview>|null;if(!p||p.version!==1)return;
 const out:GlobalPalsPreview={version:1,seededBands:[],homeVisits:[]};
 for(const band of bands)if(Array.isArray(p.seededBands)&&p.seededBands.includes(band))out.seededBands.push(band);
 for(const v of Array.isArray(p.homeVisits)?p.homeVisits.slice(-8):[]){if(!v||v.simulated!==true||typeof v.id!=='string'||v.id.length>180||!bands.includes(v.ageBand)||!demoPeers.some(p=>p.id===v.peerId&&p.ageBand===v.ageBand)||!place(v.city)||!place(v.country)||!validZone(v.timeZone)||!validDate(v.createdAt)||!validDate(v.arrivesAt)||Date.parse(v.arrivesAt)<=Date.parse(v.createdAt)||out.homeVisits.some(p=>p.ageBand===v.ageBand))continue;out.homeVisits.push({id:v.id,peerId:v.peerId,ageBand:v.ageBand,city:v.city.trim(),country:v.country.trim(),arrivesAt:v.arrivesAt,timeZone:v.timeZone,createdAt:v.createdAt,simulated:true});}
 const meets=readHomeVisitMeets(p.visitMeets,out.homeVisits);if(meets.length)out.visitMeets=meets;
 return out;
}
function nextAfternoon(now:Date,timeZone:string){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const tomorrow=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 return meetingDateTime(tomorrow.toISOString().slice(0,10),'16:30',timeZone);
}
/** An explicitly requested local showcase: seed up to three distinct fictional pals once.
 * This never submits answers, spends plays, grants referrals or unlocks personal photos. */
export function seedGlobalPals(state:PreviewState,now=new Date(),timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone):PreviewState{
 if(state.launch&&!state.launch.globalPlay&&state.profile&&state.profile.ageBand!=='10-12'&&palSummaries(state).length)state={...state,launch:{...state.launch,globalPlay:{activatedAt:now.toISOString(),source:'simulation'}}};
 if(!state.launch?.globalPlay||!state.profile||state.profile.ageBand==='10-12')return state;
 const band=state.profile.ageBand,old=state.launch.globalPals??{version:1 as const,seededBands:[],homeVisits:[]};
 let proofs=state.social.proofs,seededBands=old.seededBands,changed=false;
 if(!old.seededBands.includes(band)){
  const known=connections(state.social,band,state.blocked),ids=new Set(known.map(p=>p.peer.id)),countries=new Set(known.map(p=>p.peer.country)),avatars=new Set(known.map(p=>p.peer.avatar));
  const order=[...(state.profile.travel?.wishlist??[]).map(w=>w.cityId),'JP','FR','BR',...COUNTRIES.map(c=>c.id)],added:MatchProof[]=[];
  for(const countryId of [...new Set(order)]){
   if(ids.size>=3)break;const country=COUNTRIES.find(c=>c.id===countryId)!;if(!country||countries.has(country.name))continue;
   const candidates=demoPeers.filter(p=>p.ageBand===band&&p.country===country.name&&!ids.has(p.id)&&!state.blocked.includes(p.id)),peer=candidates.find(p=>!avatars.has(p.avatar))??candidates[0];if(!peer)continue;
   const questionIds=dailyQuestions.map(q=>q.id);added.push({playId:`global-starter:${band}:${peer.id}`,peerId:peer.id,countryId:country.id,at:now.toISOString(),questionIds,simulated:true,demoAnswers:Object.fromEntries(questionIds.map((id,i)=>[id,['Coffee','Sunset','Adventure'][i]]))});ids.add(peer.id);countries.add(country.name);avatars.add(peer.avatar);
  }
  proofs=added.length?[...proofs,...added]:proofs;seededBands=[...old.seededBands,band];changed=true;
 }
 const next={...state,social:proofs===state.social.proofs?state.social:{...state.social,proofs}},pals=palSummaries(next);
 let visits=old.homeVisits;
 const recorded=old.homeVisits.find(v=>v.ageBand===band),home=state.profile;
 // Never turn an elapsed trip into a new future trip on reload, or replace a blocked visitor.
 if(!recorded&&place(home.city)&&place(home.country)&&pals.length){
  const preferred=pals.find(p=>countryByName('Japan')?.id===p.countryId)??pals[0],zone=validZone(timeZone)?timeZone:'UTC';
  visits=[...visits,{id:`home-visit:${band}:${preferred.id}`,peerId:preferred.id,ageBand:band,city:home.city.trim(),country:home.country.trim(),arrivesAt:nextAfternoon(now,zone),timeZone:zone,createdAt:now.toISOString(),simulated:true}];changed=true;
 }
 if(!changed)return state;
 return {...next,launch:{...state.launch,globalPals:{...old,version:1,seededBands,homeVisits:visits}}};
}
/** Upcoming declared plans only. This never means the pal is checked in or physically nearby. */
export function homeVisitForPal(state:PreviewState,peerId?:string){
 if(!state.launch?.globalPlay||!state.profile||state.profile.ageBand==='10-12')return;
 const visit=state.launch.globalPals?.homeVisits.find(v=>v.ageBand===state.profile!.ageBand&&(!peerId||v.peerId===peerId)&&v.city.toLocaleLowerCase()===state.profile!.city?.trim().toLocaleLowerCase()&&v.country.toLocaleLowerCase()===state.profile!.country?.trim().toLocaleLowerCase());
 const pal=visit?palFor(state,visit.peerId):undefined;return visit&&pal?{...visit,pal}:undefined;
}
export function comingHomeVisit(state:PreviewState,now=new Date(),peerId?:string){const visit=homeVisitForPal(state,peerId);return visit&&Date.parse(visit.arrivesAt)>now.getTime()?visit:undefined;}

export function palVisitLabels(visit:Pick<PalHomeVisit,'arrivesAt'|'timeZone'>){
 const at=new Date(visit.arrivesAt);return {date:new Intl.DateTimeFormat('en',{timeZone:visit.timeZone,weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(at),time:new Intl.DateTimeFormat('en',{timeZone:visit.timeZone,hour:'numeric',minute:'2-digit',hour12:true}).format(at),zone:visit.timeZone,zoneShort:new Intl.DateTimeFormat('en',{timeZone:visit.timeZone,timeZoneName:'short'}).formatToParts(at).find(p=>p.type==='timeZoneName')?.value??visit.timeZone,day:new Intl.DateTimeFormat('en',{timeZone:visit.timeZone,day:'2-digit'}).format(at),month:new Intl.DateTimeFormat('en',{timeZone:visit.timeZone,month:'short'}).format(at).toUpperCase()};
}
