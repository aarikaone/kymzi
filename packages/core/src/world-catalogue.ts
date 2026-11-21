import {countryById,type CountryId} from './countries.ts';
import {attractionsForCountry,type Attraction} from './attractions.ts';
import type {PlaceCategoryId} from './place-categories.ts';
export type TravelCityId=CountryId|`city:${number}`;
export type WorldRegion='AF'|'AS'|'EU'|'NA'|'SA'|'OC'|'AN';
export type WorldCityRow=[id:TravelCityId,geonameId:number,city:string,ascii:string,region:string,countryCode:string,country:string,continent:WorldRegion,latitude:number,longitude:number,timeZone:string,population:number,placeIds:string[],aliases:string[]];
export type WorldPlaceRow=[id:string,name:string,categoryId:PlaceCategoryId,kind:string,description:string,latitude:number,longitude:number,distanceKm:number,sitelinks:number,countryCode:string];
export type TravelCitySort='popular'|'name';
export type TravelPopularity={score:number;rank:number;method:string;citySitelinks?:number;attractionSitelinks?:number;hasTravelGuide?:boolean;measuredAt?:string};
export type TravelCity={popularity?:TravelPopularity;description?:string;wikidataId?:string;wikipediaUrl?:string;wikivoyageUrl?:string;id:TravelCityId;geonameId:number;city:string;name:string;countryCode:string;flag:string;region:string;continent:WorldRegion;latitude:number;longitude:number;timeZone:string;population:number;placeIds:readonly string[];aliases:readonly string[];sourceUrl:string};
export type TravelPlaceDetails={description:string;facts:{label:string;value:string}[];credits:{title:string;url:string;license:string;attribution:string}[];updatedAt:string;status:'complete'|'limited'};
export type TravelPlace={details?:TravelPlaceDetails;id:string;cityId:TravelCityId;name:string;categoryId:PlaceCategoryId;kind:string;fact:string;question:string;sourceUrl:string;mapsUrl:string;latitude?:number;longitude?:number;distanceKm?:number;sitelinks?:number;sourceCountryCode:string;source:'Wikidata'|'Curated guide'};
const flag=(iso:string)=>String.fromCodePoint(...iso.toUpperCase().split('').map(c=>127397+c.charCodeAt(0)));
export const TRAVEL_CITIES:TravelCity[]=[];
const cityIndex=new Map<TravelCityId,TravelCity>();
const placeCityIndex=new Map<string,TravelCity>();
export function travelCityForPlace(id:string):TravelCity|undefined{return placeCityIndex.get(id);}
export function travelCityById(id:unknown):TravelCity|undefined{return typeof id==='string'?cityIndex.get(id as TravelCityId):undefined;}
export function isTravelCityId(id:unknown):id is TravelCityId{return !!travelCityById(id);}
export const WORLD_CATALOGUE={newCities:0,countries:0,cities:0,places:0,minimumPlaces:0};
const fold=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
const countryAliases:Record<string,string[]>={US:['USA','United States of America'],GB:['UK'],AE:['UAE']};
let searchIndex: {city:TravelCity;name:string;countries:string[];text:string}[]=[];
let placeLoader:((id:TravelCityId)=>Promise<TravelPlace[]>)|undefined;
const cityCache=new Map<TravelCityId,Promise<TravelPlace[]>>();
/** The apps call this only after cities have been read from Kymzi Firestore. */
export function configureTravelCatalogue(cities:TravelCity[],loader:(id:TravelCityId)=>Promise<TravelPlace[]>){
 TRAVEL_CITIES.splice(0,TRAVEL_CITIES.length,...cities);cityIndex.clear();placeCityIndex.clear();
 for(const city of cities){cityIndex.set(city.id,city);for(const id of city.placeIds)if(!placeCityIndex.has(id))placeCityIndex.set(id,city);}
 searchIndex=cities.map(city=>({city,name:fold(city.city),countries:[city.name,city.countryCode,...(countryAliases[city.countryCode]??[])].map(fold),text:fold([city.city,city.name,city.countryCode,...(countryAliases[city.countryCode]??[]),city.region,...city.aliases].join(' '))}));
 Object.assign(WORLD_CATALOGUE,{newCities:cities.filter(c=>c.id.startsWith('city:')).length,countries:new Set(cities.map(c=>c.countryCode)).size,cities:cities.length,places:cities.reduce((n,c)=>n+c.placeIds.length,0),minimumPlaces:cities.length?Math.min(...cities.map(c=>c.placeIds.length)):0});
 placeLoader=loader;cityCache.clear();
}
/** Search scans the light city index; place chunks are never loaded by typing. */
export function searchTravelCities(query='',limit=40,continent?:WorldRegion,sort?:TravelCitySort):TravelCity[]{
 const q=fold(query),words=q.split(/\s+/).filter(Boolean);
 return searchIndex.filter(r=>(!continent||r.city.continent===continent)&&words.every(w=>r.text.includes(w)))
  .map(r=>({city:r.city,score:!q?0:r.name===q?6:r.countries.includes(q)?5:r.name.startsWith(q)?4:r.name.includes(q)?3:1}))
  .sort((a,b)=>b.score-a.score||(sort==='name'?a.city.city.localeCompare(b.city.city,'en'):sort==='popular'?(b.city.popularity?.score??0)-(a.city.popularity?.score??0):0)||(q?b.city.population-a.city.population:0)||((sort||q)?a.city.id.localeCompare(b.city.id):0))
  .slice(0,Math.max(0,limit)).map(r=>r.city);
}

