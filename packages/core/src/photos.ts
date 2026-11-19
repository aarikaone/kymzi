import {countryById,type CountryId} from './countries.ts';
import {attractionsForCountry} from './attractions.ts';
import {passportWeek} from './passport.ts';
import {publicCityPals} from './visits.ts';
import {worldPlaces,uncoveredPlace} from './exploration.ts';
import type {AgeBand} from './types.ts';
import type {PreviewState} from './preview.ts';

/** @deprecated Legacy preview accounting. Current interfaces use MONTHLY_PHOTO_GOAL. */
export const WEEKLY_PHOTO_GOAL=3;
export const MAX_CITY_PHOTO_LENGTH=180_000;
export type CameraMoment={captureId:string;countryId:CountryId;image:string;capturedAt:string};
export type CityPhoto=CameraMoment & {id:string;ageBand:AgeBand;week:string;visibility:'private'|'pals';source:'camera'};
type PhotoCredit={captureId:string;week:string;ageBand:AgeBand;capturedAt?:string};
export type CityPhotosState={version:1;activityStartedMonth?:string;photos:CityPhoto[];credits:PhotoCredit[];seenIds:string[];hiddenIds:string[];savedIds:string[]};
export type CityPhotoItem={id:string;countryId:CountryId;alias:string;you:boolean;source:'camera'|'demo';image?:string;artworkId?:string};
export function emptyCityPhotos(now=new Date()):CityPhotosState{return {version:1,activityStartedMonth:cityPhotoMonth(now),photos:[],credits:[],seenIds:[],hiddenIds:[],savedIds:[]};}
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// Both camera adapters re-encode pixels. Also discard JPEG EXIF/IPTC/comments
// here so persisted photos cannot carry device, GPS or original timestamp tags.
export function cleanCityJpeg(image:string):string{
 if(typeof image!=='string'||image.length>MAX_CITY_PHOTO_LENGTH||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image))throw new Error('Take a new photo with the camera.');
 const raw=image.slice(23);if(raw.length%4)throw new Error('This photo could not be read.');
 const bytes:number[]=[];let bits=0,value=0;
 for(const c of raw){if(c==='=')break;value=(value<<6)|B64.indexOf(c);bits+=6;if(bits>=8){bits-=8;bytes.push((value>>bits)&255);}}
 if(bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw new Error('Take a new photo with the camera.');
 const out=[255,216];let i=2,scan=false;
 while(i<bytes.length-2){const start=i;if(bytes[i++]!==255)throw new Error('This photo could not be read.');while(bytes[i]===255)i++;const marker=bytes[i++];
  if(marker===218){out.push(...bytes.slice(start,i));for(;i<bytes.length;i++)out.push(bytes[i]);scan=true;break;}
  if(marker===216||marker===217||marker===0||marker===1||(marker>=208&&marker<=215))throw new Error('This photo could not be read.');
  const length=bytes[i]*256+bytes[i+1];if(length<2||i+length>bytes.length-2)throw new Error('This photo could not be read.');
  if(![225,237,254].includes(marker))for(let n=start;n<i+length;n++)out.push(bytes[n]);i+=length;
 }
 if(!scan)throw new Error('This photo could not be read.');
 let encoded='';for(let n=0;n<out.length;n+=3){const v=(out[n]<<16)|((out[n+1]??0)<<8)|(out[n+2]??0);encoded+=B64[(v>>>18)&63]+B64[(v>>>12)&63]+(n+1<out.length?B64[(v>>>6)&63]:'=')+(n+2<out.length?B64[v&63]:'=');}
 return 'data:image/jpeg;base64,'+encoded;
}
const bands=['10-12','13-15','16-17','18-20','21-24','25-30'];
const validBand=(x:unknown):x is AgeBand=>bands.includes(String(x));
export function readCityPhotos(value:unknown,now=new Date()):CityPhotosState{
 const raw=value as Partial<CityPhotosState>|null,s=emptyCityPhotos(now);if(!raw)return s;
 if(validMonth(raw.activityStartedMonth)&&raw.activityStartedMonth<=cityPhotoMonth(now))s.activityStartedMonth=raw.activityStartedMonth;
 for(const p of Array.isArray(raw.photos)?raw.photos:[]){try{if(p.source!=='camera'||!validBand(p.ageBand)||!countryById(p.countryId)||typeof p.captureId!=='string'||!p.captureId||p.captureId.length>100||!Number.isFinite(Date.parse(p.capturedAt))||s.photos.some(x=>x.captureId===p.captureId))continue;
  s.photos.push({id:'shot:'+p.captureId,captureId:p.captureId,countryId:p.countryId,image:cleanCityJpeg(p.image),capturedAt:new Date(p.capturedAt).toISOString(),ageBand:p.ageBand,week:passportWeek(new Date(p.capturedAt)),visibility:p.ageBand==='10-12'||p.visibility!=='pals'?'private':'pals',source:'camera'});
 }catch{}}
 s.credits=(Array.isArray(raw.credits)?raw.credits:[]).filter((c,i,all)=>c&&typeof c.captureId==='string'&&c.captureId.length<=100&&/^\d{4}-\d{2}-\d{2}$/.test(c.week)&&validBand(c.ageBand)&&all.findIndex(x=>x?.captureId===c.captureId)===i).slice(-300).map(c=>{const photo=s.photos.find(p=>p.captureId===c.captureId),at=typeof c.capturedAt==='string'&&Number.isFinite(Date.parse(c.capturedAt))?new Date(c.capturedAt).toISOString():photo?.capturedAt;return {captureId:c.captureId,week:c.week,ageBand:c.ageBand,...(at?{capturedAt:at}:{})};});
 for(const p of s.photos)if(!s.credits.some(c=>c.captureId===p.captureId))s.credits.push({captureId:p.captureId,week:p.week,ageBand:p.ageBand,capturedAt:p.capturedAt});
 s.photos=s.photos.slice(-12);
 for(const key of ['seenIds','hiddenIds','savedIds'] as const)s[key]=(Array.isArray(raw[key])?raw[key]:[]).filter((id):id is string=>typeof id==='string'&&id.length<200).slice(-500);
 return s;
}
/** @deprecated Kept for legacy clients; use photoMonthProgress for the current task. */
export function photoWeekProgress(state:PreviewState,now=new Date()){
 const week=passportWeek(now),count=state.photos.credits.filter(c=>c.week===week&&c.ageBand===state.profile?.ageBand).length;
 return {week,count,done:count>=WEEKLY_PHOTO_GOAL,remaining:Math.max(0,WEEKLY_PHOTO_GOAL-count),goal:WEEKLY_PHOTO_GOAL};
}
export function addCameraMoment(state:PreviewState,moment:CameraMoment,reviewed:boolean,now=new Date()):CityPhotosState{
 if(!state.profile)throw new Error('Choose your age group first.');
 if(!reviewed)throw new Error('Check that your photo has no faces or personal details.');
 if(!countryById(moment.countryId))throw new Error('Choose the city you are in.');
 if(!moment.captureId||moment.captureId.length>100)throw new Error('Take a new photo.');
 if(state.photos.credits.some(c=>c.captureId===moment.captureId))return state.photos;
 const at=Date.parse(moment.capturedAt);if(!Number.isFinite(at)||at>now.getTime()+30_000||at<now.getTime()-15*60_000)throw new Error('Take a fresh photo to add it.');
 const image=cleanCityJpeg(moment.image);if(state.photos.photos.some(p=>p.image===image&&p.ageBand===state.profile!.ageBand))throw new Error('This photo is already in your city. Take a new one.');
 const week=passportWeek(new Date(at)),ageBand=state.profile.ageBand;
 const photo:CityPhoto={captureId:moment.captureId,countryId:moment.countryId,image,capturedAt:new Date(at).toISOString(),id:'shot:'+moment.captureId,ageBand,week,visibility:ageBand==='10-12'?'private':'pals',source:'camera'};
 return {...state.photos,photos:[...state.photos.photos,photo].slice(-12),credits:[...state.photos.credits,{captureId:photo.captureId,week,ageBand,capturedAt:photo.capturedAt}].slice(-300)};
}
export function cityPhotoFeed(state:PreviewState,countryId?:CountryId,now=new Date()):CityPhotoItem[]{
 if(!state.profile)return [];
 const band=state.profile.ageBand;
 const own:CityPhotoItem[]=state.photos.photos.filter(p=>p.ageBand===band&&(!countryId||p.countryId===countryId)).slice().reverse().map(p=>({id:p.id,countryId:p.countryId,alias:'You',you:true,source:'camera',image:p.image}));
 if(band==='10-12')return own;
 const fixtures:CityPhotoItem[]=worldPlaces(state).filter(p=>p.uncovered&&(!countryId||p.country.id===countryId)).flatMap(p=>{
  const pals=publicCityPals(state,p.country.id),places=attractionsForCountry(p.country.id);
  return Array.from({length:pals.length?3:0},(_,i)=>({id:`demo-photo:${band}:${p.country.id}:${passportWeek(now)}:${i}`,countryId:p.country.id,alias:pals[i%pals.length]?.alias??'Pal',you:false,source:'demo' as const,artworkId:places[i].id}));
 });
 return [...own,...fixtures].filter(p=>!state.photos.hiddenIds.includes(p.id));
}
export function unseenCityPhotos(state:PreviewState,id:CountryId,now=new Date()){return cityPhotoFeed(state,id,now).filter(p=>!p.you&&!state.photos.seenIds.includes(p.id)).length;}
export function markCityPhotosSeen(state:PreviewState,id:CountryId,now=new Date()):CityPhotosState{
 return {...state.photos,seenIds:[...new Set([...state.photos.seenIds,...cityPhotoFeed(state,id,now).map(p=>p.id)])].slice(-500)};
}
export function removeCityPhoto(state:PreviewState,id:string):CityPhotosState{
 if(!state.photos.photos.some(p=>p.id===id&&p.ageBand===state.profile?.ageBand))throw new Error('This is not your photo.');
 return {...state.photos,photos:state.photos.photos.filter(p=>p.id!==id)};
}
export function hideCityPhoto(state:PreviewState,id:string):CityPhotosState{
 if(!cityPhotoFeed(state).some(p=>p.id===id&&!p.you))throw new Error('This photo is unavailable.');
 return {...state.photos,hiddenIds:[...new Set([...state.photos.hiddenIds,id])].slice(-500)};
}
export function privatizeCityPhotos(photos:CityPhotosState):CityPhotosState{return {...photos,photos:photos.photos.map(p=>({...p,visibility:'private'}))};}
export function canOpenCityPhotos(state:PreviewState,id:CountryId){return !!countryById(id)&&(uncoveredPlace(state,id).uncovered||state.photos.photos.some(p=>p.countryId===id&&p.ageBand===state.profile?.ageBand));}

