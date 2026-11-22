import {sharedTravel,travelCityById,type FriendInvite,type Profile,type TravelCityId} from '@rymzi/core';
export function invitationPerson(profile:Profile):FriendInvite['person']{return {name:profile.name,username:profile.username,avatar:profile.avatar,travel:sharedTravel(profile.travel)};}
export function invitationCities(person:FriendInvite['person']){
 const ids=[...new Set<TravelCityId>([...(person.travel?.wishlist??[]),...(person.travel?.visited??[]),'JP','FR','IT'])];
 return ids.map(travelCityById).filter((c):c is NonNullable<typeof c>=>!!c).slice(0,3);
}
export const FRIEND_INVITE_MESSAGE='Join me on Kymzi. Let’s explore new places together.';
