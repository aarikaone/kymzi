import {cleanCityJpeg} from './photos.ts';
import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import type {CitySelection,TravelProfile} from './travel-profile.ts';

export const MAX_VISITED_PHOTOS=12;
export type VisitedPhoto={id:string;cityId:TravelCityId;placeId?:string;image:string;addedAt:string};
export type VisitedAlbum={id:string;cityId:TravelCityId;placeId?:string;photos:VisitedPhoto[]};
const imageCache=new Map<string,string>();
function cleanImage(image:string){
 const cached=imageCache.get(image);if(cached)return cached;
 const clean=cleanCityJpeg(image);if(imageCache.size>=MAX_VISITED_PHOTOS)imageCache.delete(imageCache.keys().next().value!);
 imageCache.set(image,clean);return clean;
}
export function readVisitedPhotos(value:unknown,visited:CitySelection[]):VisitedPhoto[]{
 const out:VisitedPhoto[]=[];
 for(const raw of Array.isArray(value)?value.slice(-MAX_VISITED_PHOTOS):[]){try{
  if(!raw||typeof raw.id!=='string'||!/^memory-[a-zA-Z0-9-]{1,90}$/.test(raw.id)||out.some(p=>p.id===raw.id)||typeof raw.addedAt!=='string'||!Number.isFinite(Date.parse(raw.addedAt)))continue;
  const city=visited.find(c=>c.cityId===raw.cityId);if(!city||raw.placeId!==undefined&&!city.attractionIds.includes(raw.placeId))continue;
  const image=cleanImage(raw.image);if(out.some(p=>p.image===image))continue;
  out.push({id:raw.id,cityId:city.cityId,...(raw.placeId?{placeId:raw.placeId}:{}),image,addedAt:new Date(raw.addedAt).toISOString()});
 }catch{}}
 return out;
}
export function addVisitedPhoto(travel:TravelProfile,cityId:TravelCityId,image:string,placeId?:string,now=new Date()):TravelProfile{
 const city=travel.visited.find(c=>c.cityId===cityId);if(!city||placeId&&!city.attractionIds.includes(placeId))throw new Error('Add this visited place first.');
 const photos=readVisitedPhotos(travel.memories,travel.visited);if(photos.length>=MAX_VISITED_PHOTOS)throw new Error('Your device album is full. Remove a photo to add another.');
 const clean=cleanImage(image);if(photos.some(p=>p.image===clean))throw new Error('This photo is already in your memories.');
 return {...travel,memories:[...photos,{id:`memory-${now.getTime()}-${Math.random().toString(36).slice(2,10)}`,cityId,...(placeId?{placeId}:{}),image:clean,addedAt:now.toISOString()}]};
}
export function removeVisitedPhoto(travel:TravelProfile,id:string):TravelProfile{
 const {memories:_,...rest}=travel,memories=(travel.memories??[]).filter(p=>p.id!==id);return {...rest,...(memories.length?{memories}:{})};
}
export function visitedPhotoAlbums(travel?:TravelProfile):VisitedAlbum[]{
 const groups=new Map<string,VisitedAlbum>();
 for(const p of (travel?.memories??[]).slice().sort((a,b)=>Date.parse(b.addedAt)-Date.parse(a.addedAt))){if(!travelCityById(p.cityId))continue;const id=`${p.cityId}:${p.placeId??'city'}`,album=groups.get(id)??{id,cityId:p.cityId,...(p.placeId?{placeId:p.placeId}:{}),photos:[]};album.photos.push(p);groups.set(id,album);}
 return [...groups.values()];
}
