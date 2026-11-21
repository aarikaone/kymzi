import type {TravelCityId} from './world-catalogue.ts';
import {palFindingProgress} from './launch.ts';
import {palSummaries} from './pal-loop.ts';
import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import {readSharedTravel,readTravelProfile,sharedTravel,travelPreview,type SharedTravel} from './travel-profile.ts';
import type {PreviewState} from './preview.ts';
import type {AvatarId} from './types.ts';
export type RoamieTravel={id:string;name:string;avatar:AvatarId;travel:SharedTravel;preview:boolean};
export function roamieTravels(state:PreviewState):RoamieTravel[]{
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const circle=palFindingProgress(state).friends.map((reply):RoamieTravel=>({id:`circle:${reply.person.name}`,name:`#${reply.person.name}`,avatar:reply.person.avatar,travel:readSharedTravel(reply.person.travel)??{visited:[],wishlist:[],fulfilled:[]},preview:!!reply.person.travel?.fulfilled.some(a=>a.source==='demo')}));
 const global=palSummaries(state).map((pal,i):RoamieTravel=>{const own=readTravelProfile(state.profile!.travel),next=COUNTRIES.filter(c=>c.id!==pal.countryId).slice(i*2,i*2+3).map(c=>c.id),wish=[...new Set([...own.visited.map(c=>c.cityId),...next])].slice(0,3);return {id:pal.id,name:pal.alias,avatar:pal.imageAvatar,travel:sharedTravel(travelPreview([pal.countryId],wish))!,preview:true};});
 return [...circle,...global];
}
export function travelMilestones(state:PreviewState){
 const own=readTravelProfile(state.profile?.travel).arrivals.filter(a=>a.wishFulfilled).map(a=>({...a,name:'You',avatar:state.profile!.avatar,you:true}));
 const friends=roamieTravels(state).flatMap(r=>r.travel.fulfilled.map(a=>({id:`wish:${r.id}:${a.cityId}`,cityId:a.cityId,at:a.at,source:a.source,wishFulfilled:true,name:r.name,avatar:r.avatar,you:false})));
 return [...own,...friends].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
}
export function sharedCityConnections(state:PreviewState,id:TravelCityId){return roamieTravels(state).filter(r=>r.travel.visited.includes(id)||r.travel.wishlist.includes(id));}
