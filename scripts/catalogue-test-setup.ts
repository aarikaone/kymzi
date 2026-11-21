import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {readFileSync} from 'node:fs';
// Test fixtures only. These catalogue shards are never imported by either app.
import {WORLD_CITY_ROWS} from '../packages/core/src/catalogue/world-cities-data.ts';
import {configureTravelCatalogue,curatedTravelPlaces,travelCityById,type TravelCity,type TravelCityId,type TravelPlace,type WorldRegion,type WorldPlaceRow,type TravelPopularity} from '../packages/core/src/world-catalogue.ts';
const flag=(iso:string)=>String.fromCodePoint(...iso.toUpperCase().split('').map(c=>127397+c.charCodeAt(0)));
const cities:TravelCity[]=WORLD_CITY_ROWS.map(r=>({id:r[0],geonameId:r[1],city:r[2],name:r[6],countryCode:r[5],flag:flag(r[5]),region:r[4],continent:r[7],latitude:r[8],longitude:r[9],timeZone:r[10],population:r[11],placeIds:r[12],aliases:[r[3],...r[13]],sourceUrl:`https://www.geonames.org/${r[1]}`}));
type ExpansionPlace={id:string;name:string;categoryId:TravelPlace['categoryId'];kind:string;description:string;latitude:number|null;longitude:number|null;distanceKm:number|null;sitelinks:number;countryCode:string;sourceUrl:string;mapsUrl:string;question:string;details?:TravelPlace['details']};
type ExpansionCity={id:TravelCityId;geonameId:number;city:string;ascii:string;country:string;countryCode:string;continent:WorldRegion;latitude:number;longitude:number;timeZone:string;population:number;region:string;aliases:string[];citySourceUrl:string;places:ExpansionPlace[];popularity:TravelPopularity};
const expansion=JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../content/world-catalogue/expansion-v2.json'),'utf8')) as {cities:ExpansionCity[];existingPopularity:Record<string,TravelPopularity>};
for(const c of cities)c.popularity=expansion.existingPopularity[c.id];
const extraPlaces=new Map<TravelCityId,TravelPlace[]>();
for(const c of expansion.cities){cities.push({id:c.id,geonameId:c.geonameId,city:c.city,name:c.country,countryCode:c.countryCode,flag:flag(c.countryCode),region:c.region,continent:c.continent,latitude:c.latitude,longitude:c.longitude,timeZone:c.timeZone,population:c.population,aliases:[c.ascii,...c.aliases],sourceUrl:c.citySourceUrl,placeIds:c.places.map(p=>p.id),popularity:c.popularity});extraPlaces.set(c.id,c.places.map(p=>({id:p.id,cityId:c.id,name:p.name,categoryId:p.categoryId,kind:p.kind,fact:p.description,latitude:p.latitude??undefined,longitude:p.longitude??undefined,distanceKm:p.distanceKm??undefined,sitelinks:p.sitelinks,sourceCountryCode:p.countryCode,sourceUrl:p.sourceUrl,mapsUrl:p.mapsUrl,question:p.question,source:'Wikidata',details:p.details})));}
const loaders={AF:()=>import('../packages/core/src/catalogue/places-af.ts'),AS:()=>import('../packages/core/src/catalogue/places-as.ts'),EU:()=>import('../packages/core/src/catalogue/places-eu.ts'),NA:()=>import('../packages/core/src/catalogue/places-na.ts'),SA:()=>import('../packages/core/src/catalogue/places-sa.ts'),OC:()=>import('../packages/core/src/catalogue/places-oc.ts')};
const shardCache=new Map<WorldRegion,Promise<Record<string,WorldPlaceRow[]>>>();
const cityCache=new Map<TravelCityId,Promise<TravelPlace[]>>();
/** Web code-splits by continent; native ships the chunks for offline access. */
function fixturePlaces(id:TravelCityId):Promise<TravelPlace[]>{
 if(extraPlaces.has(id))return Promise.resolve(extraPlaces.get(id)!);
 const city=travelCityById(id);if(!city)return Promise.resolve([]);const cached=cityCache.get(id);if(cached)return cached;
 let shard=shardCache.get(city.continent);if(!shard){const region=city.continent;shard=region==='AN'?Promise.resolve({}):loaders[region]().then(m=>m.places);shardCache.set(region,shard);shard.catch(()=>shardCache.delete(region));}
 const result=shard.then(data=>{const sourced:TravelPlace[]=(data[id]??[]).map(r=>({id:r[0],cityId:id,name:r[1],categoryId:r[2],kind:r[3],fact:r[4]||`${r[3]} in the ${city.city} area.`,latitude:r[5],longitude:r[6],distanceKm:r[7],sitelinks:r[8],sourceCountryCode:r[9],question:`What’s your local tip for visiting ${r[1]}?`,sourceUrl:`https://www.wikidata.org/wiki/${r[0]}`,mapsUrl:`https://www.google.com/maps/search/?api=1&query=${r[5]},${r[6]}`,source:'Wikidata'}));const byId=new Map([...curatedTravelPlaces(id),...sourced].map(p=>[p.id,p]));return city.placeIds.map(key=>byId.get(key)).filter((p):p is TravelPlace=>!!p);});
 cityCache.set(id,result);result.catch(()=>cityCache.delete(id));return result;
}

configureTravelCatalogue(cities,fixturePlaces);
