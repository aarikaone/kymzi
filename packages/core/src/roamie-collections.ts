import {roamieTravels} from './roamie-travel.ts';
import {placeCheckInFeed} from './place-checkins.ts';
import {travelCityById} from './world-catalogue.ts';
import type {PreviewState} from './preview.ts';
/** Only collections and feed items already shared by this connected Roamie. */
export function roamieCollections(state:PreviewState,id:string,now=new Date()){
 if(state.blocked.includes(id))return;
 const roamie=roamieTravels(state).find(r=>r.id===id);if(!roamie)return;
 const seen=new Set<string>(),gems=placeCheckInFeed(state,undefined,now).filter(p=>!p.you&&!!p.maps&&(p.peerId===id||p.circleFriendId===id)).filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return true;});
 const wishlist=roamie.travel.wishlist.filter(cityId=>!!travelCityById(cityId)),visited=roamie.travel.visited.filter(cityId=>!!travelCityById(cityId));
 return {roamie,wishlist,visited,gems,wishCount:roamie.travel.wishlistPlaces?.reduce((n,c)=>n+c.attractionIds.length,0)??wishlist.length};
}

export type RoamieCollectionTab='wishlist'|'visited'|'gems';
export function readRoamieCollectionTab(value:unknown):RoamieCollectionTab{return value==='visited'||value==='gems'?value:'wishlist';}
