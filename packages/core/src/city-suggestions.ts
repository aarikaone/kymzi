import {TRAVEL_CITIES,type TravelCity} from './world-catalogue.ts';
export type CitySuggestionSource='visited'|'wishlist'|'world';
export type CitySuggestionDraft={city:string;country:string};
export type CitySuggestionReceipt=CitySuggestionDraft&{id:string;status:'pending';duplicate:boolean};
const tidy=(value:unknown)=>typeof value==='string'?value.normalize('NFKC').replace(/\s+/g,' ').trim():'';
const identity=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
export function prepareCitySuggestion(raw:CitySuggestionDraft):CitySuggestionDraft{
 const city=tidy(raw.city),country=tidy(raw.country);
 for(const [label,value] of [['city',city],['country',country]])if(value.length<2||value.length>80||!/[\p{L}]/u.test(value)||/[<>\u0000-\u001f\u007f]/.test(value))throw Error('Enter a valid '+label+' (2–80 characters).');
 return {city,country};
}
export function citySuggestionIdentity(draft:CitySuggestionDraft){const value=prepareCitySuggestion(draft);return JSON.stringify([identity(value.city),identity(value.country)]);}
export function existingSuggestedCity(raw:CitySuggestionDraft):TravelCity|undefined{
 const value=prepareCitySuggestion(raw),city=identity(value.city),country=identity(value.country);
 return TRAVEL_CITIES.find(c=>(identity(c.name)===country||c.countryCode.toLowerCase()===country)&&[c.city,...(c.aliases??[])].some(name=>identity(name)===city));
}
