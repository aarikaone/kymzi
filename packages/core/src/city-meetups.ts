import {countryById,type CountryId} from './countries.ts';
import {citySpot,SPOT_PRESENCE_MINUTES} from './visits.ts';
import {isAdult} from './social.ts';
import type {Profile,AgeBand,AvatarId} from './types.ts';

export type CityMeetRequest={id:string;alias:string;avatar:AvatarId;status:'new'|'accepted'|'declined'};
export type CityMeetupState={
 version:1;owner:string;ageBand:AgeBand;preview:boolean;cityId:CountryId|null;
 step:'city'|'check-in'|'requests'|'pin'|'meeting';
 checkIn:{spotId:string;at:string;until:string}|null;
 requests:CityMeetRequest[];selectedRequestId:string|null;
 meeting:{requestId:string;spotId:string;when:string;status:'pinned'|'coming'|'arrived'}|null;
 update:number;seen:number;
};
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
/** All incoming people and arrival updates in this local prototype are fictional.
 * A teen walkthrough never records public presence or changes profile age. */
export function beginCityMeetup(profile:Profile):CityMeetupState{
 if(profile.ageBand==='10-12')throw new Error('Your city journey stays private.');
 return {version:1,owner:profile.name,ageBand:profile.ageBand,preview:!isAdult(profile.ageBand),cityId:null,step:'city',checkIn:null,requests:[],selectedRequestId:null,meeting:null,update:0,seen:0};
}
export function cityMeetupActive(s:CityMeetupState|undefined,now=new Date()):boolean{return !!s?.cityId&&!!s.checkIn&&date(s.checkIn.at)&&date(s.checkIn.until)&&Date.parse(s.checkIn.at)<=now.getTime()&&Date.parse(s.checkIn.until)>now.getTime();}
function requireActive(s:CityMeetupState,now:Date){if(!cityMeetupActive(s,now))throw new Error('Check in again to meet someone.');}
export function chooseMeetupCity(s:CityMeetupState,id:CountryId):CityMeetupState{
 if(!countryById(id))throw new Error('Choose a city.');
 if(s.checkIn)throw new Error('Check out before changing cities.');
 return {...s,cityId:id,step:'check-in',requests:[],selectedRequestId:null,meeting:null};
}
export function checkInForMeetup(s:CityMeetupState,spotId:string,now=new Date()):CityMeetupState{
 if(!s.cityId||!citySpot(s.cityId,spotId))throw new Error('Choose a public spot in this city.');
 if(cityMeetupActive(s,now))return s;
 return {...s,step:'requests',checkIn:{spotId,at:now.toISOString(),until:new Date(now.getTime()+SPOT_PRESENCE_MINUTES*60000).toISOString()},requests:[{id:'preview-pal-024',alias:'Roamie 024',avatar:'boba',status:'new'},{id:'preview-pal-071',alias:'Roamie 071',avatar:'miso',status:'new'}],selectedRequestId:null,meeting:null,update:s.update+1};
}
export function chooseMeetupRequest(s:CityMeetupState,id:string,now=new Date()):CityMeetupState{
 requireActive(s,now);if(s.meeting)throw new Error('Finish or cancel the current meetup first.');
 if(!s.requests.some(r=>r.id===id&&r.status==='new'))throw new Error('This request is no longer available.');
 return {...s,selectedRequestId:id,step:'pin'};
}
export function dismissMeetupRequest(s:CityMeetupState,id:string,now=new Date()):CityMeetupState{
 requireActive(s,now);if(s.meeting?.requestId===id)throw new Error('Cancel the meetup first.');
 return {...s,requests:s.requests.map(r=>r.id===id?{...r,status:'declined'}:r),selectedRequestId:s.selectedRequestId===id?null:s.selectedRequestId,step:'requests'};
}
export function pinCityMeetup(s:CityMeetupState,spotId:string,minutes:number,now=new Date()):CityMeetupState{
 requireActive(s,now);
 if(s.meeting||!s.cityId||!citySpot(s.cityId,spotId)||![10,20,30].includes(minutes)||!s.requests.some(r=>r.id===s.selectedRequestId&&r.status==='new'))throw new Error('Choose a request, a public pin and a meeting time.');
 const when=new Date(now.getTime()+minutes*60000).toISOString();if(Date.parse(when)>=Date.parse(s.checkIn!.until))throw new Error('Choose a time before your check-in ends.');
 return {...s,step:'meeting',meeting:{requestId:s.selectedRequestId!,spotId,when,status:'pinned'},requests:s.requests.map(r=>r.id===s.selectedRequestId?{...r,status:'accepted'}:r),update:s.update+1};
}
export function cityMeetupStatus(s:CityMeetupState|undefined,now=new Date()){
 if(!s?.meeting)return null;
 return !cityMeetupActive(s,now)||Date.parse(s.meeting.when)+30*60000<=now.getTime()?'expired' as const:s.meeting.status;
}
export function previewMeetupArrival(s:CityMeetupState,status:'coming'|'arrived',now=new Date()):CityMeetupState{
 requireActive(s,now);const current=cityMeetupStatus(s,now);
 if((status==='coming'&&current!=='pinned')||(status==='arrived'&&current!=='coming'))throw new Error('This arrival update is not available.');
 return {...s,meeting:{...s.meeting!,status},update:s.update+1};
}
export function cancelPinnedMeetup(s:CityMeetupState):CityMeetupState{return {...s,step:'requests',requests:s.requests.map(r=>r.id===s.meeting?.requestId?{...r,status:'declined'}:r),selectedRequestId:null,meeting:null,update:s.update+1};}
export function leaveMeetupCity(s:CityMeetupState):CityMeetupState{return {...s,step:s.cityId?'check-in':'city',checkIn:null,requests:[],selectedRequestId:null,meeting:null,seen:s.update};}
export function viewMeetupRequests(s:CityMeetupState):CityMeetupState{return {...s,step:s.meeting?'meeting':'requests',selectedRequestId:s.meeting?.requestId??null,seen:s.update};}
export function cityMeetupNotice(s:CityMeetupState|undefined,now=new Date()){
 if(!s?.checkIn||!s.cityId||!cityMeetupActive(s,now))return null;
 const city=countryById(s.cityId)!,r=s.requests.find(r=>r.id===s.meeting?.requestId),status=cityMeetupStatus(s,now);
 return {unread:s.update>s.seen,title:status==='arrived'?`${r!.alias} is at the pin`:status==='coming'?`${r!.alias} is coming`:status==='pinned'?'Your meeting pin is ready':s.requests.some(r=>r.status==='new')?'Someone wants to meet':'You’re checked in',detail:`${city.city} · ${s.preview?'Fictional adult walkthrough':'Local meetup preview'}`};
}
export function readCityMeetup(raw:unknown,profile:Profile):CityMeetupState|undefined{
 const p=raw as Partial<CityMeetupState>|null;if(!p||p.version!==1||p.owner!==profile.name||p.ageBand!==profile.ageBand||profile.ageBand==='10-12')return;
 const s=beginCityMeetup(profile);
 if(p.cityId!==null&&!countryById(p.cityId))return;
 s.cityId=p.cityId??null;s.update=Number.isInteger(p.update)?Math.max(0,Math.min(100000,p.update!)):0;s.seen=Number.isInteger(p.seen)?Math.max(0,Math.min(s.update,p.seen!)):0;
 const c=p.checkIn;
 if(c&&s.cityId&&citySpot(s.cityId,c.spotId)&&date(c.at)&&date(c.until)&&Date.parse(c.until)>Date.parse(c.at)&&Date.parse(c.until)<=Date.parse(c.at)+SPOT_PRESENCE_MINUTES*60000)s.checkIn={spotId:c.spotId,at:c.at,until:c.until};
 if(!s.checkIn){s.step=s.cityId?'check-in':'city';return s;}
 // Only known fictional actors can be restored. No public user IDs, real photos or coordinates.
 const actors=checkInForMeetup({...s,checkIn:null},s.checkIn.spotId,new Date(s.checkIn.at)).requests;
 for(const actor of actors){const saved=Array.isArray(p.requests)?p.requests.find(r=>r?.id===actor.id):null;if(saved&&['new','accepted','declined'].includes(saved.status))s.requests.push({...actor,status:saved.status});}
 const m=p.meeting;
 if(m&&s.cityId&&citySpot(s.cityId,m.spotId)&&s.requests.some(r=>r.id===m.requestId&&r.status==='accepted')&&date(m.when)&&Date.parse(m.when)>=Date.parse(s.checkIn.at)+10*60000&&Date.parse(m.when)<Date.parse(s.checkIn.until)&&['pinned','coming','arrived'].includes(m.status))s.meeting={requestId:m.requestId,spotId:m.spotId,when:m.when,status:m.status};
 s.selectedRequestId=s.meeting?.requestId??(s.requests.some(r=>r.id===p.selectedRequestId&&r.status==='new')?p.selectedRequestId!:null);
 s.step=s.meeting?'meeting':s.selectedRequestId?'pin':'requests';return s;
}