// Gallery ordering stays finite and uses only the viewer's eligible photo feed.
// Interleave cities so browsing explores places rather than exhausting one city.
export function galleryPhotoFeed(state:PreviewState,countryId?:CountryId,now=new Date(),savedOnly=false):CityPhotoItem[]{
 const feed=cityPhotoFeed(state,countryId,now).filter(p=>!savedOnly||isCityPhotoSaved(state,p));
 if(countryId)return feed;
 const buckets=new Map<CountryId,CityPhotoItem[]>();
 for(const photo of feed){if(!buckets.has(photo.countryId))buckets.set(photo.countryId,[]);buckets.get(photo.countryId)!.push(photo);}
 const result:CityPhotoItem[]=[];
 while([...buckets.values()].some(items=>items.length))for(const items of buckets.values()){const photo=items.shift();if(photo)result.push(photo);}
 return result;
}
export function toggleCityPhotoSaved(state:PreviewState,id:string,now=new Date()):CityPhotosState{
 const photo=cityPhotoFeed(state,undefined,now).find(p=>p.id===id);
 if(!photo)throw new Error('This photo is unavailable.');
 const key=cityPhotoSaveKey(state,photo),ids=state.photos.savedIds??[];
 return {...state.photos,savedIds:ids.includes(key)?ids.filter(v=>v!==key):[...ids,key].slice(-300)};
}
function cityPhotoSaveKey(state:PreviewState,photo:CityPhotoItem){return `moment:${state.profile?.ageBand}:${photo.countryId}:${photo.artworkId??photo.id}`;}
export function isCityPhotoSaved(state:PreviewState,photo:CityPhotoItem){return (state.photos.savedIds??[]).includes(cityPhotoSaveKey(state,photo));}
export function markCityPhotoSeen(state:PreviewState,id:string,now=new Date()):CityPhotosState{
 if(state.photos.seenIds.includes(id)||!cityPhotoFeed(state,undefined,now).some(p=>p.id===id))return state.photos;
 return {...state.photos,seenIds:[...state.photos.seenIds,id].slice(-500)};
}

