import {peerUsername,profileDisplayName} from './profile-identity.ts';
import {demoPeers} from './index.ts';
import {COUNTRIES} from './countries.ts';
import {travelCityById} from './world-catalogue.ts';
import {postcardQuestions,questionById} from './question-library.ts';
import {connectionFor} from './social.ts';
import {localDay} from './daily.ts';
import type {PreviewState} from './preview.ts';
import type {DiscoveryCard} from './postcard-discovery.ts';
import type {AgeBand} from './types.ts';
export const DAILY_BOTTLE_LIMIT=10;
export type DailyBottleDrop={owner:string;ageBand:AgeBand;day:string;cardIds:string[];openedIds:string[]};
const hash=(s:string)=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const identity=(profile:NonNullable<PreviewState['profile']>)=>hash(profile.name+':'+profile.ageBand).toString(36);
const validDay=(day:string)=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day;
const cardCache=new Map<string,DiscoveryCard>();
/** Local fictional offers. A live delivery service can replace this provider without changing the daily flow. */
export function dailyBottleCard(profile:PreviewState['profile'],id:string,blocked:string[]=[]):DiscoveryCard|undefined{
 if(!profile||profile.ageBand==='10-12'||typeof id!=='string')return;
 const [prefix,band,owner,day,peerId]=id.split(':');
 if(prefix!=='daily-bottle'||band!==profile.ageBand||owner!==identity(profile)||!validDay(day)||id.split(':').length!==5)return;
 const peer=demoPeers.find(p=>p.id===peerId&&p.ageBand===band&&!blocked.includes(p.id)),country=COUNTRIES.find(c=>c.name===peer?.country),city=country&&travelCityById(country.id);if(!peer||!city?.placeIds.length)return;
 const cached=cardCache.get(id);if(cached)return cached;
 const seed=hash(id),questions=postcardQuestions('',band),questionIds:Array<string>=[];
 for(let i=0;i<3;i++){const pool=questions.filter(q=>!questionIds.includes(q.id)&&(!q.phase||q.phase===['start','wander','afterglow'][i]));const available=pool.length?pool:questions.filter(q=>!questionIds.includes(q.id));if(!available.length)return;questionIds.push(available[hash(id+':question:'+i)%available.length].id);}
 const wishes=3+seed%32,gems=(seed>>>5)%17;
 const card:DiscoveryCard={id,cityId:city.id,placeId:city.placeIds[seed%Math.min(4,city.placeIds.length)],ownerId:peer.id,ownerName:'@'+peerUsername(peer),avatar:peer.avatar,wishes,gems,signal:Math.min(100,10+wishes+gems*3),questionIds,picks:questionIds.map((q,i)=>questionById(q)!.choices![hash(id+':pick:'+i)%6].label),you:false,preview:true};if(cardCache.size>2000)cardCache.clear();cardCache.set(id,card);return card;
}
export function readDailyBottleDrop(value:unknown,profile:PreviewState['profile'],blocked:string[]=[]):DailyBottleDrop|undefined{
 if(!profile||profile.ageBand==='10-12'||!value||typeof value!=='object')return;
 const raw=value as DailyBottleDrop;if(raw.owner!==profile.name||raw.ageBand!==profile.ageBand||typeof raw.day!=='string'||!validDay(raw.day)||!Array.isArray(raw.cardIds))return;
 const cardIds=[...new Set(raw.cardIds.filter((id):id is string=>typeof id==='string'&&id.split(':')[3]===raw.day&&!!dailyBottleCard(profile,id,blocked)))].slice(0,DAILY_BOTTLE_LIMIT),openedIds=[...new Set((Array.isArray(raw.openedIds)?raw.openedIds:[]).filter((id):id is string=>typeof id==='string'&&cardIds.includes(id)))];
 return {owner:profile.name,ageBand:profile.ageBand,day:raw.day,cardIds,openedIds};
}
export function dailyBottleCards(state:PreviewState,now=new Date()):DiscoveryCard[]{
 const profile=state.profile;if(!profile||profile.ageBand==='10-12')return [];
 const day=localDay(now),drop=readDailyBottleDrop(state.postcardDiscovery?.drop,profile,state.blocked);
 if(drop?.day===day)return drop.cardIds.flatMap(id=>{const card=dailyBottleCard(profile,id,state.blocked);return card?[card]:[];});
 return COUNTRIES.flatMap(country=>{const peers=demoPeers.filter(p=>p.ageBand===profile.ageBand&&p.country===country.name&&!state.blocked.includes(p.id)&&!connectionFor(state.social,p.id,profile.ageBand,state.blocked));if(!peers.length)return [];const peer=peers[hash(identity(profile)+day+country.id)%peers.length],id=`daily-bottle:${profile.ageBand}:${identity(profile)}:${day}:${peer.id}`,card=dailyBottleCard(profile,id,state.blocked);return card?[card]:[];}).sort((a,b)=>hash(identity(profile)+day+a.id)-hash(identity(profile)+day+b.id)||a.id.localeCompare(b.id)).slice(0,DAILY_BOTTLE_LIMIT);
}
export function prepareDailyBottles(state:PreviewState,now=new Date()):PreviewState{
 const profile=state.profile;if(!profile||profile.ageBand==='10-12')return state;
 const day=localDay(now),drop=readDailyBottleDrop(state.postcardDiscovery?.drop,profile,state.blocked);if(drop?.day===day)return state;
 const discovery=state.postcardDiscovery??{active:null,results:[]};return {...state,postcardDiscovery:{...discovery,drop:{owner:profile.name,ageBand:profile.ageBand,day,cardIds:dailyBottleCards(state,now).map(c=>c.id),openedIds:[]}}};
}
