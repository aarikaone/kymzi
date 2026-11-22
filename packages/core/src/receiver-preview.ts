import type {TravelCityId} from './world-catalogue.ts';
import {readTravelProfile,travelPreview,type TravelProfile} from './travel-profile.ts';
import {UNLOCK_PREVIEW_AVATARS,LAUNCH_GUIDES,palFindingProgress,invitedFriends} from './launch.ts';
import {countryById,type CountryId} from './countries.ts';
import type {FriendInvite,FriendReply} from './launch.ts';
import type {PreviewState} from './preview.ts';
import type {Profile} from './types.ts';

/** A separate, stable local receiver for this invitation's in-app walkthrough.
 * Reopening the same card cannot credit another friend or replace the owner. */
export function receiverPreviewProfile(state:PreviewState,invite:FriendInvite):Profile {
 const owner=state.profile;
 if(!owner||owner.ageBand==='10-12'||invite.person.name!==owner.name)throw new Error('Open your own day card to preview its receiver.');
 const used=new Set([owner.name,...(state.launch?.postcards??[]).filter(r=>r.invite.id!==invite.id).map(r=>r.person.name)]);
 let number=100000+parseInt(invite.id.slice(0,8),16)%900000;
 while(used.has(String(number)))number=100000+(number-99999)%900000;
 const avatars=UNLOCK_PREVIEW_AVATARS.filter(a=>a!==owner.avatar);
 const own=readTravelProfile(owner.travel),knows=own.wishlist[0]?.cityId??'JP',dream=own.visited[0]?.cityId??'GB';
 const travel=travelPreview([...new Set<TravelCityId>([knows,'KR'])],[...new Set<TravelCityId>([dream,'KR','US','IT'])].slice(0,3));
 travel.arrivals=[{id:`receiver-wish:${invite.id}`,cityId:'KR',source:'demo',at:invite.createdAt,wishFulfilled:true}];
 return {name:String(number),username:'roamer_'+number,age13Confirmed:true,avatar:avatars[number%avatars.length],ageBand:owner.ageBand,travel};
}
export function receiverPreviewReply(state:PreviewState,invite:FriendInvite):FriendReply|undefined {
 const guest=receiverPreviewProfile(state,invite);
 return state.launch?.postcards.slice().reverse().find(r=>r.invite.id===invite.id&&r.person.name===guest.name);
}

/** Local illustrated updates for the invited circle. These are independent of
 * global match proofs, city unlocks, photo reveals and chat permissions. */
export function circleFriends(state:PreviewState) {
 return invitedFriends(state).map((reply,i)=>{
  const country=countryById(LAUNCH_GUIDES[i%LAUNCH_GUIDES.length])!;
  return {id:`circle:${reply.person.name}`,name:reply.person.name,...(reply.person.username?{username:reply.person.username}:{}),avatar:reply.person.avatar,connectedAt:reply.completedAt,countryId:country.id,city:country.city,country:country.name};
 });
}
