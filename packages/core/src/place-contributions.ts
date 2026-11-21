import {checkInMonth,ownPlaceCheckIns,emptyPlaceJournal,cleanPlaceDraft,isPlaceFavorite,placeCheckInFeed,type PlaceDraft,type PlaceCheckIn} from './place-checkins.ts';
import {parseMapsPlaceLink,normalizedPlaceText} from './map-links.ts';
import {palFor,palSummaries} from './pal-loop.ts';
import type {PreviewState} from './preview.ts';
export const MONTHLY_PLACE_SHARE_GOAL=15;
export type PlaceFavEvent={placeId:string;palId:string;active:boolean;at:string};
function nameKey(p:PlaceDraft){return [p.name,p.location.city,p.location.country].map(normalizedPlaceText).join('|');}
/** The first publication owns credit. Reposts and URL aliases never mint another place. */
export function sharedMapPlaces(state:PreviewState){
 const maps=new Set<string>(),names=new Set<string>(),entries:PlaceCheckIn[]=[];
 for(const p of ownPlaceCheckIns(state).slice().reverse()){
  if(!p.maps)continue;const key=nameKey(p);
  if(maps.has(p.maps.identity)||names.has(key))continue;maps.add(p.maps.identity);names.add(key);entries.push(p);
 }
 return entries.reverse();
}
/** @deprecated Historic monthly statistics. Task uses gemImpact; these never gate access. */
export function shareTaskProgress(state:PreviewState,now=new Date()){
 const month=checkInMonth(now),previous=checkInMonth(new Date(now.getFullYear(),now.getMonth()-1,1)),entries=sharedMapPlaces(state),count=entries.filter(p=>checkInMonth(new Date(p.checkedInAt))===month).length,previousCount=entries.filter(p=>checkInMonth(new Date(p.checkedInAt))===previous).length,goal=MONTHLY_PLACE_SHARE_GOAL,start=state.placeJournal?.sharingStartedMonth??month,done=count>=goal;
 return {month,count,goal,remaining:Math.max(0,goal-count),done,active:!!state.profile&&(done||start===month||previousCount>=goal),monthLabel:now.toLocaleDateString('en',{month:'long'}),dueLabel:new Date(now.getFullYear(),now.getMonth()+1,0).toLocaleDateString('en',{month:'short',day:'numeric'}),nextLabel:new Date(now.getFullYear(),now.getMonth()+1,1).toLocaleDateString('en',{month:'short',day:'numeric'})};
}
export function publishMapsPlace(state:PreviewState,draft:PlaceDraft,now=new Date()):PreviewState{
 if(!state.profile)throw new Error('Create your profile first.');
 if(!draft.maps)throw new Error('Add a place link from Maps.');
 const entry=cleanPlaceDraft({...draft,maps:parseMapsPlaceLink(draft.maps.url),location:{...draft.location,source:'maps'}}),journal=state.placeJournal??emptyPlaceJournal(now);
 if(journal.entries.some(p=>p.id===entry.id))return state;
 if(sharedMapPlaces(state).some(p=>p.maps!.identity===entry.maps!.identity||nameKey(p)===nameKey(entry)))throw new Error('You already shared this place. Find somewhere new.');
 return {...state,placeJournal:{...journal,entries:[...journal.entries,{...entry,ageBand:state.profile.ageBand,checkedInAt:now.toISOString()}].slice(-500)}};
}
export function receivedPlaceFavs(state:PreviewState,placeId?:string){const eligible=new Set(sharedMapPlaces(state).map(p=>p.id));return (state.placeJournal?.receivedFavs??[]).filter(e=>e.active&&eligible.has(e.placeId)&&(!placeId||e.placeId===placeId)&&!!palFor(state,e.palId)).length;}
/** All-time contribution impact. A save is evidence of interest, never an invented view or visit. */
export function gemImpact(state:PreviewState,now=new Date()){
 const entries=sharedMapPlaces(state),ids=new Set(entries.map(e=>e.id)),events=new Map<string,PlaceFavEvent>();
 if(state.profile?.ageBand!=='10-12')for(const event of state.placeJournal?.receivedFavs??[]){
  if(!ids.has(event.placeId)||!palFor(state,event.palId)||!Number.isFinite(Date.parse(event.at))||Date.parse(event.at)>now.getTime()+30_000)continue;
  const key=JSON.stringify([event.placeId,event.palId]),previous=events.get(key);
  if(!previous||Date.parse(event.at)>=Date.parse(previous.at))events.set(key,event);
 }
 const saves=[...events.values()].filter(e=>e.active),helped=new Set(saves.map(e=>e.palId)).size;
 const cities=new Map<string,{city:string;country:string;gems:number;saves:number}>();
 const gems=entries.map(entry=>({...entry,saves:saves.filter(e=>e.placeId===entry.id).length}));
 for(const gem of gems){const key=JSON.stringify([normalizedPlaceText(gem.location.city),normalizedPlaceText(gem.location.country)]),row=cities.get(key)??{city:gem.location.city,country:gem.location.country,gems:0,saves:0};row.gems++;row.saves+=gem.saves;cities.set(key,row);}
 return {count:gems.length,saves:saves.length,helped,cities:[...cities.values()].sort((a,b)=>b.saves-a.saves||b.gems-a.gems||a.city.localeCompare(b.city)),gems,recentSaves:saves.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,4).map(e=>({place:entries.find(p=>p.id===e.placeId)!,roamie:palFor(state,e.palId)!,at:e.at})),private:state.profile?.ageBand==='10-12'};
}
/** Local event adapter; production must authenticate the person who saved the place. */
export function recordReceivedPlaceFav(state:PreviewState,placeId:string,palId:string,active:boolean,now=new Date()):PreviewState{
 if(!sharedMapPlaces(state).some(p=>p.id===placeId)||!palFor(state,palId))throw new Error('This place favourite is unavailable.');
 const journal=state.placeJournal!,events=journal.receivedFavs??[],next={placeId,palId,active,at:now.toISOString()},index=events.findIndex(e=>e.placeId===placeId&&e.palId===palId);
 if(index>=0&&events[index].active===active)return state;
 const history=journal.favHistory??[],legacy=index>=0&&!history.some(e=>e.placeId===placeId&&e.ownerId==='you'&&e.actorId===palId)?[{placeId,ownerId:'you',actorId:palId,active:events[index].active,at:events[index].at}]:[];
 const favHistory=[...history,...legacy,{placeId,ownerId:'you',actorId:palId,active,at:now.toISOString()}].slice(-20000);
 return {...state,placeJournal:{...journal,favHistory,receivedFavs:index<0?[...events,next].slice(-1000):events.map((e,i)=>i===index?next:e)}};
}
export function placeShareLeaderboard(state:PreviewState){
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const peers=palSummaries(state),feed=placeCheckInFeed(state);
 const rows=[{id:'you',alias:'You',city:state.profile.city??'',avatar:state.profile.avatar,you:true,favs:receivedPlaceFavs(state),places:sharedMapPlaces(state).length},...peers.map(p=>({id:p.id,alias:p.alias,city:p.city,avatar:p.imageAvatar,you:false,favs:feed.filter(place=>place.peerId===p.id&&isPlaceFavorite(state,place.id)).length,places:feed.filter(place=>place.peerId===p.id).length}))].filter(r=>r.favs>0).sort((a,b)=>b.favs-a.favs||b.places-a.places||a.id.localeCompare(b.id));
 return rows.map((r,i)=>({...r,rank:1+rows.filter(p=>p.favs>r.favs).length}));
}
/** Public place details only: no anonymous identity, location history, or invite token. */
export function gemShareCard(gem:Pick<PlaceDraft,'name'|'location'|'maps'|'tip'>){
 const location=[gem.location.city,gem.location.country].filter(Boolean).join(', '),url=gem.maps?.url??`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.name+', '+location)}`;
 return {title:`${gem.name} · ${gem.location.city}`,text:[`A little find on Kymzi: ${gem.name}, ${location}.`,gem.tip].filter(Boolean).join('\n'),url};
}
