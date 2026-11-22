import {readPlacePostcards,type PlacePostcard} from './place-postcards.ts';
import {readSharedTravel,sharedTravel,type SharedTravel} from './travel-profile.ts';
import {questionById,questionChoices,dayCardPicks,TRAVEL_INVITE_SETS,validQuestionChoice,isPostcardQuestionSet} from './question-library.ts';
import {readGlobalPals,type GlobalPalsPreview} from './global-pals.ts';
import {AVATARS,normalizeAnswer,questionBank,demoPeers} from './index.ts';
import {beginDaily,completeDaily,dailyStatus,hasDailyProgress,localDay,scheduleDaily,type DailyGame} from './daily.ts';
import {availableCategories,type PlayCategoryId} from './categories.ts';
import {travelCityForPlace,travelCityById,type TravelCityId} from './world-catalogue.ts';
import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import {attractionById} from './attractions.ts';
import {cleanCityJpeg,cityPhotoMonth,removeCityPhoto} from './photos.ts';
import {readProfileLocation,createSetupProfile} from './profile-setup.ts';
import {completeDemoPlay} from './demo-flow.ts';
import {connections} from './social.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand,AvatarId,Profile} from './types.ts';

export const LAUNCH_SETS=[['K0001','K0002','K0003'],['K0101','K0102','K0103'],['K0301','K0302','K0303'],['K0201','K0202','K0203'],['K0601','K0602','K0603']] as const;
export const LAUNCH_GUIDES:CountryId[]=['JP','FR','BR','KR','IT'];
const TTL=7*86400000,HEX=/^[a-f0-9]{32}$/,HASH=/^[a-f0-9]{64}$/;
type Person={name:string;avatar:AvatarId;city?:string;country?:string;travel?:SharedTravel};
export type FriendInvite={kind?:'bottle';version:1;id:string;createdAt:string;person:Person;ids:string[];hashes:string[]};
export type FriendReply={playCityId?:TravelCityId;version:1;invite:FriendInvite;id:string;completedAt:string;person:Person;hashes:string[]};
export type LaunchTicket={id:string;createdAt:string;ids:string[];answers:string[]};
export type InvitePreparation={ids:string[];answers:string[];submitted:number;startedAt:string};
export type HomeMoment={captureId:string;image:string;capturedAt:string;city:string;country:string;ageBand:AgeBand};
type HomeCredit={captureId:string;capturedAt:string;ageBand:AgeBand};
export type LaunchState={placePostcards?:PlacePostcard[];version:1;startedAt:string;tickets:LaunchTicket[];invites:FriendInvite[];postcards:FriendReply[];friendCredits:FriendReply[];preparation:InvitePreparation|null;homePhotos:HomeMoment[];homeCredits:HomeCredit[];guides:CountryId[];places:string[];globalPals?:GlobalPalsPreview;globalPlay?:{activatedAt:string;source:'friends'|'simulation'};unlockPreview?:{originalDaily:DailyGame}};
export type ChallengeCrypto={nonce:()=>string;digest:(value:string)=>Promise<string>};
export function emptyLaunch(now=new Date()):LaunchState{return {version:1,startedAt:now.toISOString(),tickets:[],invites:[],postcards:[],friendCredits:[],preparation:null,homePhotos:[],homeCredits:[],guides:[],places:[]};}
export function enableLaunch(state:PreviewState,now=new Date()):PreviewState{
 const next={...state,profile:state.profile?createSetupProfile(state.profile):null,launch:state.launch??emptyLaunch(now)};
 // Existing same-cohort connections are already past the first-use launch flow.
 if(next.profile&&next.profile.ageBand!=='10-12'&&!next.launch.globalPlay&&connections(next.social,next.profile.ageBand,next.blocked).length)next.launch={...next.launch,globalPlay:{activatedAt:now.toISOString(),source:'simulation'}};
 return next;
}
const validDate=(value:unknown):value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const validSet=(ids:unknown):ids is string[]=>Array.isArray(ids)&&[...LAUNCH_SETS,...TRAVEL_INVITE_SETS].some(set=>set.join('.')===ids.join('.'));
const knownSet=(ids:unknown):ids is string[]=>Array.isArray(ids)&&ids.length===3&&new Set(ids).size===3&&ids.every(id=>!!questionById(id));
function person(raw:unknown):Person{
 const p=raw as Partial<Person>|null;
 if(!p||typeof p.name!=='string'||!/^[1-9]\d{5}$/.test(p.name)||!AVATARS.some(a=>a.id===p.avatar))throw new Error('This challenge could not be opened.');
 return {name:p.name,avatar:p.avatar!,...readProfileLocation(p),...(p.travel?{travel:readSharedTravel(p.travel)}:{})};
}
function hashes(raw:unknown):string[]{if(!Array.isArray(raw)||raw.length!==3||raw.some(h=>typeof h!=='string'||!HASH.test(h)))throw new Error('This challenge could not be opened.');return [...raw];}
export function readFriendInvite(raw:unknown,now=new Date()):FriendInvite{
 const p=raw as Partial<FriendInvite>|null;
 if(!p||p.version!==1||typeof p.id!=='string'||!HEX.test(p.id)||!validDate(p.createdAt)||Date.parse(p.createdAt)>now.getTime()+300000||(p.kind!=='bottle'&&now.getTime()-Date.parse(p.createdAt)>TTL)||(p.kind==='bottle'?!isPostcardQuestionSet(p.ids):!validSet(p.ids))||(p.kind!==undefined&&p.kind!=='bottle'))throw new Error('This challenge has expired or is incomplete. Ask for a new link.');
 return {...(p.kind==='bottle'?{kind:'bottle' as const}:{}),version:1,id:p.id,createdAt:p.createdAt,person:person(p.person),ids:[...p.ids!],hashes:hashes(p.hashes)};
}
export function readFriendReply(raw:unknown,now=new Date()):FriendReply{
 const p=raw as Partial<FriendReply>|null;
 if(!p||p.version!==1||typeof p.id!=='string'||!HEX.test(p.id)||!validDate(p.completedAt)||Date.parse(p.completedAt)>now.getTime()+300000)throw new Error('This postcard could not be opened.');
 const invite=readFriendInvite(p.invite,new Date(p.completedAt));
 if(Date.parse(p.completedAt)<Date.parse(invite.createdAt)-300000)throw new Error('This postcard could not be opened.');
 return {version:1,invite,id:p.id,completedAt:p.completedAt,person:person(p.person),hashes:hashes(p.hashes),...(travelCityById(p.playCityId)?{playCityId:p.playCityId}:{})};
}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** URL data contains answer commitments, never answer text or either real photo. */
export function challengeToken(value:FriendInvite|FriendReply):string{
 const checked='invite' in value?readFriendReply(value,new Date(value.completedAt)):readFriendInvite(value,new Date(value.createdAt));
 const bytes=Array.from(encodeURIComponent(JSON.stringify(checked)).replace(/%([0-9A-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16))),c=>c.charCodeAt(0));
 let out='';for(let i=0;i<bytes.length;i+=3){const n=(bytes[i]<<16)|((bytes[i+1]??0)<<8)|(bytes[i+2]??0);out+=alphabet[(n>>>18)&63]+alphabet[(n>>>12)&63]+(i+1<bytes.length?alphabet[(n>>>6)&63]:'')+(i+2<bytes.length?alphabet[n&63]:'');}return out;
}
function tokenJSON(token:string):unknown{
 if(!token||token.length>6000||!/^[A-Za-z0-9_-]+$/.test(token)||token.length%4===1)throw new Error('This challenge link is incomplete.');
 let bits=0,value=0,escaped='';for(const c of token){value=(value<<6)|alphabet.indexOf(c);bits+=6;if(bits>=8){bits-=8;escaped+='%'+((value>>>bits)&255).toString(16).padStart(2,'0');}}
 try{return JSON.parse(decodeURIComponent(escaped));}catch{throw new Error('This challenge link could not be opened.');}
}
export const inviteFromToken=(token:string,now=new Date())=>readFriendInvite(tokenJSON(token),now);
export const replyFromToken=(token:string,now=new Date())=>readFriendReply(tokenJSON(token),now);
export function challengeURL(base:string,value:FriendInvite|FriendReply):string{
 const url=new URL(base);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('A web address is needed to share this challenge.');
 url.hash=`/challenge/${'invite' in value?'result/':''}${challengeToken(value)}`;return url.toString();
}
function publicPerson(profile:Profile):Person{return person({name:profile.name,avatar:profile.avatar,...(profile.travel?{travel:sharedTravel(profile.travel)}:{})});}
function cleanAnswers(values:string[]):string[]{if(values.length!==3||values.some(v=>typeof v!=='string'||!v.trim()||v.length>40))throw new Error('Answer all 3 questions first.');return values.map(v=>normalizeAnswer(v));}
async function commitments(id:string,ids:string[],answers:string[],crypto:Pick<ChallengeCrypto,'digest'>){const values=cleanAnswers(answers);const result=await Promise.all(ids.map((q,i)=>crypto.digest(`kymzi-friend-v1:${id}:${q}:${values[i]}`)));return hashes(result);}
export async function makeFriendInvite(state:PreviewState,crypto:ChallengeCrypto,now=new Date()):Promise<FriendInvite>{
 const ticket=state.launch?.tickets.slice().reverse().find(t=>validSet(t.ids));if(!state.profile||state.profile.ageBand==='10-12'||!ticket)throw new Error('Create your 3-question invite first.');
 const id=crypto.nonce();if(!HEX.test(id))throw new Error('Could not create a challenge. Try again.');
 return readFriendInvite({version:1,id,createdAt:now.toISOString(),person:publicPerson(state.profile),ids:ticket.ids,hashes:await commitments(id,ticket.ids,ticket.answers,crypto)},now);
}
/** Long-lived bottle links keep their exact question revision across ten-day loops. */
export async function makeBottleInvite(state:PreviewState,ticket:LaunchTicket,crypto:ChallengeCrypto,now=new Date()):Promise<FriendInvite>{
 if(!state.profile||state.profile.ageBand==='10-12'||!isPostcardQuestionSet(ticket.ids,state.profile.ageBand))throw new Error('Choose three travel questions.');
 const id=crypto.nonce();if(!HEX.test(id))throw new Error('Could not seal your postcard.');
 return readFriendInvite({kind:'bottle',version:1,id,createdAt:now.toISOString(),person:publicPerson(state.profile),ids:ticket.ids,hashes:await commitments(id,ticket.ids,ticket.answers,crypto)},now);
}
/** Preview only the owner's saved answers whose commitments match this exact invite. */
export async function senderPostcardPicks(state:PreviewState,invite:FriendInvite,crypto:Pick<ChallengeCrypto,'digest'>){
 if(state.profile?.name!==invite.person.name)return [];
 const tickets=state.launch?.tickets.slice().reverse().filter(t=>t.ids.join('.')===invite.ids.join('.'))??[];
 for(const ticket of tickets){const values=await commitments(invite.id,ticket.ids,ticket.answers,crypto);if(values.every((value,i)=>value===invite.hashes[i]))return dayCardPicks(ticket.ids,ticket.answers);}
 return [];
}
export function hasInviteAnswers(state:PreviewState){return !!state.launch?.tickets.some(t=>validSet(t.ids));}
export async function answerFriendInvite(invite:FriendInvite,profile:Profile,answers:string[],crypto:ChallengeCrypto,now=new Date(),playCityId?:TravelCityId):Promise<FriendReply>{
 invite=readFriendInvite(invite,now);if(invite.ids.some((id,i)=>{const q=questionById(id);return q&&!validQuestionChoice(q,answers[i]);}))throw new Error('Pick one of the six choices.');if(profile.ageBand==='10-12')throw new Error('Your city journey stays private.');if(profile.name===invite.person.name)throw new Error('Open this link with a friend to compare your answers.');
 return readFriendReply({version:1,invite,id:crypto.nonce(),completedAt:now.toISOString(),playCityId,person:publicPerson(profile),hashes:await commitments(invite.id,invite.ids,answers,crypto)},now);
}
export function friendScore(reply:FriendReply){const matched=reply.invite.hashes.map((h,i)=>h===reply.hashes[i]),shared=matched.filter(Boolean).length;return {matched,shared,total:3 as const,percentage:Math.round(shared/3*100),connects:shared/3>=.5};}
/** Open the sender's illustrated travel day only after two answers match.
 * Resolve the six reviewed choices locally; no network or billed generation is used. */
