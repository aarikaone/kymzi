import {travelCityById,type TravelCityId} from './world-catalogue.ts';
import {questionById,isTravelInviteSet,isPostcardQuestionSet} from './question-library.ts';
import {beginDayCard} from './perfect-day.ts';
import {emptyLaunch,makeBottleInvite,rememberInvite,friendScore,readFriendReply,challengeToken,type FriendInvite,type LaunchTicket,type ChallengeCrypto} from './launch.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand} from './types.ts';
import {readPostcardDrift,defaultPostcardDrift,type PostcardDrift,type PostcardDriftDraft} from './postcard-drift.ts';
export type PlacePostcard={id:string;cityId:TravelCityId;placeId:string;inviteId:string;owner:string;ageBand:AgeBand;placedAt:string;ticketId?:string;replaces?:string;drift?:PostcardDrift};
export type PlacePostcardDraft={ids:string[];answers:string[]};
export type PreparedPlacePostcard={postcard:PlacePostcard;invite:FriendInvite;ticket:LaunchTicket};
export const MY_POSTCARD_LIMIT=1;
export function ownPostcardVersions(state:PreviewState){return readPlacePostcards(state.launch?.placePostcards,state.launch?.invites??[]).filter(p=>p.owner===state.profile?.name&&p.ageBand===state.profile?.ageBand);}
export function activePlacePostcard(state:PreviewState){return ownPostcardVersions(state).at(-1);}
export function postcardVersions(state:PreviewState){const all=ownPostcardVersions(state),out:PlacePostcard[]=[],seen=new Set<string>();let p=all.at(-1);while(p&&!seen.has(p.inviteId)){out.push(p);seen.add(p.inviteId);p=all.find(v=>v.inviteId===p!.replaces);}return out;}
export function postcardDriftPlan(postcard:PlacePostcard):PostcardDrift{return postcard.drift??{id:postcard.inviteId,...defaultPostcardDrift(postcard.cityId,postcard.placedAt)};}
export function postcardCapacity(state:PreviewState){const count=activePlacePostcard(state)?1:0;return {count,limit:MY_POSTCARD_LIMIT,remaining:1-count,canCreate:!!state.profile&&state.profile.ageBand!=='10-12'&&count===0};}

const bands=['10-12','13-15','16-17','18-20','21-24','25-30'];
export function readPlacePostcards(value:unknown,invites:FriendInvite[]):PlacePostcard[]{
 const out:PlacePostcard[]=[];
 for(const raw of Array.isArray(value)?value.slice(-30):[]){if(!raw||!travelCityById(raw.cityId)?.placeIds.includes(raw.placeId)||!bands.includes(raw.ageBand)||raw.ageBand==='10-12'||!Number.isFinite(Date.parse(raw.placedAt))||!invites.some(i=>i.id===raw.inviteId&&i.person.name===raw.owner&&(isTravelInviteSet(i.ids)||i.kind==='bottle'&&isPostcardQuestionSet(i.ids)))||out.some(p=>p.id===raw.inviteId))continue;out.push({id:raw.inviteId,inviteId:raw.inviteId,cityId:raw.cityId,placeId:raw.placeId,owner:raw.owner,ageBand:raw.ageBand,placedAt:new Date(raw.placedAt).toISOString(),...(typeof raw.ticketId==='string'&&raw.ticketId.length<150?{ticketId:raw.ticketId}:{}),...(typeof raw.replaces==='string'&&raw.replaces!==raw.inviteId&&invites.some(i=>i.id===raw.replaces&&i.person.name===raw.owner)?{replaces:raw.replaces}:{}),...(readPostcardDrift(raw.drift)?{drift:readPostcardDrift(raw.drift)}:{})});}
 return out;
}
export function placePostcardAt(state:PreviewState,cityId:TravelCityId,placeId:string){return readPlacePostcards(state.launch?.placePostcards,state.launch?.invites??[]).find(p=>p.owner===state.profile?.name&&p.ageBand===state.profile?.ageBand&&p.cityId===cityId&&p.placeId===placeId);}
export function placePostcardForInvite(state:PreviewState,inviteId:string){return readPlacePostcards(state.launch?.placePostcards,state.launch?.invites??[]).find(p=>p.inviteId===inviteId&&p.owner===state.profile?.name&&p.ageBand===state.profile?.ageBand);}
export function placePostcardOpened(state:PreviewState,postcard:PlacePostcard){const owned=state.launch?.invites.find(i=>i.id===postcard.inviteId);return !!owned&&!!state.launch?.postcards.some(raw=>{try{const r=readFriendReply(raw,new Date(raw.completedAt));return r.invite.id===postcard.inviteId&&r.person.name!==postcard.owner&&challengeToken(r.invite)===challengeToken(owned)&&friendScore(r).connects;}catch{return false;}});}