export const MONTHLY_PHOTO_GOAL=3;
export function cityPhotoMonth(date=new Date()):string{return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;}
const validMonth=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);

function creditedMonth(credit:PhotoCredit,photos:CityPhoto[]):string|undefined{
 const capturedAt=credit.capturedAt??photos.find(p=>p.captureId===credit.captureId)?.capturedAt;
 if(capturedAt&&Number.isFinite(Date.parse(capturedAt)))return cityPhotoMonth(new Date(capturedAt));
 // Legacy deleted shots only retained a Monday-based week. Credit a month
 // only when that whole week falls in it; never guess across a month boundary.
 const start=new Date(`${credit.week}T12:00:00`),end=new Date(start);
 if(!Number.isFinite(start.getTime()))return undefined;
 end.setDate(end.getDate()+6);
 return cityPhotoMonth(start)===cityPhotoMonth(end)?cityPhotoMonth(start):undefined;
}
export function photoMonthProgress(state:PreviewState,now=new Date()){
 const month=cityPhotoMonth(now),previous=cityPhotoMonth(new Date(now.getFullYear(),now.getMonth()-1,1)),next=new Date(now.getFullYear(),now.getMonth()+1,1),end=new Date(now.getFullYear(),now.getMonth()+1,0);
 const credits=state.photos.credits.filter(c=>c.ageBand===state.profile?.ageBand),homeCredits=(state.launch?.homeCredits??[]).filter(c=>c.ageBand===state.profile?.ageBand),count=new Set([...credits.filter(c=>creditedMonth(c,state.photos.photos)===month),...homeCredits.filter(c=>cityPhotoMonth(new Date(c.capturedAt))===month)].map(c=>c.captureId)).size,previousCount=new Set([...credits.filter(c=>creditedMonth(c,state.photos.photos)===previous),...homeCredits.filter(c=>cityPhotoMonth(new Date(c.capturedAt))===previous)].map(c=>c.captureId)).size;
 const storedStart=state.photos.activityStartedMonth,start=validMonth(storedStart)&&storedStart<=month?storedStart:month;
 const done=count>=MONTHLY_PHOTO_GOAL,active=!!state.profile&&(done||start===month||previousCount>=MONTHLY_PHOTO_GOAL);
 return {month,count,done,active,remaining:Math.max(0,MONTHLY_PHOTO_GOAL-count),goal:MONTHLY_PHOTO_GOAL,status:done?'renewed' as const:active?'due' as const:'paused' as const,
  monthLabel:now.toLocaleDateString('en',{month:'long'}),dueLabel:end.toLocaleDateString('en',{month:'short',day:'numeric'}),nextLabel:next.toLocaleDateString('en',{month:'short',day:'numeric'})};
}
