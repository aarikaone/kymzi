import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import {readTravelProfile,type CitySelection,type TravelProfile} from './travel-profile.ts';
import {roamieTravels} from './roamie-travel.ts';
import type {PreviewState} from './preview.ts';
export type WishFulfillment={id:string;cityId:TravelCityId;placeId:string;at:string};
/** A declared place visit is independent of verified device check-ins. */
export function readWishFulfillments(value:unknown,visited:CitySelection[]):WishFulfillment[]{
 const out:WishFulfillment[]=[];
 for(const raw of Array.isArray(value)?value:[]){if(!raw||typeof raw.placeId!=='string'||typeof raw.at!=='string'||!Number.isFinite(Date.parse(raw.at))||!visited.some(c=>c.cityId===raw.cityId&&c.attractionIds.includes(raw.placeId))||out.some(w=>w.cityId===raw.cityId&&w.placeId===raw.placeId))continue;out.push({id:`fulfilled:${raw.cityId}:${raw.placeId}`,cityId:raw.cityId,placeId:raw.placeId,at:new Date(raw.at).toISOString()});}
 return out.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
}
export function travelWishGoalCount(value:unknown):number{const t=readTravelProfile(value);return t.wishlist.reduce((n,c)=>n+c.attractionIds.length,0)+(t.wishFulfillments?.length??0);}
export function fulfillTravelWish(value:TravelProfile,cityId:TravelCityId,placeId:string,now=new Date()):TravelProfile{
 const travel=readTravelProfile(value),city=travelCityById(cityId);if(!city?.placeIds.includes(placeId))throw new Error('Choose a wishlist place.');
 const old=travel.wishFulfillments?.find(w=>w.cityId===cityId&&w.placeId===placeId),wish=travel.wishlist.find(c=>c.cityId===cityId&&c.attractionIds.includes(placeId));if(!wish){if(old)return travel;throw new Error('This place is not on your wishlist.');}
 const visited=travel.visited.find(c=>c.cityId===cityId),selection={cityId,attractionIds:[...new Set([...(visited?.attractionIds??[]),placeId])]},fulfillment=old??{id:`fulfilled:${cityId}:${placeId}`,cityId,placeId,at:now.toISOString()};
 return readTravelProfile({...travel,visited:visited?travel.visited.map(c=>c.cityId===cityId?selection:c):[...travel.visited,selection],wishlist:travel.wishlist.map(c=>c.cityId===cityId?{...c,attractionIds:c.attractionIds.filter(id=>id!==placeId)}:c).filter(c=>c.attractionIds.length),wishFulfillments:[...(travel.wishFulfillments??[]).filter(w=>w.id!==fulfillment.id),fulfillment]});
}
/** Local preview projection; cross-device publication requires authenticated relationships. */
export function wishFulfillmentPosts(state:PreviewState,viewerId?:string){
 if(!state.profile)return [];
 const connections=roamieTravels(state),privateMode=state.profile.ageBand==='10-12';
 if(viewerId!==undefined&&(privateMode||!connections.some(r=>r.id===viewerId)))return [];
 const travel=readTravelProfile(state.profile.travel);
 return (travel.wishFulfillments??[]).map(w=>({...w,ownerName:state.profile!.name,ownerAvatar:state.profile!.avatar,photos:(travel.memories??[]).filter(p=>p.cityId===w.cityId&&p.placeId===w.placeId),audience:privateMode?'private' as const:'roamies' as const,connections:privateMode?[]:connections.map(r=>({id:r.id,name:r.name,avatar:r.avatar})),sharing:'preview' as const}));
}
