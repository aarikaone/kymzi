import {comingHomeVisit,palVisitLabels} from './global-pals.ts';
import {palSummaries,palMeetingStatus} from './pal-loop.ts';
import {worldPlaces} from './exploration.ts';
import {placeCheckInFeed} from './place-checkins.ts';
import {passportWeek} from './passport.ts';
import {isAdult} from './social.ts';
import {cityUpdates,publicCityPals,cityToday,plusCityDays,visitDates,sharedPalVisits} from './visits.ts';
import type {CountryId} from './countries.ts';
import type {PreviewState} from './preview.ts';

export type PalInboxState={version:1;readIds:string[]};
export type PalUpdate={id:string;kind:'place'|'photo'|'visit'|'check-in'|'meetup';countryId:CountryId;title:string;detail:string;artworkId?:string;photoId?:string;peerId?:string;target:'photos'|'board'|'pal-meet'|'pal';read:boolean;demo:boolean};
export function emptyPalInbox():PalInboxState{return {version:1,readIds:[]};}
export function readPalInbox(value:unknown):PalInboxState{const raw=value as Partial<PalInboxState>|null;return {version:1,readIds:Array.isArray(raw?.readIds)?[...new Set(raw.readIds.filter((id):id is string=>typeof id==='string'&&id.length<220))].slice(-1000):[]};}
export function palUpdates(state:PreviewState,now=new Date()):PalUpdate[]{
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const band=state.profile.ageBand,readIds=state.palInbox?.readIds??[],week=passportWeek(now),result:PalUpdate[]=[];
 for(const place of worldPlaces(state).filter(p=>p.uncovered)){
  const places=placeCheckInFeed(state,place.country.id,now).filter(p=>!p.you);
  if(places.length){const id=`pal-places:${band}:${place.country.id}:${week}`;result.push({id,kind:'place',countryId:place.country.id,title:`New places in ${place.country.city}.`,detail:`${places[0].alias} shared ${places[0].name}`,artworkId:places[0].artworkId,photoId:places[0].id,target:'photos',read:readIds.includes(id),demo:true});}
 }
 if(isAdult(band))for(const plan of sharedPalVisits(state,now)){const id=`pal-visit:${band}:${plan.countryId}:${week}`;result.push({id,kind:'visit',countryId:plan.countryId,title:`${plan.alias} shared a visit.`,detail:visitDates(plan),target:'board',read:readIds.includes(id),demo:true});}
 const circle:PalUpdate[]=placeCheckInFeed(state,undefined,now).filter(p=>p.circleFriendId&&p.countryId).map(place=>{
  const id=`circle-update:${place.id}`;
  return {id,kind:'place',countryId:place.countryId!,title:`${place.alias} shared a place.`,detail:`${place.name} · ${place.location.city}`,artworkId:place.artworkId,photoId:place.id,target:'photos',read:readIds.includes(id),demo:true};
 });
 const own=cityUpdates(state).map(n=>({id:`local:${n.id}`,kind:n.kind==='check-in'?'check-in' as const:n.kind.startsWith('meet')?'meetup' as const:'visit' as const,countryId:n.countryId,title:n.text,detail:'Your city activity',target:'board' as const,read:n.read||readIds.includes(`local:${n.id}`),demo:true}));
 const meetings=isAdult(band)?state.social.meetups.filter(m=>m.spotId).flatMap(m=>{const p=palSummaries(state).find(p=>p.id===m.peerId);if(!p)return [];const status=palMeetingStatus(state,m,now),id=`pal-meeting:${m.id}:${status}`;return [{id,kind:'meetup' as const,countryId:p.countryId,title:status==='confirmed'?`${p.alias} · Meeting agreed.`:status==='proposed'?`${p.alias} · Meeting spot shared.`:`${p.alias} · Meeting ${status}.`,detail:'Public meeting spot',peerId:m.peerId,target:'pal-meet' as const,read:readIds.includes(id),demo:true}];}):[];
 const visit=comingHomeVisit(state,now),labels=visit?palVisitLabels(visit):null,id=visit?`home-pal-visit:${visit.id}:${visit.arrivesAt}`:'';const incoming:PalUpdate[]=visit?[{id,kind:'visit',countryId:visit.pal.countryId,title:`${visit.pal.alias} is coming to ${visit.city}`,detail:`${labels!.date} · ${labels!.time} · ${labels!.zone} · Travel preview`,peerId:visit.peerId,target:'pal',read:readIds.includes(id),demo:true}]:[];
 return [...incoming,...circle,...meetings,...own,...result];
}
export function readPalUpdates(state:PreviewState,ids?:string[],now=new Date()):PreviewState{
 const allowed=palUpdates(state,now),selected=new Set(ids??allowed.map(n=>n.id));
 const valid=allowed.filter(n=>selected.has(n.id)).map(n=>n.id);
 return {...state,palInbox:{version:1,readIds:[...new Set([...(state.palInbox?.readIds??[]),...valid])].slice(-1000)},visits:{...state.visits,notices:state.visits.notices.map(n=>selected.has(`local:${n.id}`)?{...n,read:true}:n)}};
}
export function unreadPalUpdates(state:PreviewState,now=new Date()){return palUpdates(state,now).filter(n=>!n.read).length;}
