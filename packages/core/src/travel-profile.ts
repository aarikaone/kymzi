import {TRAVEL_CITIES,travelCityById,travelCityDistanceKm,type TravelCityId} from './world-catalogue.ts';
import {readWishFulfillments,type WishFulfillment} from './wish-fulfillment.ts';
import {readVisitedPhotos,type VisitedPhoto} from './visited-photos.ts';
import type {PreviewState} from './preview.ts';
export type CitySelection={cityId:TravelCityId;attractionIds:string[]};
export type CityArrival={id:string;cityId:TravelCityId;at:string;source:'device'|'demo';wishFulfilled:boolean};
export type TravelProfile={version:1;visited:CitySelection[];wishlist:CitySelection[];arrivals:CityArrival[];memories?:VisitedPhoto[];wishFulfillments?:WishFulfillment[];completedAt?:string};
export type SharedTravel={visited:TravelCityId[];wishlist:TravelCityId[];fulfilled:{cityId:TravelCityId;source:'device'|'demo';at:string}[]};
export type CityEvidence={source:'device'|'demo';latitude:number;longitude:number;observedAt:number;accuracy:number};
export const emptyTravel=():TravelProfile=>({version:1,visited:[],wishlist:[],arrivals:[]});
export function cleanCitySelection(value:unknown):CitySelection|undefined {
 const p=value as Partial<CitySelection>|null,city=travelCityById(p?.cityId);if(!p||!city)return;
 return {cityId:p.cityId!,attractionIds:[...new Set((Array.isArray(p.attractionIds)?p.attractionIds:[]).filter((id):id is string=>typeof id==='string'&&city.placeIds.includes(id)))].slice(0,city.placeIds.length)};
}
const selections=(value:unknown,max:number)=>{const out:CitySelection[]=[];for(const raw of Array.isArray(value)?value:[]){const city=cleanCitySelection(raw);if(city&&!out.some(c=>c.cityId===city.cityId))out.push(city);if(out.length===max)break;}return out;};
export function readTravelProfile(value:unknown):TravelProfile {
 const p=value as Partial<TravelProfile>|null,s=emptyTravel();if(!p)return s;
 s.visited=selections(p.visited,TRAVEL_CITIES.length);s.wishlist=selections(p.wishlist,TRAVEL_CITIES.length);
 const memories=readVisitedPhotos(p.memories,s.visited);if(memories.length)s.memories=memories;
 const fulfilled=readWishFulfillments(p.wishFulfillments,s.visited);if(fulfilled.length)s.wishFulfillments=fulfilled;
 if(typeof p.completedAt==='string'&&Number.isFinite(Date.parse(p.completedAt)))s.completedAt=p.completedAt;
 for(const a of Array.isArray(p.arrivals)?p.arrivals:[]){if(!a||!travelCityById(a.cityId)||!['device','demo'].includes(a.source)||!Number.isFinite(Date.parse(a.at))||s.arrivals.some(e=>e.cityId===a.cityId))continue;s.arrivals.push({id:`arrival:${a.cityId}:${a.source}:${a.at}`,cityId:a.cityId,at:a.at,source:a.source,wishFulfilled:a.wishFulfilled===true});}
 return s;
}
export function travelWishCount(value:unknown):number {return readTravelProfile(value).wishlist.reduce((total,city)=>total+city.attractionIds.length,0);}
export function completeTravelProfile(value:unknown,now=new Date()):TravelProfile {
 const s=readTravelProfile(value);if(travelWishCount(s)+(s.wishFulfillments?.length??0)<3)throw new Error('Pick at least three wishlist places.');return {...s,completedAt:s.completedAt??now.toISOString()};
}
export function setTravelCity(travel:TravelProfile,kind:'visited'|'wishlist',selection:CitySelection):TravelProfile {
 const city=cleanCitySelection(selection);if(!city)throw new Error('Choose a city.');
 const items=travel[kind];
 return readTravelProfile({...travel,[kind]:items.some(c=>c.cityId===city.cityId)?items.map(c=>c.cityId===city.cityId?city:c):[...items,city]});
}
export function removeTravelCity(travel:TravelProfile,kind:'visited'|'wishlist',id:TravelCityId):TravelProfile{return readTravelProfile({...travel,[kind]:travel[kind].filter(c=>c.cityId!==id)});}
export function sharedTravel(value:unknown):SharedTravel|undefined {
 if(!value)return;const s=readTravelProfile(value);return {visited:s.visited.map(c=>c.cityId).slice(0,26),wishlist:s.wishlist.map(c=>c.cityId).slice(0,26),fulfilled:s.arrivals.filter(a=>a.wishFulfilled).map(a=>({cityId:a.cityId,source:a.source,at:a.at})).slice(-3)};
}
export function readSharedTravel(value:unknown):SharedTravel|undefined {
 if(!value||typeof value!=='object')return;const p=value as Partial<SharedTravel>,ids=(v:unknown,max:number)=>[...new Set((Array.isArray(v)?v:[]).filter((id):id is TravelCityId=>!!travelCityById(id)))].slice(0,max);
 const visited=ids(p.visited,26),wishlist=ids(p.wishlist,26),fulfilled=(Array.isArray(p.fulfilled)?p.fulfilled:[]).filter(a=>a&&visited.includes(a.cityId)&&['device','demo'].includes(a.source)&&Number.isFinite(Date.parse(a.at))).slice(-3).map(a=>({cityId:a.cityId,source:a.source,at:a.at}));return {visited,wishlist,fulfilled};
}
export function recordCityArrival(state:PreviewState,id:TravelCityId,evidence:CityEvidence,now=new Date()):PreviewState {
 const city=travelCityById(id);if(!state.profile||!city||!['device','demo'].includes(evidence.source))throw new Error('Choose a city to check in.');
 if(evidence.source==='device'){
  if(!Number.isFinite(evidence.observedAt)||Math.abs(now.getTime()-evidence.observedAt)>120000||!Number.isFinite(evidence.accuracy)||evidence.accuracy<0||evidence.accuracy>1500)throw new Error('Get a fresh, more accurate location and try again.');
  if(!Number.isFinite(evidence.latitude)||!Number.isFinite(evidence.longitude)||Math.abs(evidence.latitude)>90||Math.abs(evidence.longitude)>180||travelCityDistanceKm(id,evidence.latitude,evidence.longitude)>35)throw new Error(`Your location doesn’t match ${city.city}. Check in when you arrive.`);
 }
 const travel=readTravelProfile(state.profile.travel),old=travel.arrivals.find(a=>a.cityId===id);
 if(old&&(old.source==='device'||evidence.source==='demo')&&(old.wishFulfilled||!travel.wishlist.some(w=>w.cityId===id)))return state;
 const at=now.toISOString(),arrival:CityArrival={id:`arrival:${id}:${evidence.source}:${at}`,cityId:id,at,source:evidence.source,wishFulfilled:travel.wishlist.some(c=>c.cityId===id)};
 const visited=travel.visited.some(c=>c.cityId===id)?travel.visited:[...travel.visited,{cityId:id,attractionIds:[]}];
 return {...state,profile:{...state.profile,travel:{...travel,visited,arrivals:[...travel.arrivals.filter(a=>a.cityId!==id),arrival]}}};
}
export function previewCityEvidence(id:TravelCityId,now=new Date()):CityEvidence {const city=travelCityById(id);if(!city)throw new Error('Choose a city.');const {latitude,longitude}=city;return {source:'demo',latitude,longitude,observedAt:now.getTime(),accuracy:0};}
export function travelPreview(visited:TravelCityId[],wishlist:TravelCityId[],now=new Date()):TravelProfile {
 const entry=(cityId:TravelCityId)=>({cityId,attractionIds:travelCityById(cityId)?.placeIds.slice(0,2)??[]});
 return {version:1,visited:visited.map(entry),wishlist:wishlist.slice(0,3).map(entry),arrivals:[],completedAt:now.toISOString()};
}
