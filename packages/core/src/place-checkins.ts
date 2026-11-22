import {cleanCityJpeg} from './photos.ts';
import {profileDisplayName} from './profile-identity.ts';
import {circleFriends} from './receiver-preview.ts';
import {parseMapsPlaceLink,type MapsPlaceLink} from './map-links.ts';
import type {PlaceFavEvent} from './place-contributions.ts';
import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import {attractionsForCountry} from './attractions.ts';
import {palSummaries} from './pal-loop.ts';
import {placeCategory,type PlaceCategoryId} from './place-categories.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand,AvatarId} from './types.ts';
export const MONTHLY_CHECKIN_GOAL=3;
export const MAX_GEM_PHOTOS=5;
export type PlacePhoto={id:string;image:string};
export type PlaceLocation={city:string;country:string;area?:string;address?:string;placePin?:{latitude:number;longitude:number};countryCode?:string;source:'device'|'manual'|'maps'};
export type PlaceDraft={id:string;name:string;categoryId:PlaceCategoryId;location:PlaceLocation;illustration?:string;photos?:PlacePhoto[];sharedWith?:string[];maps?:MapsPlaceLink;tip?:string};
export type PlaceCheckIn=PlaceDraft & {checkedInAt:string;ageBand:AgeBand};
export type PlaceFavoriteAction={placeId:string;ownerId:string;actorId:string;active:boolean;at:string};
export type PlaceJournal={version:1;startedMonth:string;sharingStartedMonth?:string;receivedFavs?:PlaceFavEvent[];favHistory?:PlaceFavoriteAction[];entries:PlaceCheckIn[];savedIds:string[];seenIds:string[]};
export type PlaceFeedItem=PlaceCheckIn & {alias:string;you:boolean;peerId?:string;circleFriendId?:string;authorAvatar?:AvatarId;countryId?:CountryId;artworkId?:string;preview?:boolean};
export const checkInMonth=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
const monthValid=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export function emptyPlaceJournal(now=new Date()):PlaceJournal{return {version:1,startedMonth:checkInMonth(now),sharingStartedMonth:checkInMonth(now),entries:[],savedIds:[],seenIds:[]};}
const text=(value:unknown,max:number)=>typeof value==='string'?value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,max):'';
export function cleanPlaceLocation(value:unknown):PlaceLocation{
 const p=value as Partial<PlaceLocation>|null;
 const city=text(p?.city,80),country=text(p?.country,80),area=text(p?.area,100),countryCode=text(p?.countryCode,2).toUpperCase();
 if(!city||!country)throw new Error('Add the city and country.');
 const address=text(p?.address,180),latitude=p?.placePin?.latitude,longitude=p?.placePin?.longitude;
 if((latitude!==undefined||longitude!==undefined)&&!(typeof latitude==='number'&&Number.isFinite(latitude)&&Math.abs(latitude)<=90&&typeof longitude==='number'&&Number.isFinite(longitude)&&Math.abs(longitude)<=180))throw new Error('Choose a valid place location.');
 return {city,country,...(address?{address}:{}),...(latitude!==undefined&&longitude!==undefined?{placePin:{latitude,longitude}}:{}),...(area?{area}:{}),...(/^[A-Z]{2}$/.test(countryCode)?{countryCode}:{}),source:p?.source==='maps'?'maps':p?.source==='device'?'device':'manual'};
}
export function cleanPlaceDraft(raw:PlaceDraft):PlaceDraft{
 const id=text(raw.id,100),name=text(raw.name,80),tip=text(raw.tip,160);
 if(!id||!name)throw new Error('What is this place called?');
 if(!placeCategory(raw.categoryId))throw new Error('Choose a place category.');
 const illustration=typeof raw.illustration==='string'&&raw.illustration.length<=2_000_000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(raw.illustration)?raw.illustration:undefined;
 let photos:PlacePhoto[]|undefined;
 if(raw.photos!==undefined){if(!Array.isArray(raw.photos)||raw.photos.length>MAX_GEM_PHOTOS)throw new Error('Add up to 5 photos.');const ids=new Set<string>();photos=raw.photos.map(photo=>{const photoId=text(photo?.id,100);if(!photoId||ids.has(photoId))throw new Error('Choose another photo.');ids.add(photoId);return {id:photoId,image:cleanCityJpeg(photo.image)};});}
 return {id,name,categoryId:raw.categoryId,...(photos?.length?{photos}:{}),...(tip?{tip}:{}),...(Array.isArray(raw.sharedWith)?{sharedWith:[...new Set(raw.sharedWith.filter(id=>typeof id==='string'&&id.length<100))].slice(-100)}:{}),location:cleanPlaceLocation(raw.location),...(raw.maps?{maps:parseMapsPlaceLink(raw.maps.url)}:{}),...(illustration?{illustration}:{})};
}
function placeKey(p:PlaceDraft){return [p.name,p.location.city,p.location.country].map(x=>x.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ')).join('|');}
export function readPlaceJournal(value:unknown,now=new Date()):PlaceJournal{
 const raw=value as Partial<PlaceJournal>|null,s=emptyPlaceJournal(now);
 if(!raw)return s;
 if(monthValid(raw.startedMonth)&&raw.startedMonth<=checkInMonth(now))s.startedMonth=raw.startedMonth;
 for(const p of Array.isArray(raw.entries)?raw.entries:[]){try{
  if(!p||!['10-12','13-15','16-17','18-20','21-24','25-30'].includes(p.ageBand)||!Number.isFinite(Date.parse(p.checkedInAt))||Date.parse(p.checkedInAt)>now.getTime()+30_000||s.entries.some(e=>e.id===p.id))continue;
  s.entries.push({...cleanPlaceDraft(p),ageBand:p.ageBand,checkedInAt:new Date(p.checkedInAt).toISOString()});
 }catch{}}
 s.entries=s.entries.slice(-500);
 if(monthValid(raw.sharingStartedMonth)&&raw.sharingStartedMonth<=checkInMonth(now))s.sharingStartedMonth=raw.sharingStartedMonth;
 const events=new Map<string,PlaceFavEvent>();for(const e of Array.isArray(raw.receivedFavs)?raw.receivedFavs:[]){if(e&&typeof e.placeId==='string'&&typeof e.palId==='string'&&typeof e.active==='boolean'&&Number.isFinite(Date.parse(e.at)))events.set(e.placeId+'|'+e.palId,{placeId:e.placeId,palId:e.palId,active:e.active,at:e.at});}if(events.size)s.receivedFavs=[...events.values()].slice(-1000);
 const history=Array.isArray(raw.favHistory)?raw.favHistory:[];
 s.favHistory=history.filter(e=>e&&['placeId','ownerId','actorId'].every(k=>typeof e[k as keyof PlaceFavoriteAction]==='string'&&(e[k as keyof PlaceFavoriteAction] as string).length<=220)&&typeof e.active==='boolean'&&Number.isFinite(Date.parse(e.at))&&Date.parse(e.at)<=now.getTime()+30000).slice(-20000).map(e=>({placeId:e.placeId,ownerId:e.ownerId,actorId:e.actorId,active:e.active,at:new Date(e.at).toISOString()}));
 for(const key of ['savedIds','seenIds'] as const)s[key]=[...new Set((Array.isArray(raw[key])?raw[key]:[]).filter((id):id is string=>typeof id==='string'&&id.length<=220))].slice(-500);
 return s;
}
export function ownPlaceCheckIns(state:PreviewState){return (state.placeJournal?.entries??[]).filter(e=>e.ageBand===state.profile?.ageBand).slice().reverse();}
export function checkInMonthProgress(state:PreviewState,now=new Date()){
 const month=checkInMonth(now),previous=checkInMonth(new Date(now.getFullYear(),now.getMonth()-1,1)),entries=ownPlaceCheckIns(state);
 const countAt=(m:string)=>new Set(entries.filter(e=>checkInMonth(new Date(e.checkedInAt))===m).map(placeKey)).size;
 const count=countAt(month),start=state.placeJournal?.startedMonth??month,done=count>=3,active=!!state.profile&&(done||start===month||countAt(previous)>=3);
 return {month,count,goal:3,remaining:Math.max(0,3-count),done,active,monthLabel:now.toLocaleDateString('en',{month:'long'}),dueLabel:new Date(now.getFullYear(),now.getMonth()+1,0).toLocaleDateString('en',{month:'short',day:'numeric'}),nextLabel:new Date(now.getFullYear(),now.getMonth()+1,1).toLocaleDateString('en',{month:'short',day:'numeric'})};
}
export function confirmPlaceCheckIn(state:PreviewState,draft:PlaceDraft,now=new Date()):PreviewState{
 if(!state.profile)throw new Error('Create your profile first.');
 const journal=state.placeJournal??emptyPlaceJournal(now),entry=cleanPlaceDraft(draft);
 if(journal.entries.some(e=>e.id===entry.id))return state;
 const duplicate=ownPlaceCheckIns(state).some(e=>checkInMonth(new Date(e.checkedInAt))===checkInMonth(now)&&placeKey(e)===placeKey(entry));
 if(duplicate)throw new Error('This place is already checked in this month. Try somewhere new.');
 return {...state,placeJournal:{...journal,entries:[...journal.entries,{...entry,ageBand:state.profile.ageBand,checkedInAt:now.toISOString()}].slice(-120)}};
}
export function placeCountryId(p:PlaceDraft):CountryId|undefined{return COUNTRIES.find(c=>c.city.toLowerCase()===p.location.city.toLowerCase()&&(c.name.toLowerCase()===p.location.country.toLowerCase()||c.id===p.location.countryCode))?.id;}
export function placeCheckInFeed(state:PreviewState,countryId?:CountryId,now=new Date()):PlaceFeedItem[]{
 if(!state.profile)return [];
 const own=ownPlaceCheckIns(state).map(p=>({...p,alias:'You',you:true,countryId:placeCountryId(p)}));
 const pals=state.profile.ageBand==='10-12'?[]:palSummaries(state);
 const examples:PlaceFeedItem[]=pals.flatMap((pal,i)=>{
  const attraction=attractionsForCountry(pal.countryId)[i%4],country=countryById(pal.countryId)!;
  return [{id:`pal-place:${state.profile!.ageBand}:${pal.id}:${attraction.id}`,name:attraction.name,categoryId:attraction.kind.toLowerCase().includes('park')?'park':'attraction',location:{city:country.city,country:country.name,countryCode:country.id,source:'manual'},checkedInAt:new Date(now.getTime()-(i+1)*3_600_000).toISOString(),ageBand:state.profile!.ageBand,alias:pal.alias,you:false,peerId:pal.id,countryId:pal.countryId,artworkId:attraction.id,maps:parseMapsPlaceLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name+', '+country.city+', '+country.name)}`),preview:true}];
 });
 const circle:PlaceFeedItem[]=circleFriends(state).map(friend=>{
  const attraction=attractionsForCountry(friend.countryId)[0];
  return {id:`circle-place:${state.profile!.ageBand}:${friend.name}:${attraction.id}`,name:attraction.name,categoryId:'attraction',location:{city:friend.city,country:friend.country,countryCode:friend.countryId,source:'manual'},checkedInAt:friend.connectedAt,ageBand:state.profile!.ageBand,alias:profileDisplayName(friend),you:false,circleFriendId:friend.id,authorAvatar:friend.avatar,countryId:friend.countryId,artworkId:attraction.id,maps:parseMapsPlaceLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name+', '+friend.city+', '+friend.country)}`),preview:true};
 });
 return [...own,...circle,...examples].filter(p=>!countryId||p.countryId===countryId);
}
export function isPlaceFavorite(state:PreviewState,id:string){return (state.placeJournal?.savedIds??[]).includes(`${state.profile?.ageBand}:${id}`);}
export function favoritePlaces(state:PreviewState,now=new Date()){return placeCheckInFeed(state,undefined,now).filter(p=>isPlaceFavorite(state,p.id));}
export function togglePlaceFavorite(state:PreviewState,id:string,now=new Date()):PreviewState{
 const place=placeCheckInFeed(state,undefined,now).find(p=>p.id===id);if(!place)throw new Error('This place is unavailable.');
 const journal=state.placeJournal??emptyPlaceJournal(now),key=`${state.profile?.ageBand}:${id}`,ids=journal.savedIds;
 const history=journal.favHistory??[],wasSaved=ids.includes(key),baseline=place.peerId&&wasSaved&&!history.some(e=>e.placeId===id&&e.ownerId===place.peerId&&e.actorId==='you')?[{placeId:id,ownerId:place.peerId,actorId:'you',active:false,at:now.toISOString()}]:[];
 const favHistory=place.peerId?[...history,...baseline,{placeId:id,ownerId:place.peerId,actorId:'you',active:!wasSaved,at:now.toISOString()}].slice(-20000):history;
 return {...state,placeJournal:{...journal,favHistory,savedIds:wasSaved?ids.filter(x=>x!==key):[...ids,key].slice(-500)}};
}
export function removePlaceCheckIn(state:PreviewState,id:string):PreviewState{
 if(!ownPlaceCheckIns(state).some(p=>p.id===id))throw new Error('This is not your check-in.');
 const journal=state.placeJournal!;return {...state,placeJournal:{...journal,entries:journal.entries.filter(e=>e.id!==id)}};
}
export function placeInterests(state:PreviewState,now=new Date()){
 const scores=new Map<PlaceCategoryId,number>();
 for(const p of placeCheckInFeed(state,undefined,now)){const points=(p.you?2:0)+(isPlaceFavorite(state,p.id)?1:0);if(points)scores.set(p.categoryId,(scores.get(p.categoryId)??0)+points);}
 return [...scores].sort((a,b)=>b[1]-a[1]).map(([id,score])=>({category:placeCategory(id)!,score}));
}
export function unseenPlaceCheckIns(state:PreviewState,id:CountryId,now=new Date()){return placeCheckInFeed(state,id,now).filter(p=>!p.you&&!(state.placeJournal?.seenIds??[]).includes(p.id)).length;}
export function markPlaceCheckInsSeen(state:PreviewState,id:CountryId,now=new Date()):PreviewState{const journal=state.placeJournal??emptyPlaceJournal(now);return {...state,placeJournal:{...journal,seenIds:[...new Set([...journal.seenIds,...placeCheckInFeed(state,id,now).map(p=>p.id)])].slice(-500)}};}