export async function openFriendPostcard(raw:FriendReply,crypto:Pick<ChallengeCrypto,'digest'>){
 const reply=readFriendReply(raw);
 if(!friendScore(reply).connects)throw new Error('Match at least 2 of 3 answers to open this postcard.');
 const answers=await Promise.all(reply.invite.ids.map(async(id,i)=>{
  const question=questionById(id);if(!question)throw new Error('This postcard is unavailable. Ask for a new one.');
  const options=questionChoices(question),hashes=await Promise.all(options.map(choice=>crypto.digest('kymzi-friend-v1:'+reply.invite.id+':'+id+':'+normalizeAnswer(choice.label)))),picked=options.find((_,j)=>hashes[j]===reply.invite.hashes[i]);
  if(!picked)throw new Error('This older postcard has no travel artwork. Ask for a new postcard.');
  return picked.label;
 }));
 return dayCardPicks(reply.invite.ids,answers);
}
export function rememberInvite(state:PreviewState,invite:FriendInvite,now=new Date()):PreviewState{
 invite=readFriendInvite(invite,now);if(!state.profile||state.profile.ageBand==='10-12'||invite.person.name!==state.profile.name)throw new Error('This is not your challenge.');
 const launch=state.launch??emptyLaunch(now);return {...state,launch:{...launch,invites:[...launch.invites.filter(i=>i.id!==invite.id),invite].slice(-30)}};
}
export function collectPostcard(state:PreviewState,reply:FriendReply,now=new Date()):PreviewState{
 reply=readFriendReply(reply,now);if(!state.profile||state.profile.ageBand==='10-12')throw new Error('Create your passport first.');
 const launch=state.launch??emptyLaunch(now),owner=reply.invite.person.name===state.profile.name,guest=reply.person.name===state.profile.name;
 if(!guest&&(!owner||!launch.invites.some(i=>i.id===reply.invite.id&&challengeToken(i)===challengeToken(reply.invite))))throw new Error('This postcard belongs to another challenge.');
 if(launch.postcards.some(p=>p.id===reply.id))return state;
 // A friend postcard never creates a global pal, a match proof or photo/chat access.
 const next={...state,launch:{...launch,postcards:[...launch.postcards,reply].slice(-50)}};
 const credited={...next,launch:{...next.launch,friendCredits:palFindingProgress(next).friends}};return palFindingProgress(credited).unlocked?simulatePalUnlock(credited,now):credited;
}

