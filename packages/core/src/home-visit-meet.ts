import {homeVisitForPal,type PalHomeVisit} from './global-pals.ts';
import {isAdult} from './social.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand} from './types.ts';
export const HOME_MEET_MINUTES=60;
export const HOME_MEET_PLACES=[{id:'cafe',label:'Public café',point:'Café entrance',icon:'cafe'},{id:'park',label:'Park',point:'Main park entrance',icon:'park'},{id:'museum',label:'Museum',point:'Visitor entrance',icon:'museum'},{id:'square',label:'City square',point:'Public meeting point',icon:'pin'}] as const;
export type HomeMeetPlaceId=typeof HOME_MEET_PLACES[number]['id'];
export type HomePresence={city:string;country:string;at:string;until:string;consent:boolean};
export type HomeVisitMeet={version:1;id:string;visitId:string;peerId:string;owner:string;ageBand:Exclude<AgeBand,'10-12'>;preview:boolean;startedAt:string;placeId:HomeMeetPlaceId|null;placeName:string;own:HomePresence|null;peer:HomePresence|null;chatActive:boolean;messages:{id:string;from:'you'|'pal';text:string;at:string}[]};
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const text=(v:unknown,max=80):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max;
const key=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
function readPresence(raw:unknown):HomePresence|null{const p=raw as Partial<HomePresence>|null;if(!p||!text(p.city)||!text(p.country)||!date(p.at)||!date(p.until)||Date.parse(p.until)<=Date.parse(p.at)||Date.parse(p.until)>Date.parse(p.at)+HOME_MEET_MINUTES*60000)return null;return {city:p.city.trim(),country:p.country.trim(),at:p.at,until:p.until,consent:p.consent===true};}
export function readHomeVisitMeets(raw:unknown,visits:PalHomeVisit[]):HomeVisitMeet[]{
 const out:HomeVisitMeet[]=[];
 for(const p of Array.isArray(raw)?raw.slice(-8):[]){const v=p&&visits.find(v=>v.id===p.visitId&&v.peerId===p.peerId&&v.ageBand===p.ageBand);if(!p||!v||p.version!==1||typeof p.id!=='string'||p.id.length>220||!text(p.owner,18)||!date(p.startedAt)||out.some(m=>m.visitId===p.visitId&&m.owner===p.owner))continue;
  const own=readPresence(p.own),peer=readPresence(p.peer),place=HOME_MEET_PLACES.find(s=>s.id===p.placeId),messages:HomeVisitMeet['messages']=[],ids=new Set<string>();
  for(const m of Array.isArray(p.messages)?p.messages.slice(-100):[]){if(!m||typeof m.id!=='string'||m.id.length>160||ids.has(m.id)||!['you','pal'].includes(m.from)||!text(m.text,280)||!date(m.at))continue;ids.add(m.id);messages.push({id:m.id,from:m.from,text:m.text.trim(),at:m.at});}
  out.push({version:1,id:p.id,visitId:v.id,peerId:v.peerId,owner:p.owner,ageBand:v.ageBand,preview:!isAdult(v.ageBand),startedAt:p.startedAt,placeId:place?.id??null,placeName:place&&text(p.placeName,60)?p.placeName.trim():place?.point??'',own:own&&place?own:null,peer,chatActive:p.chatActive===true,messages});
 }
 return out;
}
function context(state:PreviewState,peerId:string){const visit=homeVisitForPal(state,peerId);if(!visit||!state.profile)throw new Error('This Roamie’s visit is no longer available.');return {visit,profile:state.profile};}
export function homeVisitMeet(state:PreviewState,peerId:string){const visit=homeVisitForPal(state,peerId);return visit?state.launch?.globalPals?.visitMeets?.find(m=>m.visitId===visit.id&&m.peerId===peerId&&m.owner===state.profile?.name&&m.ageBand===state.profile?.ageBand):undefined;}
function initial(state:PreviewState,peerId:string,now:Date):HomeVisitMeet{const {visit,profile}=context(state,peerId);return homeVisitMeet(state,peerId)??{version:1,id:`meet:${visit.id}:${profile.name}`,visitId:visit.id,peerId,owner:profile.name,ageBand:visit.ageBand,preview:!isAdult(profile.ageBand),startedAt:now.toISOString(),placeId:null,placeName:'',own:null,peer:null,chatActive:false,messages:[]};}
function save(state:PreviewState,m:HomeVisitMeet):PreviewState{return {...state,launch:{...state.launch!,globalPals:{...state.launch!.globalPals!,visitMeets:[...(state.launch!.globalPals!.visitMeets??[]).filter(v=>!(v.visitId===m.visitId&&v.owner===m.owner)),m].slice(-8)}}};}
export function homePresenceActive(p:HomePresence|null|undefined,now=new Date()){return !!p&&p.consent&&Date.parse(p.at)<=now.getTime()&&Date.parse(p.until)>now.getTime()&&Date.parse(p.until)<=Date.parse(p.at)+HOME_MEET_MINUTES*60000;}
export function homeVisitChatGate(state:PreviewState,peerId:string,now=new Date()){
 const visit=homeVisitForPal(state,peerId),m=homeVisitMeet(state,peerId),own=homePresenceActive(m?.own,now),peer=homePresenceActive(m?.peer,now);
 const sameCity=!!m?.own&&!!m.peer&&key(m.own.city)===key(m.peer.city)&&key(m.own.country)===key(m.peer.country);
 const reason=!visit?'unavailable':!own?'check-in':!peer?'waiting':!sameCity?'different-city':'ready';
 return {open:reason==='ready',reason,ownActive:own,peerActive:peer,sameCity,meeting:m,visit};
}
export function checkInHomeVisit(state:PreviewState,peerId:string,location:{city:string;country:string;placeId:HomeMeetPlaceId;placeName?:string},now=new Date()):PreviewState{
 const m=initial(state,peerId,now),place=HOME_MEET_PLACES.find(p=>p.id===location.placeId);if(!text(location.city)||!text(location.country)||!place||(location.placeName&&!text(location.placeName,60)))throw new Error('Choose your city and a public meeting place.');
 const own={city:location.city.trim(),country:location.country.trim(),at:now.toISOString(),until:new Date(now.getTime()+HOME_MEET_MINUTES*60000).toISOString(),consent:true};return save(state,{...m,placeId:place.id,placeName:location.placeName?.trim()||place.point,own,chatActive:false});
}
/** Explicitly simulates the fictional visitor consenting and checking in; never inferred from a trip date or GPS. */
export function previewHomePalCheckIn(state:PreviewState,peerId:string,location:{city:string;country:string},now=new Date()):PreviewState{
 const m=initial(state,peerId,now);if(!homePresenceActive(m.own,now))throw new Error('Check in at a public place first.');if(!text(location.city)||!text(location.country))throw new Error('Choose the Roamie’s check-in city.');
 return save(state,{...m,peer:{city:location.city.trim(),country:location.country.trim(),at:now.toISOString(),until:new Date(now.getTime()+HOME_MEET_MINUTES*60000).toISOString(),consent:true},chatActive:false});
}
export function leaveHomeVisit(state:PreviewState,peerId:string):PreviewState{const m=homeVisitMeet(state,peerId);return m?save(state,{...m,own:null,chatActive:false}):state;}
export function startHomeVisitChat(state:PreviewState,peerId:string,now=new Date()):PreviewState{
 const gate=homeVisitChatGate(state,peerId,now);if(!gate.open||!gate.meeting)throw new Error('Both Roamies must check in to the same city to chat.');const m=gate.meeting;
 return save(state,{...m,chatActive:true,messages:m.messages.length?m.messages:[{id:`hello:${m.id}`,from:'pal',text:`Hey! We’re both in ${m.own!.city}. Shall we choose a public place to meet?`,at:now.toISOString()}]});
}
export function sendHomeVisitMessage(state:PreviewState,peerId:string,value:string,now=new Date()):PreviewState{
 const gate=homeVisitChatGate(state,peerId,now),m=gate.meeting;if(!gate.open||!m?.chatActive)throw new Error('Both city check-ins must be active to chat.');if(!text(value,280))throw new Error('Write a message of 1–280 characters.');
 const n=m.messages.length,ids=new Set(m.messages.map(message=>message.id)),stamp=now.getTime();let sequence=n;while(ids.has(`${stamp}:${sequence}:you`)||ids.has(`${stamp}:${sequence}:pal`))sequence++;
 const replies=['A public spot sounds good. What works for you?','We can meet at the main entrance. No rush!','Let’s keep the plan here. See you soon.'];return save(state,{...m,messages:[...m.messages,{id:`${stamp}:${sequence}:you`,from:'you' as const,text:value.trim(),at:now.toISOString()},{id:`${stamp}:${sequence}:pal`,from:'pal' as const,text:replies[Math.floor(sequence/2)%replies.length],at:now.toISOString()}].slice(-100)});
}
