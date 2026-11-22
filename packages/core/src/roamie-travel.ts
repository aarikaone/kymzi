import {profileDisplayName} from './profile-identity.ts';
import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import {palFindingProgress,invitedFriends} from './launch.ts';
import {palSummaries} from './pal-loop.ts';
import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import {readSharedTravel,readTravelProfile,setTravelCity,sharedTravel,travelPreview,type SharedTravel} from './travel-profile.ts';
import type {PreviewState} from './preview.ts';
import type {AvatarId} from './types.ts';
export type RoamieTravel={id:string;name:string;avatar:AvatarId;travel:SharedTravel;preview:boolean;relationship?:'friend'|'buddy'};
export function roamieTravels(state:PreviewState):RoamieTravel[]{
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const circle=invitedFriends(state).map((reply):RoamieTravel=>({id:`circle:${reply.person.name}`,relationship:'friend',name:profileDisplayName(reply.person),avatar:reply.person.avatar,travel:readSharedTravel(reply.person.travel)??{visited:[],wishlist:[],fulfilled:[]},preview:!!reply.person.travel?.fulfilled.some(a=>a.source==='demo')}));
 const global=palSummaries(state).map((pal,i):RoamieTravel=>{const own=readTravelProfile(state.profile!.travel),next=COUNTRIES.filter(c=>c.id!==pal.countryId).slice(i*2,i*2+3).map(c=>c.id),wish=[...new Set([...own.visited.map(c=>c.cityId),...next])].slice(0,3);return {id:pal.id,name:pal.alias,avatar:pal.imageAvatar,travel:sharedTravel(travelPreview([pal.countryId],wish))!,preview:true};});
 return [...circle,...global];
}
export function travelMilestones(state:PreviewState){
 const own=readTravelProfile(state.profile?.travel).arrivals.filter(a=>a.wishFulfilled).map(a=>({...a,name:'You',avatar:state.profile!.avatar,you:true}));
 const friends=roamieTravels(state).flatMap(r=>r.travel.fulfilled.map(a=>({id:`wish:${r.id}:${a.cityId}`,cityId:a.cityId,at:a.at,source:a.source,wishFulfilled:true,name:r.name,avatar:r.avatar,you:false})));
 return [...own,...friends].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
}
export function sharedCityConnections(state:PreviewState,id:TravelCityId){return roamieTravels(state).filter(r=>r.travel.visited.includes(id)||r.travel.wishlist.includes(id));}

/** Add a place from a connected Roamie's wishlist city without altering their list. */
export function pickRoamieWish(state:PreviewState,roamieId:string,cityId:TravelCityId,placeId:string):PreviewState{
 const roamie=roamieTravels(state).find(r=>r.id===roamieId),city=travelCityById(cityId);
 if(!state.profile||!roamie?.travel.wishlist.includes(cityId)||!city?.placeIds.includes(placeId))throw new Error('Choose a place from your Roamie’s wishlist.');
 const travel=readTravelProfile(state.profile.travel),existing=travel.wishlist.find(c=>c.cityId===cityId);
 if(existing?.attractionIds.includes(placeId)||travel.wishFulfillments?.some(w=>w.cityId===cityId&&w.placeId===placeId))return state;
 return {...state,profile:{...state.profile,travel:setTravelCity(travel,'wishlist',{cityId,attractionIds:[...(existing?.attractionIds??[]),placeId]})}};
}

export type RoamieWishStop={id:string;roamieId:string;name:string;avatar:AvatarId;cityId:TravelCityId;placeId?:string};
/** Shared wishlist picks from connected Roamies; a wish is never evidence of a visit. */
export function roamieWishStops(state:PreviewState):RoamieWishStop[]{
 const lists=roamieTravels(state).filter(r=>!state.blocked.includes(r.id)).map(r=>r.travel.wishlist.flatMap(cityId=>{
  const city=travelCityById(cityId);if(!city)return [];
  const picks=[...new Set(r.travel.wishlistPlaces?.find(c=>c.cityId===cityId)?.attractionIds??[])].filter(id=>city.placeIds.includes(id));
  const places:Array<string|undefined>=picks.length?picks:[undefined];
  return places.map(placeId=>({id:`roamie-wish:${r.id}:${cityId}:${placeId??'city'}`,roamieId:r.id,name:r.name,avatar:r.avatar,cityId,...(placeId?{placeId}:{})}));
 }));
 // Alternate people so the first screen includes more than one Roamie’s wishes.
 const events:RoamieWishStop[]=[];for(let i=0;i<Math.max(0,...lists.map(l=>l.length));i++)for(const list of lists)if(list[i])events.push(list[i]);
 return events;
}

export type RoamieWishGroup={id:string;roamieId:string;name:string;avatar:AvatarId;cityId:TravelCityId;wishes:RoamieWishStop[]};
/** Presentation order is stable for a feed visit; grouping never merges different people or cities. */
export function groupRoamieWishes(stops:readonly RoamieWishStop[],seed:number):RoamieWishGroup[]{
 const groups=new Map<string,RoamieWishGroup>(),seen=new Set<string>();
 for(const wish of stops){if(seen.has(wish.id))continue;seen.add(wish.id);const id=JSON.stringify([wish.roamieId,wish.cityId]);let group=groups.get(id);if(!group){group={id,roamieId:wish.roamieId,name:wish.name,avatar:wish.avatar,cityId:wish.cityId,wishes:[]};groups.set(id,group);}group.wishes.push(wish);}
 function score(id:string){let h=(2166136261^(seed>>>0))>>>0;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return (h^(h>>>16))>>>0;}
 const order=(a:{id:string},b:{id:string})=>score(a.id)-score(b.id)||a.id.localeCompare(b.id);
 for(const group of groups.values())group.wishes.sort(order);
 return [...groups.values()].sort(order);
}
