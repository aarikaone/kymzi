import {COUNTRIES} from './countries.ts';
import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import {questionById,TRAVEL_COLLECTIONS} from './question-library.ts';
import {POSTCARD_DRIFT_STOPS} from './postcard-drift.ts';
import type {DiscoveryCard} from './postcard-discovery.ts';
export type BottleTravelStory={origin:NonNullable<ReturnType<typeof travelCityById>>;arrival:NonNullable<ReturnType<typeof travelCityById>>;cities:NonNullable<ReturnType<typeof travelCityById>>[];currentIndex:number;arrivedOn?:string;themes:string[];sample:boolean};
const hash=(s:string)=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
/** Fixture route, stable for the life of this bottle. Never an actual user's location history. */
function sampleRoute(card:DiscoveryCard){const currentIndex=2+hash(card.id+':hop')%3,others=COUNTRIES.filter(c=>c.id!==card.cityId).sort((a,b)=>hash(card.id+':'+a.id)-hash(card.id+':'+b.id)||a.id.localeCompare(b.id)).map(c=>c.id as TravelCityId),cities=others.slice(0,POSTCARD_DRIFT_STOPS-1);cities.splice(currentIndex,0,card.cityId);return {cities,currentIndex};}
export function bottleTravelStory(card:DiscoveryCard):BottleTravelStory|undefined{
 const route=card.route??(card.preview?sampleRoute(card):undefined);if(!route||!Array.isArray(route.cities)||route.cities.length!==POSTCARD_DRIFT_STOPS||new Set(route.cities).size!==POSTCARD_DRIFT_STOPS||!Number.isInteger(route.currentIndex)||route.currentIndex<0||route.currentIndex>=route.cities.length||route.cities[route.currentIndex]!==card.cityId||route.cities.some(id=>!travelCityById(id)))return;
 const cities=route.cities.map(id=>travelCityById(id)!),topics=new Set(card.questionIds.map(id=>questionById(id)?.topicId)),themes=TRAVEL_COLLECTIONS.filter(t=>topics.has(t.id)).map(t=>t.name).slice(0,2);
 const day=card.route?.arrivedOn??(card.id.startsWith('daily-bottle:')?card.id.split(':')[3]:undefined),arrivedOn=typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day?day:undefined;
 return {...(arrivedOn?{arrivedOn}:{}),origin:cities[0],arrival:cities[route.currentIndex],cities,currentIndex:route.currentIndex,themes,sample:card.preview};
}