export const PAL_FINDING_FRIEND_GOAL=5;
export const UNLOCK_PREVIEW_AVATARS:AvatarId[]=['cloud','sprout','boba','miso','astro'];
function ownsReturnedInvite(launch:LaunchState,reply:FriendReply){return launch.invites.some(i=>i.id===reply.invite.id&&challengeToken(i)===challengeToken(reply.invite));}
/** Counts returned challenges with a 50%+ match from distinct anonymous friends, not shares.
 * Credits are local prototype records, not authenticated user registrations. */
export function palFindingProgress(state:PreviewState){
 const owner=state.profile?.name,eligible=!!state.profile&&state.profile.ageBand!=='10-12',friends:FriendReply[]=[],seen=new Set<string>();
 const add=(reply:FriendReply)=>{if(!owner||reply.invite.person.name!==owner||reply.person.name===owner||!friendScore(reply).connects||seen.has(reply.person.name))return;seen.add(reply.person.name);friends.push(reply);};
 if(eligible&&state.launch){for(const reply of state.launch.friendCredits??[]){add(reply);if(friends.length===PAL_FINDING_FRIEND_GOAL)break;}for(const reply of state.launch.postcards){if(friends.length===PAL_FINDING_FRIEND_GOAL)break;if(ownsReturnedInvite(state.launch,reply))add(reply);}}
 const count=Math.min(PAL_FINDING_FRIEND_GOAL,friends.length);
 const unlocked=eligible&&count>=PAL_FINDING_FRIEND_GOAL,activated=eligible&&!!state.launch?.globalPlay,simulated=activated&&state.launch?.globalPlay?.source==='simulation';
 return {count,goal:PAL_FINDING_FRIEND_GOAL,remaining:PAL_FINDING_FRIEND_GOAL-count,eligible,unlocked,activated,simulated,canPlay:unlocked||activated,friends};
}
/** The requested simulation permanently activates the local global-play experience.
 * It never fabricates referral credits or changes an existing game/time/quota. */