export function initialPlacePostcard(state:PreviewState,now=new Date()):PlacePostcardDraft{
 const current=activePlacePostcard(state),ticket=state.launch?.tickets.slice().reverse().find(t=>(current?.ticketId?t.id===current.ticketId:isTravelInviteSet(t.ids))&&t.answers.every((a,i)=>questionById(t.ids[i])?.choices?.some(c=>c.label===a)));
 if(ticket)return {ids:[...ticket.ids],answers:[...ticket.answers]};
 const next=beginDayCard(state,now);return {ids:[...next.launch!.preparation!.ids],answers:[...next.launch!.preparation!.answers]};
}
export async function preparePlacePostcard(state:PreviewState,cityId:TravelCityId,placeId:string,draft:PlacePostcardDraft,crypto:ChallengeCrypto,now=new Date(),options:{replaceId?:string;drift?:PostcardDriftDraft}={}):Promise<PreparedPlacePostcard>{
 if(!state.profile||state.profile.ageBand==='10-12')throw new Error('Your city journey stays private.');
 if(!travelCityById(cityId)?.placeIds.includes(placeId))throw new Error('Choose a place in this city.');
 const current=activePlacePostcard(state);if(current&&options.replaceId!==current.inviteId&&!(current.cityId===cityId&&current.placeId===placeId&&!options.replaceId))throw new Error('You have one postcard. Edit it to change your drift.');if(options.replaceId&&options.replaceId!==current?.inviteId)throw new Error('Your postcard changed. Open it again.');
 if(!isPostcardQuestionSet(draft.ids,state.profile.ageBand)||draft.answers.length!==3||draft.answers.some((a,i)=>!questionById(draft.ids[i])?.choices?.some(c=>c.label===a)))throw new Error('Pick your three postcard answers.');
 const launch=state.launch??emptyLaunch(now),ticket={id:`place-card:${now.toISOString()}:${launch.tickets.length}`,createdAt:now.toISOString(),ids:[...draft.ids],answers:[...draft.answers]},invite=await makeBottleInvite(state,ticket,crypto,now);
 const requested=options.drift??(current?postcardDriftPlan(current):defaultPostcardDrift(cityId,now.toISOString())),old=current?postcardDriftPlan(current):undefined,drift=readPostcardDrift({...requested,id:old&&old.startsAt===requested.startsAt&&old.cities.join('.')===requested.cities.join('.')?old.id:invite.id});if(!drift)throw new Error('Choose 10 different cities and a departure time.');
 return {ticket,invite,postcard:{id:invite.id,inviteId:invite.id,cityId,placeId,owner:state.profile.name,ageBand:state.profile.ageBand,placedAt:now.toISOString(),ticketId:ticket.id,drift,...(options.replaceId?{replaces:options.replaceId}:{})}};
}
/** Commit against the latest device state after signing; no match, favourite, visit or play is granted. */
export function placePostcard(state:PreviewState,prepared:PreparedPlacePostcard):PreviewState{
 const {postcard,invite,ticket}=prepared;
 if(!state.profile||state.profile.ageBand==='10-12'||state.profile.name!==postcard.owner||state.profile.ageBand!==postcard.ageBand||invite.person.name!==postcard.owner)throw new Error('Open your profile again to place this postcard.');
 if(invite.kind==='bottle'&&!readPostcardDrift(postcard.drift))throw new Error('Choose 10 different cities and a departure time.');
 if(!readPlacePostcards([postcard],[invite]).length||invite.ids.join('.')!==ticket.ids.join('.')||ticket.answers.length!==3||ticket.answers.some((a,i)=>!questionById(ticket.ids[i])?.choices?.some(c=>c.label===a)))throw new Error('Make your postcard again.');
 if(state.launch?.placePostcards?.some(p=>p.inviteId===invite.id))return state;
 const current=activePlacePostcard(state);if(postcard.replaces){if(current?.inviteId!==postcard.replaces)throw new Error('Your postcard changed. Open it again.');}else if(current){if(current.cityId===postcard.cityId&&current.placeId===postcard.placeId)return state;throw new Error('You have one postcard. Edit it to change your drift.');}
 const launch=state.launch??emptyLaunch(new Date(postcard.placedAt)),next=rememberInvite({...state,launch:{...launch,tickets:[...launch.tickets.filter(t=>t.id!==ticket.id),ticket].slice(-25)}},invite,new Date(postcard.placedAt));
 return {...next,launch:{...next.launch!,placePostcards:[...(next.launch!.placePostcards??[]),postcard].slice(-30)}};
}
