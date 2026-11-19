import type { AgeBand, AvatarId, Match, Profile } from './types.ts';
import type { DailyGame } from './daily.ts';

// The country and city catalog belongs to the fictional preview crew.
import {COUNTRIES,countryById,type CityArtId,type DestinationCityId} from './countries.ts';
export type City={id:DestinationCityId;name:string;code:string;country:string;flag:string;continent:string;color:string;ink:string;x:number;y:number;motif:string;artId:CityArtId|null};
export const CITIES:City[]=COUNTRIES.map(c=>({id:c.cityId,name:c.city,code:c.code,country:c.name,flag:c.flag,continent:c.continent,color:c.color,ink:c.ink,x:c.x,y:c.y,motif:c.motif,artId:c.artId}));
export type CityId=DestinationCityId;
export type CoverId = 'midnight'|'lilac'|'sunset';
export type Journey = {id:string;at:string;cityId:CityId|null;shared:number;source:'demo-match'|'private-trip'|'ink'};
export type PassportState = {version:1;journeys:Journey[];cover:CoverId};
export const CITY_SETS = [
  {id:'night',name:'After hours',symbol:'☾',cities:['tokyo','seoul','london'] as CityId[]},
  {id:'ocean',name:'Ocean minds',symbol:'≈',cities:['rio','mumbai','toronto'] as CityId[]},
] as const;
export const COVERS = [
  {id:'midnight',name:'Midnight',color:'#171624',requirement:'Yours'},
  {id:'lilac',name:'Lilac skies',color:'#c8beff',requirement:'3 ink'},
  {id:'sunset',name:'Golden hour',color:'#ffcfaa',requirement:'Ocean minds'},
] as const;
export function emptyPassport():PassportState{return {version:1,journeys:[],cover:'midnight'};}
export function cityById(id:unknown):City|undefined{return CITIES.find(c=>c.id===id);}
export function cityForCountry(country:string):City|undefined{return CITIES.find(c=>c.country===country);}
export function readPassport(value:unknown):PassportState{
  const raw=value as Partial<PassportState>|null;
  if(!raw||typeof raw!=='object')return emptyPassport();
  const journeys:Journey[]=[],seen=new Set<string>();
  for(const item of Array.isArray(raw.journeys)?raw.journeys:[]){
    if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.at!=='string'||!Number.isFinite(Date.parse(item.at)))continue;
    const shared=Number.isInteger(item.shared)?item.shared:-1,city=cityById(item.cityId);
    if(item.source==='ink'&&item.cityId===null&&shared===0){journeys.push({id:item.id,at:item.at,cityId:null,shared:0,source:'ink'});seen.add(item.id);}
    else if(city&&((item.source==='demo-match'&&shared>=1&&shared<=3)||(item.source==='private-trip'&&shared===0))){journeys.push({id:item.id,at:item.at,cityId:city.id,shared,source:item.source});seen.add(item.id);}
  }
  const state:PassportState={version:1,journeys,cover:'midnight'};
  if(COVERS.some(c=>c.id===raw.cover)&&coverUnlocked(state,raw.cover!))state.cover=raw.cover!;
  return state;
}
export function passportStamps(passport:PassportState){
  return CITIES.flatMap(city=>{
    const trips=passport.journeys.filter(j=>j.cityId===city.id);
    return trips.length?[{city,visits:trips.length,perfect:trips.some(j=>j.shared===3),firstAt:trips[0].at,lastAt:trips.at(-1)!.at}]:[];
  });
}
export function passportStats(passport:PassportState){const stamps=passportStamps(passport);return {cities:stamps.length,countries:new Set(stamps.map(s=>s.city.country)).size,continents:new Set(stamps.map(s=>s.city.continent)).size,ink:passport.journeys.length,perfect:stamps.filter(s=>s.perfect).length};}
export function setProgress(passport:PassportState,id:string){const set=CITY_SETS.find(s=>s.id===id);if(!set)return {count:0,total:0,complete:false};const owned=new Set(passportStamps(passport).map(s=>s.city.id)),count=set.cities.filter(c=>owned.has(c)).length;return {count,total:set.cities.length,complete:count===set.cities.length};}
export function coverUnlocked(passport:PassportState,cover:CoverId):boolean{return cover==='midnight'||(cover==='lilac'&&passport.journeys.length>=3)||(cover==='sunset'&&setProgress(passport,'ocean').complete);}
export function selectPassportCover(passport:PassportState,cover:CoverId):PassportState{return coverUnlocked(passport,cover)?{...passport,cover}:passport;}
export function recordJourney(passport:PassportState,game:DailyGame,band:AgeBand,matches:Match[]):PassportState{
  if(!game.lastCompletedAt||!Number.isFinite(Date.parse(game.lastCompletedAt))||game.lastQuestionIds.length!==3||game.played<1||game.active)return passport;
  const id=`${game.played}:${game.lastCompletedAt}:${game.lastQuestionIds.join('.')}`;
  if(passport.journeys.some(j=>j.id===id))return passport;
  const owned=new Set(passportStamps(passport).map(s=>s.city.id));
  let city:City|undefined,shared=0,source:Journey['source']='ink';
  if(band==='10-12'){
    city=cityById(countryById(game.lastCountryId)?.cityId)??CITIES.find(c=>!owned.has(c.id))??CITIES[(game.played-1)%CITIES.length];source='private-trip';
  }else{
    const eligible=matches.filter(m=>m.peer.ageBand===band&&m.total===3&&m.shared>=1&&m.shared<=3&&m.sharedIds.length===m.shared&&m.sharedIds.every(id=>game.lastQuestionIds.includes(id))&&cityForCountry(m.peer.country));
    eligible.sort((a,b)=>b.shared-a.shared||Number(owned.has(cityForCountry(a.peer.country)!.id))-Number(owned.has(cityForCountry(b.peer.country)!.id))||a.peer.id.localeCompare(b.peer.id));
    const match=eligible[0];if(match){city=cityForCountry(match.peer.country);shared=match.shared;source='demo-match';}
  }
  return {...passport,journeys:[...passport.journeys,{id,at:game.lastCompletedAt,cityId:city?.id??null,shared,source}]};
}
export function latestJourney(passport:PassportState):Journey|undefined{return passport.journeys.at(-1);}
export function journeyIsNew(passport:PassportState,journey:Journey):boolean{return !!journey.cityId&&!passport.journeys.slice(0,passport.journeys.findIndex(j=>j.id===journey.id)).some(j=>j.cityId===journey.cityId);}
export function passportWeek(now=new Date()):string{const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;}
export function weeklyCityCount(passport:PassportState,now=new Date()):number{return new Set(passport.journeys.filter(j=>j.cityId&&Date.parse(j.at)<=now.getTime()&&passportWeek(new Date(j.at))===passportWeek(now)).map(j=>j.cityId)).size;}
const crew=[{name:'Luna',avatar:'cloud'},{name:'Rio',avatar:'sunny'},{name:'Ash',avatar:'sprout'},{name:'Kai',avatar:'orbit'},{name:'Noor',avatar:'cloud'},{name:'Mika',avatar:'sunny'}] as const;
export type CrewRow={id:string;name:string;avatar:AvatarId;cities:number;rank:number;you:boolean};
export function weeklyCrew(passport:PassportState,profile:Profile,now=new Date()):CrewRow[]{
  if(profile.ageBand==='10-12')return [];
  const week=passportWeek(now),seed=[...`${week}:${profile.ageBand}`].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
  const rows:Omit<CrewRow,'rank'>[]=crew.map((p,i)=>({id:p.name.toLowerCase(),...p,cities:(seed+i*7)%7,you:false}));
  rows.push({id:'you',name:'You',avatar:profile.avatar,cities:weeklyCityCount(passport,now),you:true});
  return rows.sort((a,b)=>b.cities-a.cities||Number(b.you)-Number(a.you)||a.id.localeCompare(b.id)).map(row=>({...row,rank:1+rows.filter(other=>other.cities>row.cities).length}));
}
