import {getApps,initializeApp} from 'firebase/app';
import {collection,doc,documentId,getDoc,getDocs,getFirestore,limit,orderBy,query,startAfter,type DocumentData,type QueryDocumentSnapshot} from 'firebase/firestore/lite';
import {configureCdnOrigin,isCatalogueImageUrl,configurePublicImages,configureTravelCatalogue,registerCatalogueImages,travelCityById,type CatalogueImage,type TravelCity,type TravelCityId,type TravelPlace,type WorldRegion,type PlaceCategoryId,type TravelPopularity} from '@rymzi/core';
import {firebaseConfig} from './firebase-config.ts';
import {withRequestTimeout} from './request-timeout.ts';

const app=getApps().find(app=>app.name==='kymzi')??initializeApp(firebaseConfig,'kymzi');
export const kymziDatabase=getFirestore(app);
const parents=new Map<string,TravelCityId>();
let connection:Promise<void>|undefined;
const flag=(iso:string)=>String.fromCodePoint(...iso.toUpperCase().split('').map(c=>127397+c.charCodeAt(0)));
const number=(value:unknown,fallback=0)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
const strings=(value:unknown):string[]=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[];
function image(data:DocumentData):CatalogueImage|null{
 const value=data.image,url=data.cdnImageUrl??data.imageUrl;if(!value||!isCatalogueImageUrl(url))return null;
 return {...value,url} as CatalogueImage;
}
function cityFromDocument(snapshot:QueryDocumentSnapshot):TravelCity{
 const c=snapshot.data();if(typeof c.city!=='string'||!Array.isArray(c.placeIds)||c.placeIds.length===0)throw Error('City catalogue needs updating.');
 const popularity=c.popularity&&Number.isFinite(c.popularity.score)&&Number.isInteger(c.popularity.rank)?c.popularity as TravelPopularity:undefined;
 return {popularity,description:typeof c.description==='string'?c.description:undefined,wikidataId:typeof c.wikidataId==='string'?c.wikidataId:undefined,wikipediaUrl:typeof c.wikipediaUrl==='string'?c.wikipediaUrl:undefined,wikivoyageUrl:typeof c.wikivoyageUrl==='string'?c.wikivoyageUrl:undefined,id:snapshot.id as TravelCityId,geonameId:number(c.geonameId),city:c.city,name:c.country,countryCode:c.countryCode,flag:flag(c.countryCode),region:c.region??'',continent:c.continent as WorldRegion,latitude:number(c.latitude),longitude:number(c.longitude),timeZone:c.timeZone,population:number(c.population),placeIds:strings(c.placeIds),aliases:strings(c.aliases),sourceUrl:c.citySourceUrl};
}
async function readCityPlaces(id:TravelCityId):Promise<TravelPlace[]>{
 const city=travelCityById(id);if(!city)return [];
 const result=await withRequestTimeout(getDocs(collection(kymziDatabase,'cities',id,'attractions')));
 const rows=result.docs.map(snapshot=>{
  const p=snapshot.data(),kind=p.kind??'Attraction';
  const category=p.categoryId??(/nature|conservation/i.test(kind)?'park':/coast/i.test(kind)?'beach':/art|history|science/i.test(kind)?'museum':/culture|heritage/i.test(kind)?'temple':/skyline|architecture|landmark/i.test(kind)?'landmark':'attraction');
  return {details:p.details&&typeof p.details.description==='string'&&Array.isArray(p.details.facts)&&Array.isArray(p.details.credits)?p.details:undefined,id:snapshot.id,cityId:id,name:p.name,categoryId:category as PlaceCategoryId,kind,fact:p.description??'',question:p.question??`What’s your local tip for ${p.name}?`,sourceUrl:p.sourceUrl,mapsUrl:p.mapsUrl,latitude:typeof p.latitude==='number'?p.latitude:undefined,longitude:typeof p.longitude==='number'?p.longitude:undefined,distanceKm:typeof p.distanceKm==='number'?p.distanceKm:undefined,sitelinks:p.sitelinks,sourceCountryCode:p.countryCode??city.countryCode,source:p.source==='Wikidata'?'Wikidata':'Curated guide'} as TravelPlace;
 });
 registerCatalogueImages(result.docs.map(snapshot=>[`place/${snapshot.id}`,image(snapshot.data())]));
 const byId=new Map(rows.map(place=>[place.id,place]));return city.placeIds.map(key=>byId.get(key)).filter((place):place is TravelPlace=>!!place);
}
async function readCitySummaries(){
 const snapshots:QueryDocumentSnapshot[]=[];let cursor:QueryDocumentSnapshot|undefined;
 // Bounded reads: city summaries first, never all attraction documents.
 for(;;){
  const constraints=cursor?[orderBy(documentId()),startAfter(cursor),limit(300)]:[orderBy(documentId()),limit(300)];
  const page=await withRequestTimeout(getDocs(query(collection(kymziDatabase,'cities'),...constraints)));snapshots.push(...page.docs);
  if(page.size<300)break;cursor=page.docs[page.docs.length-1];
 }
 return snapshots;
}
async function connect(){
 const [config,snapshots]=await Promise.all([withRequestTimeout(getDoc(doc(kymziDatabase,'appConfig','public'))),readCitySummaries()]);
 if(!config.exists())throw Error('Kymzi artwork settings are unavailable.');
 configureCdnOrigin(config.data().cdnOrigin);
 const raw=config.data().publicCdnImages??config.data().publicImages;if(!raw||typeof raw!=='object')throw Error('Kymzi artwork settings are unavailable.');
 const urls:Record<string,string>={};for(const [path,url] of Object.entries(raw))if(isCatalogueImageUrl(url))urls[path]=url;
 const cities=snapshots.sort((a,b)=>number(a.data().catalogueOrder)-number(b.data().catalogueOrder)).map(cityFromDocument);
 if(!cities.length)throw Error('Kymzi cities are unavailable.');
 parents.clear();for(const city of cities)for(const id of city.placeIds)parents.set(id,city.id);
 configurePublicImages(urls);registerCatalogueImages(snapshots.map(snapshot=>[`city/${snapshot.id}`,image(snapshot.data())]));
 configureTravelCatalogue(cities,readCityPlaces);
}
/** One shared bootstrap survives StrictMode mounts, remounts and retry clicks. */
export function connectKymzi(){if(!connection){connection=connect().catch(error=>{connection=undefined;throw error;});}return connection;}
export function cityForAttraction(id:string){return parents.get(id);}
