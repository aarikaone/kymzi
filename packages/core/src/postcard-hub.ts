import {readFriendReply,friendScore,challengeToken} from './launch.ts';
import {readPlacePostcards,activePlacePostcard,postcardVersions,postcardDriftPlan} from './place-postcards.ts';
import {myPostcardSignal} from './postcard-discovery.ts';
import {normalizedPlaceText} from './map-links.ts';
import {travelCityById} from './world-catalogue.ts';
import type {PreviewState} from './preview.ts';
/** Sender-side returns only. Outbound games, opened links and estimated impressions are never plays. */
export function postcardHub(state:PreviewState){
 const privateWorld=!state.profile||state.profile.ageBand==='10-12',owner=state.profile?.name,launch=state.launch,signal=myPostcardSignal(state);
 const invites=privateWorld?[]:(launch?.invites??[]).filter(i=>i.person.name===owner&&i.kind!=='friend'),owned=new Map(invites.map(i=>[i.id,challengeToken(i)])),seen=new Set<string>();
 const activity=(launch?.postcards??[]).flatMap(raw=>{try{const reply=readFriendReply(raw,new Date(raw.completedAt));if(privateWorld||seen.has(reply.id)||reply.person.name===owner||owned.get(reply.invite.id)!==challengeToken(reply.invite))return [];seen.add(reply.id);const score=friendScore(reply),origin=travelCityById(reply.playCityId);return [{id:reply.id,inviteId:reply.invite.id,at:reply.completedAt,alias:reply.person.name,avatar:reply.person.avatar,city:origin?.city??reply.person.city?.trim()??'City not shared',country:origin?.name??reply.person.country?.trim()??'',matched:score.connects,shared:score.shared,driftId:(()=>{const p=readPlacePostcards(launch?.placePostcards,invites).find(p=>p.inviteId===reply.invite.id);return p?postcardDriftPlan(p).id:undefined;})()}];}catch{return [];}}).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
 const placed=postcardVersions(state),active=activePlacePostcard(state),cards=invites.filter(i=>i.id===active?.inviteId).map(invite=>{const place=placed.find(p=>p.inviteId===invite.id),city=travelCityById(place?.cityId),plays=activity.filter(e=>placed.some(p=>p.inviteId===e.inviteId));return {inviteIds:placed.map(p=>p.inviteId),drift:postcardDriftPlan(place!),inviteId:invite.id,createdAt:invite.createdAt,cityId:place?.cityId,placeId:place?.placeId,label:city?.city??'Your travel day',flag:city?.flag??'',plays:plays.length,matched:plays.filter(e=>e.matched).length,missed:plays.filter(e=>!e.matched).length,status:'drifting' as const};}).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 const cities=new Map<string,{id:string;city:string;country:string;plays:number;matched:number;missed:number;latest:string}>();
 for(const event of activity){const id=JSON.stringify([normalizedPlaceText(event.city),normalizedPlaceText(event.country)]),row=cities.get(id)??{id,city:event.city,country:event.country,plays:0,matched:0,missed:0,latest:event.at};row.plays++;if(event.matched)row.matched++;else row.missed++;cities.set(id,row);}
 const matched=activity.filter(e=>e.matched).length;
 return {private:privateWorld,cards,activity,cities:[...cities.values()].sort((a,b)=>b.plays-a.plays||Date.parse(b.latest)-Date.parse(a.latest)||a.city.localeCompare(b.city)),played:activity.length,matched,missed:activity.length-matched,signal};
}
