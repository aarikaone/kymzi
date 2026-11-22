import {travelCityById,travelCityForPlace,type TravelCityId} from './world-catalogue.ts';
import type {TravelProfile} from './travel-profile.ts';
export type PlaceStackKind='saved'|'visited'|'wishlist';
export type PlaceStackSelection={cityId:TravelCityId;ids:string[]};
/** Current city picks replace its committed selection, including an empty draft. */
export function travelPlaceStack(travel:TravelProfile,section:'visited'|'wishlist',picking?:PlaceStackSelection):string[]{
 const selections=travel[section].filter(s=>s.cityId!==picking?.cityId).map(s=>({cityId:s.cityId,ids:s.attractionIds}));if(picking)selections.push(picking);
 return [...new Set(selections.flatMap(s=>{const city=travelCityById(s.cityId);return s.ids.filter(id=>city?.placeIds.includes(id));}))];
}
export function validPlaceStack(ids:string[]):string[]{return [...new Set(ids)].filter(id=>!!travelCityForPlace(id));}