export function simulatePalUnlock(state:PreviewState,now=new Date()):PreviewState{
 const progress=palFindingProgress(state);
 if(!progress.eligible)throw new Error('Your city journey stays private.');
 if(progress.activated)return state;
 const next=enableLaunch(state,now);
 return {...next,launch:{...next.launch!,globalPlay:{activatedAt:now.toISOString(),source:progress.unlocked?'friends':'simulation'}}};
}
/** Leaving/replaying the animation cannot revoke global activation or restore old quotas. */
export function resetPalUnlock(state:PreviewState):PreviewState{
 if(!state.launch?.unlockPreview)return state;
 const {unlockPreview,...launch}=state.launch;
 return {...state,launch};
}
/** Preparing an invitation is free and independent of global play hours/quota. */
export function beginInvitePreparation(state:PreviewState,now=new Date(),travel=false):PreviewState{
 if(!state.profile||state.profile.ageBand==='10-12')throw new Error('Your city journey stays private.');
 const next=enableLaunch(state,now),launch=next.launch!;
 if(launch.preparation)return next;
 const sets=travel?TRAVEL_INVITE_SETS:LAUNCH_SETS,ids=[...sets[Math.floor(now.getTime()/86400000)%sets.length]];
 return {...next,launch:{...launch,preparation:{ids,answers:['','',''],submitted:0,startedAt:now.toISOString()}}};
}
export function invitePreparationQuestions(state:PreviewState){return (state.launch?.preparation?.ids??[]).map(id=>questionById(id)!);}
export function invitePreparationIndex(state:PreviewState){const draft=state.launch?.preparation;if(!draft)return 0;const index=draft.answers.findIndex((a,i)=>i>=draft.submitted||!a.trim());return index<0?2:index;}
export function answerInvitePreparation(state:PreviewState,index:number,value:string):PreviewState{
 const launch=state.launch,draft=launch?.preparation;if(!launch||!draft||!Number.isInteger(index)||index<0||index>2)throw new Error('Start your invite first.');
 const q=questionById(draft.ids[index]);if(q&&!validQuestionChoice(q,value))throw new Error('Pick one of the six choices.');
 return {...state,launch:{...launch,preparation:{...draft,answers:draft.answers.map((a,i)=>i===index?value.slice(0,40):a)}}};
}
export function submitInvitePreparation(state:PreviewState,index:number):PreviewState{
 const launch=state.launch,draft=launch?.preparation;if(!launch||!draft||index<0||index>2||index>draft.submitted||draft.answers.slice(0,index+1).some(a=>!a.trim()))throw new Error('Write your answer first.');
 return {...state,launch:{...launch,preparation:{...draft,submitted:Math.max(draft.submitted,index+1)}}};
}
export function finishInvitePreparation(state:PreviewState,now=new Date()):PreviewState{
 const launch=state.launch,draft=launch?.preparation;if(!launch||!draft||!validSet(draft.ids))throw new Error('Start your invite first.');cleanAnswers(draft.answers);
 const ticket={id:`invite:${now.toISOString()}:${launch.tickets.length}`,createdAt:now.toISOString(),ids:[...draft.ids],answers:draft.answers.map(a=>a.trim())};
 return {...state,launch:{...launch,preparation:null,tickets:[...launch.tickets,ticket].slice(-25)}};
}
/** Open topics without creating a question set, drawing a city or spending a play.
 * An answered/paid draft is retained; an untouched start can choose a new topic. */
