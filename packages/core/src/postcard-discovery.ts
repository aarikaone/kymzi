import {peerUsername,profileDisplayName} from './profile-identity.ts';
import {demoPeers} from './index.ts';
import {COUNTRIES,type CountryId} from './countries.ts';
import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import {TRAVEL_INVITE_SETS,questionById} from './question-library.ts';
import {readTravelProfile,travelWishCount} from './travel-profile.ts';
import {sharedMapPlaces} from './place-contributions.ts';
import {activePlacePostcard} from './place-postcards.ts';
import {palFindingProgress} from './launch.ts';
import {hasDailyProgress,localDay} from './daily.ts';
import {dailyBottleCard,dailyBottleCards,prepareDailyBottles,readDailyBottleDrop,type DailyBottleDrop} from './daily-bottles.ts';
import {connectionFor} from './social.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand,AvatarId} from './types.ts';
export type DiscoveryCard={route?:{cities:TravelCityId[];currentIndex:number;arrivedOn?:string};id:string;cityId:TravelCityId;placeId:string;ownerId:string;ownerName:string;avatar:AvatarId;wishes:number;gems:number;signal:number;questionIds:string[];picks:string[];you:boolean;preview:boolean};
export type PostcardResult={id:string;cardId:string;answers:string[];at:string};
export type PostcardDiscovery={drop?:DailyBottleDrop;active:{cardId:string;answers:string[];startedAt:string;chargedAt:string|null}|null;results:PostcardResult[]};
const hash=(s:string)=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export const postcardSignal=(wishes:number,gems:number,photos=0)=>Math.min(100,10+Math.max(0,Math.min(30,Math.floor(wishes)))+Math.max(0,Math.min(20,Math.floor(gems)))*3+Math.max(0,Math.min(10,Math.floor(photos)))*2);
export function postcardPhotoCount(state:PreviewState){const band=state.profile?.ageBand;if(!band)return 0;return new Set([...(readTravelProfile(state.profile?.travel).memories?.map(p=>p.image)??[]),...state.photos.photos.filter(p=>p.ageBand===band&&(p.visibility==='pals'||band==='10-12')).map(p=>p.image),...(state.launch?.homePhotos??[]).filter(p=>p.ageBand===band).map(p=>p.image)]).size;}
export function myPostcardSignal(state:PreviewState){const wishes=travelWishCount(state.profile?.travel),gems=sharedMapPlaces(state).length,photos=postcardPhotoCount(state);return {wishes,gems,photos,signal:postcardSignal(wishes,gems,photos)};}
/** Fictional postcard fixtures for this local prototype; never a live-user directory. */
function previewCards(band:AgeBand,blocked:string[]=[]):DiscoveryCard[]{
 if(band==='10-12')return [];
 const order:CountryId[]=['JP','FR','BR','GB','IT','KR','KE','TH','ES','PT','SG','AU'];
 return order.flatMap((id,i)=>{const country=COUNTRIES.find(c=>c.id===id),city=travelCityById(id),peer=demoPeers.find(p=>p.ageBand===band&&p.country===country?.name);if(!peer||blocked.includes(peer.id)||!city?.placeIds.length)return [];const seed=hash(peer.id),questionIds=[...TRAVEL_INVITE_SETS[i%TRAVEL_INVITE_SETS.length]],wishes=3+seed%32,gems=(seed>>>5)%17;return [{id:`world-card:${band}:${id}`,cityId:id,placeId:city.placeIds[i%Math.min(4,city.placeIds.length)],ownerId:peer.id,ownerName:'@'+peerUsername(peer),avatar:peer.avatar,wishes,gems,signal:postcardSignal(wishes,gems),questionIds,picks:questionIds.map((q,j)=>questionById(q)!.choices![(seed+j*7)%6].label),you:false,preview:true}];});
}
export function discoveryPostcards(state:PreviewState):DiscoveryCard[]{
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const own=myPostcardSignal(state),mine=[activePlacePostcard(state)].filter((p):p is NonNullable<typeof p>=>!!p).map(p=>{const invite=state.launch!.invites.find(i=>i.id===p.inviteId)!;return {id:`mine:${p.id}`,cityId:p.cityId,placeId:p.placeId,ownerId:'you',ownerName:profileDisplayName(state.profile!),avatar:state.profile!.avatar,...own,questionIds:invite.ids,picks:[],you:true,preview:false};});
 return [...previewCards(state.profile.ageBand,state.blocked),...mine].sort((a,b)=>b.signal-a.signal||a.id.localeCompare(b.id));
}
export function discoveryCard(state:PreviewState,id:string){return dailyBottleCard(state.profile,id,state.blocked)??discoveryPostcards(state).find(c=>c.id===id);}
export function postcardScore(card:DiscoveryCard,answers:string[]){const matched=card.picks.map((p,i)=>p===answers[i]),shared=matched.filter(Boolean).length;return {matched,shared,connects:shared>=2};}
export function readPostcardDiscovery(value:unknown,profile:PreviewState['profile'],blocked:string[]=[]):PostcardDiscovery|undefined{
 if(!profile||profile.ageBand==='10-12'||!value||typeof value!=='object')return;
 const raw=value as PostcardDiscovery,cards=previewCards(profile.ageBand,blocked),out:PostcardDiscovery={active:null,results:[]},date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v)),valid=(card:DiscoveryCard|undefined,answers:unknown)=>!!card&&Array.isArray(answers)&&answers.every((a,i)=>typeof a==='string'&&questionById(card.questionIds[i])?.choices?.some(c=>c.label===a));
 const drop=readDailyBottleDrop(raw.drop,profile,blocked);if(drop)out.drop=drop;const resolve=(id?:string)=>id?dailyBottleCard(profile,id,blocked)??cards.find(c=>c.id===id):undefined;
 const a=raw.active,card=resolve(a?.cardId);if(a&&date(a.startedAt)&&Array.isArray(a.answers)&&a.answers.length<3&&valid(card,a.answers)&&(!a.answers.length||date(a.chargedAt)))out.active={cardId:a.cardId,answers:[...a.answers],startedAt:a.startedAt,chargedAt:a.answers.length?a.chargedAt:null};
 for(const result of Array.isArray(raw.results)?raw.results.slice(-60):[]){const c=resolve(result?.cardId);if(!result||typeof result.id!=='string'||result.id.length>200||!date(result.at)||result.answers?.length!==3||!valid(c,result.answers)||out.results.some(r=>r.id===result.id||result.cardId.startsWith('daily-bottle:')&&r.cardId===result.cardId))continue;out.results.push({id:result.id,cardId:result.cardId,answers:[...result.answers],at:result.at});}
 return out;
}
export function discoveryAllowance(state:PreviewState,now=new Date()){
 const cards=dailyBottleCards(state,now),drop=readDailyBottleDrop(state.postcardDiscovery?.drop,state.profile,state.blocked),openedIds=drop?.day===localDay(now)?drop.openedIds:[],active=state.postcardDiscovery?.active,resuming=!!active?.chargedAt&&!!discoveryCard(state,active.cardId),left=cards.filter(c=>!openedIds.includes(c.id)&&!state.postcardDiscovery?.results.some(r=>r.cardId===c.id)&&!connectionFor(state.social,c.ownerId,state.profile!.ageBand,state.blocked)).length;
 const reset=new Date(now);reset.setHours(24,0,0,0);
 return {left,total:cards.length,opened:openedIds.length,resuming,locked:!palFindingProgress(state).canPlay,waiting:!resuming&&left===0,regularActive:hasDailyProgress(state.daily),resetAt:reset.toISOString()};
}
export function beginPostcardPlay(state:PreviewState,id:string,now=new Date()):PreviewState{
 const card=discoveryCard(state,id);if(!card||card.you)throw new Error('Choose someone else’s bottle.');
 const previous=state.postcardDiscovery;
 if(previous?.results.some(r=>r.cardId===id))return state;
 if(previous?.active?.chargedAt)return state;
 if(!palFindingProgress(state).canPlay)throw new Error('Connect five friends to open worldwide matching.');
 const prepared=prepareDailyBottles(state,now),d=prepared.postcardDiscovery!;
 if(!dailyBottleCards(prepared,now).some(c=>c.id===id)||d.drop?.openedIds.includes(id)||connectionFor(state.social,card.ownerId,state.profile!.ageBand,state.blocked))throw new Error('Choose an unopened bottle from today.');
 if(d.active?.cardId===id)return prepared;
 return {...prepared,postcardDiscovery:{...d,active:{cardId:id,answers:[],startedAt:now.toISOString(),chargedAt:null}}};
}
export function answerPostcardPlay(state:PreviewState,answer:string,now=new Date()):PreviewState{
 const d=state.postcardDiscovery,a=d?.active,card=a?discoveryCard(state,a.cardId):undefined;if(!d||!a||!card||card.you||!palFindingProgress(state).canPlay)throw new Error('Open a bottle first.');const index=a.answers.length;if(!questionById(card.questionIds[index])?.choices?.some(c=>c.label===answer))throw new Error('Choose one of the six picks.');
 let next=state;
 if(!a.chargedAt){next=prepareDailyBottles(state,now);const drop=next.postcardDiscovery!.drop!;if(!drop.cardIds.includes(card.id)||drop.openedIds.includes(card.id)||connectionFor(state.social,card.ownerId,state.profile!.ageBand,state.blocked))throw new Error('Choose an unopened bottle from today.');next={...next,postcardDiscovery:{...next.postcardDiscovery!,drop:{...drop,openedIds:[...drop.openedIds,card.id]}}};}
 const discovery=next.postcardDiscovery!,answers=[...a.answers,answer],chargedAt=a.chargedAt??now.toISOString();if(answers.length<3)return {...next,postcardDiscovery:{...discovery,active:{...a,answers,chargedAt}}};
 const result={id:`postcard-play:${card.id}:${now.toISOString()}:${d.results.length}`,cardId:card.id,answers,at:now.toISOString()},score=postcardScore(card,answers),proofId=`postcard-open:${card.id}`,connection=connectionFor(state.social,card.ownerId,state.profile!.ageBand,state.blocked),exists=state.social.proofs.some(p=>p.playId===proofId&&p.peerId===card.ownerId);
 const social=score.connects&&!exists&&!connection?{...state.social,proofs:[...state.social.proofs,{playId:proofId,peerId:card.ownerId,countryId:card.cityId as CountryId,at:result.at,questionIds:[...card.questionIds],simulated:true as const,demoAnswers:Object.fromEntries(card.questionIds.map((id,i)=>[id,card.picks[i]]))}]}:state.social;
 return {...next,social,postcardDiscovery:{...discovery,active:null,results:[...discovery.results,result].slice(-60)}};
}
export function randomPostcard(state:PreviewState,rng:()=>number=Math.random,now=new Date()){
 const active=state.postcardDiscovery?.active;if(active?.chargedAt)return discoveryCard(state,active.cardId);
 const drop=readDailyBottleDrop(state.postcardDiscovery?.drop,state.profile,state.blocked),opened=drop?.day===localDay(now)?drop.openedIds:[],pool=dailyBottleCards(state,now).filter(c=>!opened.includes(c.id)&&!state.postcardDiscovery?.results.some(r=>r.cardId===c.id)&&!connectionFor(state.social,c.ownerId,state.profile!.ageBand,state.blocked));
 return pool[Math.floor(Math.max(0,Math.min(.999999999,rng()))*pool.length)];
}