function curatedKind(a:Attraction):PlaceCategoryId{const k=a.kind.toLowerCase();return /nature|conservation/.test(k)?'park':/coast/.test(k)?'beach':/art|history|science/.test(k)?'museum':/culture|heritage/.test(k)?'temple':/skyline|architecture|landmark/.test(k)?'landmark':'attraction';}
export function curatedTravelPlaces(id:TravelCityId):TravelPlace[]{const legacy=countryById(id);if(!legacy)return [];return attractionsForCountry(legacy.id).map(a=>({id:a.id,cityId:id,name:a.name,categoryId:curatedKind(a),kind:a.kind,fact:a.fact,question:a.question,sourceUrl:a.sourceUrl,mapsUrl:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name+', '+legacy.city+', '+legacy.name)}`,sourceCountryCode:legacy.id,source:'Curated guide'}));}
/** Attractions are requested from Firestore only when a city needs them. */
export function loadTravelCityPlaces(id:TravelCityId):Promise<TravelPlace[]>{
 if(!travelCityById(id))return Promise.resolve([]);
 const cached=cityCache.get(id);if(cached)return cached;
 if(!placeLoader)return Promise.reject(new Error('The city catalogue has not connected yet.'));
 const result=placeLoader(id);cityCache.set(id,result);result.catch(()=>{if(cityCache.get(id)===result)cityCache.delete(id);});return result;
}
export function travelPlaceGroup(p:Pick<TravelPlace,'categoryId'|'kind'>):string {if(/museum|gallery|library|theatre|culture|art|history/i.test(p.kind))return 'Culture';if(['park','garden','beach','lake','trail'].includes(p.categoryId)||/zoo|aquarium|reserve/i.test(p.kind))return 'Nature';if(['cafe','restaurant'].includes(p.categoryId))return 'Food';if(['mall','market','bookshop'].includes(p.categoryId))return 'Shopping';if(p.categoryId==='sports')return 'Sports';if(p.categoryId==='station')return 'Architecture';return 'Landmarks';}
export function travelCityDistanceKm(id:TravelCityId,latitude:number,longitude:number){const c=travelCityById(id);if(!c)return Infinity;const r=Math.PI/180,a=Math.sin((latitude-c.latitude)*r/2)**2+Math.cos(c.latitude*r)*Math.cos(latitude*r)*Math.sin((longitude-c.longitude)*r/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));}
/** A labelled, original guide illustration; it does not pretend to be a photograph. */
export function cityGuideSVG(id:string){let seed=2166136261;for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;const colors=[['#1c2436','#91b9ee','#c8beff'],['#202639','#c8beff','#d5f88f'],['#192f2b','#b5d98c','#a9d8ff'],['#302436','#d9b2c9','#c8beff']][seed%4];let blocks='';for(let i=0;i<8;i++){seed=Math.imul(seed^i,16777619)>>>0;const h=35+seed%100,x=15+i*42,w=27+seed%13;blocks+=`<rect x="${x}" y="${188-h}" width="${w}" height="${h}" rx="${4+seed%6}" fill="${i%2?colors[1]:colors[2]}" opacity="${.25+(i%3)*.18}"/><path d="M${x+8} ${201-h}v8m0 9v8m10-25v8m0 9v8" stroke="${colors[0]}" stroke-width="3" stroke-linecap="round"/>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240"><rect width="360" height="240" fill="${colors[0]}"/><circle cx="${70+seed%210}" cy="58" r="30" fill="${colors[2]}" opacity=".65"/><path d="M-20 178Q70 75 170 157T390 121V240H0" fill="${colors[1]}" opacity=".12"/>${blocks}<path d="M-10 217Q100 176 185 215T380 207" fill="none" stroke="${colors[2]}" stroke-width="2" opacity=".4"/><path d="m288 38 5 11 11 5-11 5-5 11-5-11-11-5 11-5Z" fill="${colors[2]}"/></svg>`;
}
