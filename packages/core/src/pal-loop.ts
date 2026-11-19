import {portraitFrame} from './exploration.ts';
import {PAL_PHOTO_MATCHES} from './profile-photo.ts';
import {connections,connectionFor,isAdult,type SocialState,type Meetup} from './social.ts';
import {beginDaily,hasDailyProgress,type DailyGame} from './daily.ts';
import {countryById,type CountryId} from './countries.ts';
import {cityPhotoFeed,type CityPhotoItem} from './photos.ts';
import {currentCityVisit,presenceActive,citySpot} from './visits.ts';
import type {PreviewState} from './preview.ts';
import type {AvatarId} from './types.ts';
import type {PlayCategoryId} from './categories.ts';
export const PAL_GAME_LIMIT=5;
export type PalSummary={id:string;alias:string;countryId:CountryId;city:string;matches:number;avatar:AvatarId;imageAvatar:AvatarId;photoUnlocked:boolean;photoFrame?:ReturnType<typeof portraitFrame>;chatUnlocked:boolean};
/** Public characters stay stable. The fictional photo preview is omitted until three matches. */
export function palSummaries(state:PreviewState):PalSummary[]{
 if(!state.profile||state.profile.ageBand==='10-12')return [];
 const all=connections(state.social,state.profile.ageBand,state.blocked);
 return all.map(c=>{const city=all.filter(p=>p.countryId===c.countryId).sort((a,b)=>Date.parse(a.firstAt)-Date.parse(b.firstAt)||a.peer.id.localeCompare(b.peer.id));return {id:c.peer.id,alias:`Pal ${String(city.findIndex(p=>p.peer.id===c.peer.id)+1).padStart(2,'0')}`,countryId:c.countryId,city:countryById(c.countryId)!.city,matches:Math.min(PAL_GAME_LIMIT,c.matches),imageAvatar:c.peer.avatar,avatar:c.peer.avatar,photoUnlocked:c.matches>=PAL_PHOTO_MATCHES,...(c.matches>=PAL_PHOTO_MATCHES?{photoFrame:portraitFrame(c.peer)}:{}),chatUnlocked:c.matches>=PAL_GAME_LIMIT};});
}
export function palFor(state:PreviewState,id:string){return palSummaries(state).find(p=>p.id===id);}
export function palForMoment(state:PreviewState,photo:CityPhotoItem){return photo.you?undefined:palSummaries(state).find(p=>p.countryId===photo.countryId&&p.alias===photo.alias);}
export function palMoments(state:PreviewState,id:string,now=new Date()){const p=palFor(state,id);return p?cityPhotoFeed(state,p.countryId,now).filter(item=>!item.you&&item.alias===p.alias):[];}
export function beginPalPlay(state:PreviewState,id:string,category?:PlayCategoryId,now=new Date()):DailyGame{
 if(hasDailyProgress(state.daily))return state.daily;
 const p=palFor(state,id);if(!p)throw new Error('This pal is unavailable.');if(p.matches>=PAL_GAME_LIMIT)throw new Error('Five games complete. Your chat is open.');
 const daily=beginDaily(state.daily,state.profile!.ageBand,now,category,p.countryId);return {...daily,active:{...daily.active!,peerId:id}};
}
/** Share a public attraction only after the adult explicitly checks in there. No live location is read. */
export function sharePalMeeting(state:PreviewState,id:string,spotId:string,when:string,now=new Date()):SocialState{
 const p=palFor(state,id),visit=p?currentCityVisit(state,p.countryId,now):undefined,spot=p?citySpot(p.countryId,spotId):undefined,at=Date.parse(when);
 if(!p||!state.profile||!isAdult(state.profile.ageBand)||!visit||!spot||visit.spotId!==spotId||!presenceActive(visit,now))throw new Error('Check in at this public spot first.');
 if(!Number.isFinite(at)||at<now.getTime()+5*60_000||at>Date.parse(visit.presenceUntil!))throw new Error('Choose a time at least five minutes ahead, within your check-in.');
 const existing=state.social.meetups.find(m=>m.peerId===id&&m.spotId===spotId&&m.when===when&&m.status==='proposed');if(existing)return state.social;
 const plan:Meetup={id:`pal-spot:${id}:${now.getTime()}:${state.social.meetups.length}`,peerId:id,countryId:p.countryId,spotId,venueId:'park',when:new Date(at).toISOString(),youAccepted:true,peerAccepted:false,status:'proposed',createdAt:now.toISOString()};
 return {...state.social,meetups:[...state.social.meetups,plan]};
}
export function respondPalMeeting(state:PreviewState,id:string,accept:boolean,now=new Date()):SocialState{
 const plan=state.social.meetups.find(m=>m.id===id),p=plan?palFor(state,plan.peerId):undefined,visit=p?currentCityVisit(state,p.countryId,now):undefined;
 if(!plan||!p||!state.profile||!isAdult(state.profile.ageBand))throw new Error('This meeting is unavailable.');
 if(accept&&(plan.status!=='proposed'||!visit||!presenceActive(visit,now)||visit.spotId!==plan.spotId||Date.parse(plan.when)<=now.getTime()))throw new Error('This meeting has expired. Check in again.');
 return {...state.social,meetups:state.social.meetups.map(m=>m.id===id?{...m,peerAccepted:accept,youAccepted:accept?m.youAccepted:false,status:accept?'confirmed':'cancelled'}:m)};
}

/** Historical requests remain saved, but expired/withdrawn check-ins cannot appear live. */
export function palMeetingStatus(state:PreviewState,plan:Meetup,now=new Date()):Meetup['status']|'expired'{
 if(plan.status==='cancelled'||plan.status==='declined')return plan.status;
 const p=palFor(state,plan.peerId),visit=p?currentCityVisit(state,p.countryId,now):undefined;
 return !p||!state.profile||!isAdult(state.profile.ageBand)||!visit||!presenceActive(visit,now)||visit.spotId!==plan.spotId||Date.parse(plan.when)<=now.getTime()?'expired':plan.status;
}