export function prepareLaunchTopics(state:PreviewState,now=new Date()):PreviewState{
 if(!state.profile)throw new Error('Create your passport first.');
 if(state.profile.ageBand!=='10-12'&&!palFindingProgress(state).canPlay)throw new Error('Bring 5 friends to unlock pal finding.');
 let daily=state.daily;if(dailyStatus(daily,now).kind==='choose-time')daily=scheduleDaily(daily,daily.playTime??'19:00',now);
 if(dailyStatus(daily,now).kind!=='ready')throw new Error('Your next play opens at your saved daily time.');
 if(!hasDailyProgress(daily)&&daily.active)daily={...daily,active:null};
 const next=state.profile.ageBand==='10-12'?enableLaunch(state,now):simulatePalUnlock(state,now);
 return {...next,daily};
}
export function beginLaunchPlay(state:PreviewState,now=new Date(),peerId?:string,categoryId?:PlayCategoryId):PreviewState{
 state=prepareLaunchTopics(state,now);
 const daily=state.daily,profile=state.profile!;
 if(hasDailyProgress(daily))return state;
 if(categoryId&&!availableCategories(profile.ageBand).some(c=>c.id===categoryId))throw new Error('Choose one of the available topics.');
 const slot=daily.usageDay===localDay(now)?daily.playsToday:0,day=Math.floor(now.getTime()/86400000),ids=[...LAUNCH_SETS[(day+slot)%LAUNCH_SETS.length]];
 const known=connections(state.social,profile.ageBand,state.blocked),target=peerId?known.find(p=>p.peer.id===peerId):undefined;
 if(peerId&&(!target||target.matches>=5))throw new Error('This pal’s five games are complete or unavailable.');
 const eligible=COUNTRIES.filter(c=>demoPeers.some(p=>p.ageBand===profile.ageBand&&p.country===c.name&&!state.blocked.includes(p.id)&&(known.find(k=>k.peer.id===p.id)?.matches??0)<5));
 const countryId=profile.ageBand==='10-12'?COUNTRIES[daily.played%COUNTRIES.length].id:target?.countryId??eligible[Math.floor(Math.random()*eligible.length)]?.id;
 if(!countryId)throw new Error('No new preview pals are available.');
 if(categoryId){const selected=beginDaily(daily,profile.ageBand,now,categoryId,countryId);return {...state,daily:{...selected,active:{...selected.active!,...(target?{peerId:target.peer.id}:{})}}};}
 return {...state,daily:{...daily,active:{ids,answers:{},countryId,...(target?{peerId:target.peer.id}:{}),startedAt:now.toISOString(),submittedIds:[],countedAt:null}}};
}
export function finishLaunchPlay(state:PreviewState,now=new Date()):PreviewState{
 if(!state.profile||!state.daily.active||!knownSet(state.daily.active.ids))throw new Error('Start your 3 answers first.');
 if(state.profile.ageBand!=='10-12'&&!palFindingProgress(state).canPlay)throw new Error('Bring 5 friends to unlock pal finding.');
 const ids=[...state.daily.active.ids],answers=ids.map(id=>(state.daily.active!.answers[id]??'').trim());cleanAnswers(answers);
 const next=state.profile.ageBand==='10-12'?{...state,daily:completeDaily(state.daily,now)}:completeDemoPlay(simulatePalUnlock(state,now),now),launch=next.launch??emptyLaunch(now),ticket={id:`answers:${next.daily.played}:${now.toISOString()}`,createdAt:now.toISOString(),ids,answers};
 return {...next,launch:{...launch,tickets:[...launch.tickets,ticket].slice(-25)}};
}
export function toggleGuide(state:PreviewState,id:CountryId,now=new Date()):PreviewState{
 if(!countryById(id))throw new Error('Choose a city guide.');const launch=state.launch??emptyLaunch(now);
 return {...state,launch:{...launch,guides:launch.guides.includes(id)?launch.guides.filter(x=>x!==id):[...launch.guides,id]}};
}
export function toggleGuidePlace(state:PreviewState,id:string,now=new Date()):PreviewState{
 if(!attractionById(id)&&!travelCityForPlace(id))throw new Error('Choose a place.');const launch=state.launch??emptyLaunch(now);
 return {...state,launch:{...launch,places:launch.places.includes(id)?launch.places.filter(x=>x!==id):[...launch.places,id]}};
}
export function addHomeMoment(state:PreviewState,moment:Pick<HomeMoment,'captureId'|'image'|'capturedAt'>,reviewed:boolean,now=new Date()):PreviewState{
 const profile=state.profile;if(!profile?.city||!profile.country)throw new Error('Add your city and country to your profile first.');
 if(!reviewed)throw new Error('Check for faces and personal details first.');
 const launch=state.launch??emptyLaunch(now);if(launch.homeCredits.some(c=>c.captureId===moment.captureId)||state.photos.credits.some(c=>c.captureId===moment.captureId))return state;
 if(typeof moment.captureId!=='string'||!moment.captureId||moment.captureId.length>100)throw new Error('Take a new photo.');
 const at=Date.parse(moment.capturedAt);if(!Number.isFinite(at)||at>now.getTime()+30000||at<now.getTime()-15*60000)throw new Error('Take a fresh photo to add it.');
 const image=cleanCityJpeg(moment.image);if(launch.homePhotos.some(p=>p.image===image)||state.photos.photos.some(p=>p.image===image))throw new Error('Take a different city moment.');
 const photo={captureId:moment.captureId,image,capturedAt:new Date(at).toISOString(),city:profile.city,country:profile.country,ageBand:profile.ageBand};
 return {...state,launch:{...launch,homePhotos:[...launch.homePhotos,photo].slice(-12),homeCredits:[...launch.homeCredits,{captureId:photo.captureId,capturedAt:photo.capturedAt,ageBand:photo.ageBand}].slice(-300)}};
}
export function removeHomeMoment(state:PreviewState,id:string):PreviewState{if(!state.launch)return state;return {...state,launch:{...state.launch,homePhotos:state.launch.homePhotos.filter(p=>p.captureId!==id)}};}
export function launchMoments(state:PreviewState):HomeMoment[]{
 const home=(state.launch?.homePhotos??[]).filter(p=>p.ageBand===state.profile?.ageBand);
 const previous=state.photos.photos.filter(p=>p.ageBand===state.profile?.ageBand&&!home.some(h=>h.captureId===p.captureId)).map(p=>({...p,city:countryById(p.countryId)!.city,country:countryById(p.countryId)!.name}));
 return [...home,...previous].sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
}
export function removeLaunchMoment(state:PreviewState,id:string):PreviewState{
 if(state.launch?.homePhotos.some(p=>p.captureId===id&&p.ageBand===state.profile?.ageBand))return removeHomeMoment(state,id);
 const photo=state.photos.photos.find(p=>p.captureId===id&&p.ageBand===state.profile?.ageBand);if(!photo)throw new Error('This is not your photo.');
 return {...state,photos:removeCityPhoto(state,photo.id)};
}
export function homeMonthShots(state:PreviewState,now=new Date()){return launchMoments(state).filter(p=>cityPhotoMonth(new Date(p.capturedAt))===cityPhotoMonth(now));}
export function readLaunch(raw:unknown,now=new Date()):LaunchState|undefined{
 const p=raw as Partial<LaunchState>|null;if(!p||p.version!==1||!validDate(p.startedAt))return;
 const out=emptyLaunch(new Date(p.startedAt));const globalPals=readGlobalPals(p.globalPals);if(globalPals)out.globalPals=globalPals;
 if(p.globalPlay&&validDate(p.globalPlay.activatedAt)&&['friends','simulation'].includes(p.globalPlay.source))out.globalPlay={activatedAt:p.globalPlay.activatedAt,source:p.globalPlay.source};
 // Adopt already-activated v12–v14 previews without resetting their current daily game.
 else if(p.unlockPreview?.originalDaily&&typeof p.unlockPreview.originalDaily==='object')out.globalPlay={activatedAt:p.startedAt!,source:'simulation'};
 for(const t of Array.isArray(p.tickets)?p.tickets.slice(-25):[]){try{if(typeof t.id!=='string'||t.id.length>120||!validDate(t.createdAt)||!knownSet(t.ids))continue;cleanAnswers(t.answers);out.tickets.push({id:t.id,createdAt:t.createdAt,ids:[...t.ids],answers:t.answers.map(a=>a.trim())});}catch{}}
 for(const i of Array.isArray(p.invites)?p.invites.slice(-30):[]){try{const invite=readFriendInvite(i,new Date(i.createdAt));if(!out.invites.some(x=>x.id===invite.id))out.invites.push(invite);}catch{}}
 for(const r of Array.isArray(p.postcards)?p.postcards.slice(-50):[]){try{const reply=readFriendReply(r,new Date(r.completedAt));if(!out.postcards.some(x=>x.id===reply.id))out.postcards.push(reply);}catch{}}
 const credits=[...(Array.isArray(p.friendCredits)?p.friendCredits.slice(0,5):[]),...out.postcards.filter(r=>ownsReturnedInvite(out,r))];
 for(const raw of credits){try{const reply=readFriendReply(raw,new Date(raw.completedAt));if(reply.person.name===reply.invite.person.name||out.friendCredits.some(r=>r.person.name===reply.person.name))continue;out.friendCredits.push(reply);if(out.friendCredits.length===5)break;}catch{}}
 const prep=p.preparation;
 if(prep&&validSet(prep.ids)&&validDate(prep.startedAt)&&Array.isArray(prep.answers)&&prep.answers.length===3&&prep.answers.every(a=>typeof a==='string'&&a.length<=40)){
  const firstEmpty=prep.answers.findIndex(a=>!a.trim()),submitted=Math.max(0,Math.min(3,Number.isInteger(prep.submitted)?prep.submitted:0,firstEmpty<0?3:firstEmpty));
  out.preparation={ids:[...prep.ids],answers:[...prep.answers],startedAt:prep.startedAt,submitted};
 }
 const bands=['10-12','13-15','16-17','18-20','21-24','25-30'];
 for(const x of Array.isArray(p.homeCredits)?p.homeCredits.slice(-300):[]){if(x&&typeof x.captureId==='string'&&x.captureId.length<=100&&validDate(x.capturedAt)&&Date.parse(x.capturedAt)<=now.getTime()+30000&&bands.includes(x.ageBand)&&!out.homeCredits.some(c=>c.captureId===x.captureId))out.homeCredits.push({captureId:x.captureId,capturedAt:x.capturedAt,ageBand:x.ageBand});}
 for(const x of Array.isArray(p.homePhotos)?p.homePhotos.slice(-12):[]){try{const location=readProfileLocation(x);if(!location.city||!location.country||!out.homeCredits.some(c=>c.captureId===x.captureId&&c.ageBand===x.ageBand&&c.capturedAt===x.capturedAt))continue;out.homePhotos.push({captureId:x.captureId,image:cleanCityJpeg(x.image),capturedAt:x.capturedAt,city:location.city,country:location.country,ageBand:x.ageBand});}catch{}}
 out.guides=[...new Set((Array.isArray(p.guides)?p.guides:[]).filter((id):id is CountryId=>!!countryById(id)))].slice(0,COUNTRIES.length);
 out.places=[...new Set((Array.isArray(p.places)?p.places:[]).filter((id):id is string=>typeof id==='string'&&(!!attractionById(id)||!!travelCityForPlace(id))))].slice(0,25000);
 const placed=readPlacePostcards(p.placePostcards,out.invites);if(placed.length)out.placePostcards=placed;
 return out;
}
export function inviteQuestions(invite:FriendInvite){return invite.ids.map(id=>questionById(id)!);}
