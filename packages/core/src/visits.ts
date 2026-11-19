import {attractionsForCountry} from './attractions.ts';
import {countryById,publicVenue,type CountryId,type VenueId} from './countries.ts';
import {meetingDateTime,isAdult,connections} from './social.ts';
import {uncoveredPlace} from './exploration.ts';
import type {AgeBand} from './types.ts';
import type {PreviewState} from './preview.ts';

export type AdultBand='18-20'|'21-24'|'25-30';
export type CityVisit={id:string;countryId:CountryId;ageBand:AdultBand;arriveOn:string;leaveOn:string;arrivalTime:string;status:'planned'|'here'|'left'|'cancelled';checkedInAt:string|null;presenceUntil:string|null;spotId?:string|null};
export type CityMeet={id:string;visitId:string;countryId:CountryId;visitorId:string;alias:string;venueId:VenueId;when:string;youAccepted:boolean;visitorAccepted:boolean;status:'pending'|'confirmed'|'cancelled';spotId?:string|null};
export type CityNotice={id:string;countryId:CountryId;ageBand:AdultBand;at:string;kind:'visit'|'check-in'|'leave'|'meet-request'|'meet-confirmed'|'cancelled';text:string;read:boolean};
export type CityVisitsState={version:1;alias:string|null;visits:CityVisit[];meetings:CityMeet[];notices:CityNotice[]};
export type CityBoardEntry={id:string;countryId:CountryId;alias:string;ageBand:AdultBand;arriveOn:string;leaveOn:string;arrivalTime:string;status:'coming'|'here';you:boolean;expiresAt?:string;visitId?:string;spotId?:string|null};
export const PRESENCE_HOURS=4;
export function emptyCityVisits():CityVisitsState{return {version:1,alias:null,visits:[],meetings:[],notices:[]};}
const validDate=(s:unknown):s is string=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const dayValid=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const timeValid=(s:unknown):s is string=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export function plusCityDays(day:string,days:number):string{const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}
export function cityToday(countryId:CountryId,now=new Date()):string{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:countryById(countryId)!.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}`;}
export function cityTimeValue(countryId:CountryId,now=new Date()):string{return new Intl.DateTimeFormat('en-GB',{timeZone:countryById(countryId)!.timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);}
export function cityLocalInput(countryId:CountryId,now=new Date()):string{return cityToday(countryId,now)+'T'+cityTimeValue(countryId,now);}
export function visitDates(visit:Pick<CityVisit,'arriveOn'|'leaveOn'|'arrivalTime'>):string{const fmt=new Intl.DateTimeFormat('en',{timeZone:'UTC',month:'short',day:'numeric'});return `${fmt.format(new Date(visit.arriveOn+'T12:00:00Z'))}–${fmt.format(new Date(visit.leaveOn+'T12:00:00Z'))} · ${visit.arrivalTime}`;}
export function meetingLabel(when:string,countryId:CountryId):string{return new Intl.DateTimeFormat('en',{timeZone:countryById(countryId)!.timeZone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(when));}

export function readCityVisits(value:unknown):CityVisitsState{
 const raw=value as Partial<CityVisitsState>|null,result=emptyCityVisits();if(!raw||typeof raw!=='object')return result;
 result.alias=typeof raw.alias==='string'&&/^Visitor \d{3}$/.test(raw.alias)?raw.alias:null;
 const ids=new Set<string>();
 for(const v of Array.isArray(raw.visits)?raw.visits:[]){
  if(!v||typeof v.id!=='string'||ids.has(v.id)||!countryById(v.countryId)||!isAdult(v.ageBand)||!dayValid(v.arriveOn)||!dayValid(v.leaveOn)||v.leaveOn<v.arriveOn||!timeValid(v.arrivalTime)||!['planned','here','left','cancelled'].includes(v.status))continue;
  const checked=validDate(v.checkedInAt)?v.checkedInAt:null,until=validDate(v.presenceUntil)?v.presenceUntil:null,spot=citySpot(v.countryId,v.spotId),validPresence=(!v.spotId||!!spot)&&checked&&until&&Date.parse(until)>Date.parse(checked)&&Date.parse(until)<=Date.parse(checked)+(spot?SPOT_PRESENCE_MINUTES*60000:PRESENCE_HOURS*3600000);
  result.visits.push({id:v.id,countryId:v.countryId,ageBand:v.ageBand,arriveOn:v.arriveOn,leaveOn:v.leaveOn,arrivalTime:v.arrivalTime,status:v.status==='here'&&!validPresence?'left':v.status,checkedInAt:checked,presenceUntil:validPresence?until:null,spotId:spot?.id??null});ids.add(v.id);
 }
 const meetIds=new Set<string>();
 for(const m of Array.isArray(raw.meetings)?raw.meetings:[]){const visit=m&&result.visits.find(v=>v.id===m.visitId);if(!m||!visit||typeof m.id!=='string'||meetIds.has(m.id)||m.countryId!==visit.countryId||typeof m.visitorId!=='string'||!m.visitorId.startsWith('demo-')||typeof m.alias!=='string'||!/^Visitor \d{3}$/.test(m.alias)||(m.spotId&&!citySpot(m.countryId,m.spotId))||!publicVenue(m.venueId)||!validDate(m.when)||!['pending','confirmed','cancelled'].includes(m.status))continue;result.meetings.push({id:m.id,visitId:visit.id,countryId:visit.countryId,visitorId:m.visitorId,alias:m.alias,venueId:m.venueId,spotId:citySpot(m.countryId,m.spotId)?.id??null,when:m.when,youAccepted:m.youAccepted===true,visitorAccepted:m.visitorAccepted===true,status:m.status==='confirmed'&&!(m.youAccepted&&m.visitorAccepted)?'pending':m.status});meetIds.add(m.id);}
 const noteIds=new Set<string>();
 for(const n of Array.isArray(raw.notices)?raw.notices:[]){if(!n||typeof n.id!=='string'||noteIds.has(n.id)||!countryById(n.countryId)||!isAdult(n.ageBand)||!validDate(n.at)||typeof n.text!=='string'||n.text.length>180||!['visit','check-in','leave','meet-request','meet-confirmed','cancelled'].includes(n.kind))continue;result.notices.push({id:n.id,countryId:n.countryId,ageBand:n.ageBand,at:n.at,kind:n.kind,text:n.text,read:n.read===true});noteIds.add(n.id);}
 return result;
}
export function canUseCityBoard(state:PreviewState,countryId:CountryId):boolean{return !!state.profile&&isAdult(state.profile.ageBand)&&uncoveredPlace(state,countryId).uncovered;}
function requireBoard(state:PreviewState,countryId:CountryId):AdultBand{if(!canUseCityBoard(state,countryId))throw new Error('City visits are for adults in an uncovered city.');return state.profile!.ageBand as AdultBand;}
function aliasAt(now:Date){let seed=0;for(const c of now.toISOString())seed=(seed*31+c.charCodeAt(0))>>>0;return `Visitor ${100+seed%900}`;}
function notice(state:CityVisitsState,visit:CityVisit,kind:CityNotice['kind'],text:string,now:Date):CityVisitsState{return {...state,notices:[...state.notices,{id:`notice:${now.getTime()}:${state.notices.length}`,countryId:visit.countryId,ageBand:visit.ageBand,at:now.toISOString(),kind,text,read:false}]};}
export function currentCityVisit(state:PreviewState,countryId:CountryId,now=new Date()):CityVisit|undefined{const today=cityToday(countryId,now),score=(v:CityVisit)=>presenceActive(v,now)?0:v.status==='planned'&&v.arriveOn<=today&&v.leaveOn>=today?1:v.status==='planned'&&v.arriveOn>today?2:3;return state.visits.visits.filter(v=>v.countryId===countryId&&v.ageBand===state.profile?.ageBand&&v.status!=='cancelled').sort((a,b)=>score(a)-score(b)||Date.parse(b.checkedInAt??b.arriveOn)-Date.parse(a.checkedInAt??a.arriveOn))[0];}
export function presenceActive(visit:CityVisit,now=new Date()):boolean{return visit.status==='here'&&!!visit.checkedInAt&&Date.parse(visit.checkedInAt)<=now.getTime()&&!!visit.presenceUntil&&Date.parse(visit.presenceUntil)>now.getTime();}
export function cityVisitStatus(visit:CityVisit,now=new Date()):string{return presenceActive(visit,now)?'Here now':visit.status==='cancelled'?'Hidden':visit.status==='left'?'Checked out':visit.status==='here'?'Check-in ended':visit.leaveOn<cityToday(visit.countryId,now)?'Visit ended':'Coming soon';}
export function postCityVisit(state:PreviewState,countryId:CountryId,arriveOn:string,leaveOn:string,arrivalTime:string,now=new Date()):CityVisitsState{
 const band=requireBoard(state,countryId),today=cityToday(countryId,now);
 if(!dayValid(arriveOn)||!dayValid(leaveOn)||arriveOn<today||arriveOn>plusCityDays(today,365)||leaveOn<arriveOn||leaveOn>plusCityDays(arriveOn,30)||!timeValid(arrivalTime))throw new Error('Choose valid dates within one year, up to 30 days apart.');
 const previous=currentCityVisit(state,countryId,now),visit:CityVisit={id:previous?.id??`visit:${countryId}:${now.getTime()}:${state.visits.visits.length}`,countryId,ageBand:band,arriveOn,leaveOn,arrivalTime,status:'planned',checkedInAt:null,presenceUntil:null,spotId:null};
 const result={...state.visits,alias:state.visits.alias??aliasAt(now),visits:[...state.visits.visits.filter(v=>v.id!==visit.id),visit],meetings:state.visits.meetings.map(m=>m.visitId===visit.id?{...m,status:'cancelled' as const}:m)};
 return notice(result,visit,'visit',`${result.alias} is visiting ${countryById(countryId)!.city} · ${visitDates(visit)}`,now);
}
export function checkInCity(state:PreviewState,visitId:string,now=new Date()):CityVisitsState{
 const visit=state.visits.visits.find(v=>v.id===visitId);if(!visit)throw new Error('Choose a planned visit.');const band=requireBoard(state,visit.countryId),today=cityToday(visit.countryId,now);
 if(visit.ageBand!==band||visit.status==='cancelled'||today<visit.arriveOn||today>visit.leaveOn)throw new Error('Check in during your visit dates.');
 if(presenceActive(visit,now))return state.visits;
 const end=Date.parse(meetingDateTime(visit.leaveOn,'23:59',countryById(visit.countryId)!.timeZone))+60000,until=new Date(Math.min(now.getTime()+PRESENCE_HOURS*3600000,end)).toISOString();
 const result={...state.visits,visits:state.visits.visits.map(v=>v.id===visitId?{...v,status:'here' as const,spotId:null,checkedInAt:now.toISOString(),presenceUntil:until}:presenceActive(v,now)?{...v,status:'left' as const,presenceUntil:null}:v),meetings:state.visits.meetings.map(m=>m.visitId!==visitId&&m.status!=='cancelled'?{...m,status:'cancelled' as const}:m)};
 return notice(result,visit,'check-in',`${state.visits.alias??'A visitor'} checked in to ${countryById(visit.countryId)!.city}.`,now);
}
export function leaveCityVisit(state:PreviewState,visitId:string,cancel=false,now=new Date()):CityVisitsState{
 const visit=state.visits.visits.find(v=>v.id===visitId);if(!visit||visit.ageBand!==requireBoard(state,visit.countryId))throw new Error('Visit unavailable.');
 const result={...state.visits,visits:state.visits.visits.map(v=>v.id===visitId?{...v,status:cancel?'cancelled' as const:'left' as const,presenceUntil:null,spotId:null}:v),meetings:state.visits.meetings.map(m=>m.visitId===visitId?{...m,status:'cancelled' as const}:m)};
 return notice(result,visit,cancel?'cancelled':'leave',`${state.visits.alias??'A visitor'} ${cancel?'hid their visit to':'checked out of'} ${countryById(visit.countryId)!.city}.`,now);
}
export function cityBoardEntries(state:PreviewState,countryId:CountryId,now=new Date()):CityBoardEntry[]{
 if(!canUseCityBoard(state,countryId))return [];const band=state.profile!.ageBand as AdultBand,today=cityToday(countryId,now),seed=countryId.charCodeAt(0)+countryId.charCodeAt(1);
 const fixtures:CityBoardEntry[]=[0,1,2,3].map(i=>({id:`demo-${countryId}-${band}-${i}`,countryId,ageBand:band,alias:`Visitor ${200+(seed*7+i*83)%700}`,arriveOn:i<2?today:plusCityDays(today,i-1),leaveOn:plusCityDays(today,i<2?2:i+1),arrivalTime:i%2?'16:00':'11:00',status:i<2?'here':'coming',you:false,...(i<2?{spotId:citySpots(countryId)[i].id,expiresAt:new Date(now.getTime()+(i+2)*3600000).toISOString()}:{} )}));
 const own=currentCityVisit(state,countryId,now);if(own&&presenceActive(own,now))fixtures.unshift({id:own.id,visitId:own.id,countryId,ageBand:band,alias:state.visits.alias??'Visitor 100',arriveOn:own.arriveOn,leaveOn:own.leaveOn,arrivalTime:own.arrivalTime,status:'here',you:true,spotId:own.spotId??null,expiresAt:own.presenceUntil!});
 else if(own&&own.status==='planned'&&own.leaveOn>=today)fixtures.unshift({id:own.id,visitId:own.id,countryId,ageBand:band,alias:state.visits.alias??'Visitor 100',arriveOn:own.arriveOn,leaveOn:own.leaveOn,arrivalTime:own.arrivalTime,status:'coming',you:true});
 for(const plan of sharedPalVisits(state,now).filter(p=>p.countryId===countryId))fixtures.push({...plan,status:'coming',you:false});
 return fixtures;
}
export function requestCityMeet(state:PreviewState,countryId:CountryId,visitorId:string,venueId:VenueId,when:string,now=new Date()):CityVisitsState{
 requireBoard(state,countryId);const own=currentCityVisit(state,countryId,now),peer=cityBoardEntries(state,countryId,now).find(p=>p.id===visitorId&&!p.you&&p.status==='here'),at=Date.parse(when);
 if(!own||!presenceActive(own,now)||!peer||(own.spotId&&peer.spotId!==own.spotId)||!publicVenue(venueId)||!Number.isFinite(at)||at<now.getTime()+5*60000||at>now.getTime()+2*3600000||at>Date.parse(own.presenceUntil!))throw new Error('Both visitors must be checked in. Choose a public place and a time within two hours.');
 if(state.visits.meetings.some(m=>m.visitId===own.id&&m.visitorId===peer.id&&m.venueId===venueId&&m.when===new Date(at).toISOString()&&m.status==='pending'))return state.visits;
 const meet:CityMeet={id:`city-meet:${now.getTime()}:${state.visits.meetings.length}`,visitId:own.id,countryId,visitorId:peer.id,alias:peer.alias,venueId,spotId:own.spotId??null,when:new Date(at).toISOString(),youAccepted:true,visitorAccepted:false,status:'pending'};
 return notice({...state.visits,meetings:[...state.visits.meetings,meet]},own,'meet-request',`Meetup suggested with ${peer.alias} in ${countryById(countryId)!.city}.`,now);
}
export function cityMeetStatus(state:PreviewState,meet:CityMeet,now=new Date()):CityMeet['status']|'expired'{const own=state.visits.visits.find(v=>v.id===meet.visitId);return meet.status==='cancelled'?'cancelled':!canUseCityBoard(state,meet.countryId)||!own||own.ageBand!==state.profile?.ageBand||!presenceActive(own,now)||(meet.spotId&&own.spotId!==meet.spotId)||!cityBoardEntries(state,meet.countryId,now).some(p=>!p.you&&p.id===meet.visitorId&&p.status==='here'&&(!meet.spotId||p.spotId===meet.spotId))||Date.parse(meet.when)+(meet.status==='confirmed'?30*60000:0)<=now.getTime()?'expired':meet.status;}
export function acceptCityMeetPreview(state:PreviewState,id:string,now=new Date()):CityVisitsState{
 const meet=state.visits.meetings.find(m=>m.id===id);if(!meet||cityMeetStatus(state,meet,now)!=='pending')throw new Error('This meetup request is no longer available.');
 return notice({...state.visits,meetings:state.visits.meetings.map(m=>m.id===id?{...m,visitorAccepted:true,status:'confirmed' as const}:m)},state.visits.visits.find(v=>v.id===meet.visitId)!,'meet-confirmed',`Both visitors agreed to meet at ${publicVenue(meet.venueId)!.name}.`,now);
}
export function cancelCityMeet(state:PreviewState,id:string,now=new Date()):CityVisitsState{const meet=state.visits.meetings.find(m=>m.id===id),visit=meet&&state.visits.visits.find(v=>v.id===meet.visitId);if(!meet||!visit||visit.ageBand!==requireBoard(state,meet.countryId))throw new Error('Meetup unavailable.');return {...state.visits,meetings:state.visits.meetings.map(m=>m.id===id?{...m,status:'cancelled' as const}:m)};}
export function hideAllCityVisits(visits:CityVisitsState):CityVisitsState{return {...visits,visits:visits.visits.map(v=>({...v,status:'cancelled' as const,presenceUntil:null,spotId:null})),meetings:visits.meetings.map(m=>({...m,status:'cancelled' as const}))};}
export function markCityUpdatesRead(visits:CityVisitsState):CityVisitsState{return {...visits,notices:visits.notices.map(n=>({...n,read:true}))};}
export function cityUpdates(state:PreviewState):CityNotice[]{return isAdult(state.profile?.ageBand??'10-12')?state.visits.notices.filter(n=>n.ageBand===state.profile!.ageBand).slice().reverse():[];}

/** Public presentation never includes the matched person's ID, name, photo or presence. */
export function publicCityPals(state:PreviewState,countryId:CountryId):{alias:string;matches:number}[]{
 if(!state.profile||state.profile.ageBand==='10-12'||!uncoveredPlace(state,countryId).uncovered)return [];
 return connections(state.social,state.profile.ageBand,state.blocked).filter(p=>p.countryId===countryId).sort((a,b)=>Date.parse(a.firstAt)-Date.parse(b.firstAt)||a.peer.id.localeCompare(b.peer.id)).map((p,index)=>({alias:`Pal ${String(index+1).padStart(2,'0')}`,matches:p.matches}));
}


export const SPOT_PRESENCE_MINUTES=60;
export type CitySpot={id:string;countryId:CountryId;name:string;meetingPoint:string;artworkId:string};
export function citySpots(countryId:CountryId):CitySpot[]{return attractionsForCountry(countryId).map(a=>({id:a.id,countryId,name:a.name,meetingPoint:a.kind.toLowerCase().includes('park')?'Main park gate':'Main visitor entrance',artworkId:a.id}));}
export function citySpot(countryId:CountryId,id:unknown){return citySpots(countryId).find(p=>p.id===id);}
export function spotVisitors(state:PreviewState,countryId:CountryId,spotId:string,now=new Date()){return citySpot(countryId,spotId)?cityBoardEntries(state,countryId,now).filter(p=>p.status==='here'&&p.spotId===spotId):[];}
export function checkInAtSpot(state:PreviewState,countryId:CountryId,spotId:string,now=new Date(),visitId?:string):CityVisitsState{
 const band=requireBoard(state,countryId),spot=citySpot(countryId,spotId),today=cityToday(countryId,now);
 if(!spot)throw new Error('Choose a public spot in this city.');
 let next=state,visit=visitId?state.visits.visits.find(v=>v.id===visitId):currentCityVisit(state,countryId,now);
 if(visitId&&(!visit||visit.countryId!==countryId||visit.ageBand!==band||visit.status==='cancelled'||today<visit.arriveOn||today>visit.leaveOn))throw new Error('Check in during your visit dates.');
 if(!visit||visit.leaveOn<today||visit.arriveOn>today||visit.status==='cancelled'){
  visit={id:`visit:${countryId}:${now.getTime()}:${state.visits.visits.length}:spot`,countryId,ageBand:band,arriveOn:today,leaveOn:today,arrivalTime:cityTimeValue(countryId,now),status:'planned',checkedInAt:null,presenceUntil:null};
  next={...state,visits:{...state.visits,alias:state.visits.alias??aliasAt(now),visits:[...state.visits.visits,visit]}};
 }
 if(visit.spotId===spotId&&presenceActive(visit,now))return next.visits;
 const until=new Date(Math.min(now.getTime()+SPOT_PRESENCE_MINUTES*60000,Date.parse(meetingDateTime(visit.leaveOn,'23:59',countryById(countryId)!.timeZone))+60000)).toISOString();
 const result:CityVisitsState={...next.visits,alias:next.visits.alias??aliasAt(now),visits:next.visits.visits.map(v=>v.id===visit!.id?{...v,spotId,status:'here',checkedInAt:now.toISOString(),presenceUntil:until}:presenceActive(v,now)?{...v,spotId:null,status:'left',presenceUntil:null}:v),meetings:next.visits.meetings.map(m=>m.status==='cancelled'?m:{...m,status:'cancelled'})};
 return notice(result,visit,'check-in',`${result.alias} checked in to ${countryById(countryId)!.city} · ${spot.name}.`,now);
}
export function requestSpotMeet(state:PreviewState,countryId:CountryId,visitorId:string,when:string,now=new Date()):CityVisitsState{
 const own=currentCityVisit(state,countryId,now),peer=cityBoardEntries(state,countryId,now).find(p=>p.id===visitorId&&!p.you&&p.status==='here');
 if(!own?.spotId||!citySpot(countryId,own.spotId)||!presenceActive(own,now)||!peer?.spotId||peer.spotId!==own.spotId)throw new Error('Both visitors must be checked in at the same public spot.');
 if(Date.parse(when)>=Date.parse(own.presenceUntil!)||(peer.expiresAt&&Date.parse(when)>=Date.parse(peer.expiresAt)))throw new Error('Choose a time before both check-ins end.');
 const result=requestCityMeet(state,countryId,visitorId,'cafe',when,now);
 return {...result,meetings:result.meetings.map(m=>m.visitId===own.id&&m.visitorId===visitorId&&m.status==='pending'?{...m,spotId:own.spotId!}:m)};
}

/** A voluntarily shared, fictional future trip. It never implies live presence. */
export function sharedPalVisits(state:PreviewState,now=new Date()):CityBoardEntry[]{
 if(!state.profile||!isAdult(state.profile.ageBand))return [];
 const band=state.profile.ageBand as AdultBand;
 return state.social.proofs.length?Array.from(new Set(connections(state.social,band,state.blocked).map(p=>p.countryId))).flatMap(countryId=>{const pal=publicCityPals(state,countryId)[0];if(!pal)return [];const today=cityToday(countryId,now);return [{id:`demo-pal-trip-${countryId}-${band}`,countryId,ageBand:band,alias:pal.alias,arriveOn:plusCityDays(today,1),leaveOn:plusCityDays(today,3),arrivalTime:'14:00',status:'coming' as const,you:false}];}):[];
}
