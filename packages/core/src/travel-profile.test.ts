import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {emptyPreview,emptyLaunch,emptyTravel,travelWishCount,travelCityById,setTravelCity,completeTravelProfile,readTravelProfile,readPreview,recordCityArrival,previewCityEvidence,CITY_CENTRES,cityDistanceKm,sharedTravel,readSharedTravel,travelPreview,beginDayCard,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,questionById,makeFriendInvite,rememberInvite,answerFriendInvite,collectPostcard,receiverPreviewProfile,roamieTravels,travelMilestones,palFindingProgress,challengeToken,inviteFromToken,seedGlobalPals,simulatePalUnlock,palSummaries,beginPerfectDayPlay,type PreviewState,type CityEvidence,type CountryId} from './index.ts';
const now=new Date('2026-11-21T05:00:00Z');
const profile={name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,travel:travelPreview(['GB'],['JP','FR','IT'],now)};
const seed=():PreviewState=>({...emptyPreview(now),profile,launch:emptyLaunch(now)});
const evidence=(id:CountryId):CityEvidence=>({source:'device',latitude:CITY_CENTRES[id][0],longitude:CITY_CENTRES[id][1],accuracy:20,observedAt:now.getTime()});
test('visited cities are optional; completion requires three distinct attractions, even in one city',()=>{
 assert.throws(()=>completeTravelProfile(emptyTravel(),now),/three/);
 const one=setTravelCity(emptyTravel(),'wishlist',{cityId:'JP',attractionIds:['jp-1','jp-1','invalid','fr-1']});assert.equal(travelWishCount(one),1);assert.throws(()=>completeTravelProfile(one,now),/three/);
 const three=setTravelCity(one,'wishlist',{cityId:'JP',attractionIds:['jp-1','jp-2','jp-3']});const done=completeTravelProfile(three,now);assert.equal(done.visited.length,0);assert.equal(done.wishlist.length,1);assert.equal(travelWishCount(done),3);
 assert.throws(()=>completeTravelProfile({...emptyTravel(),wishlist:['JP','FR','IT'].map(cityId=>({cityId,attractionIds:[]}))},now),/three/);
});
test('wishlist places have no three-city cap and survive storage without duplicate spots',()=>{
 let draft=emptyTravel();for(const cityId of ['JP','FR','IT','US'] as const)draft=setTravelCity(draft,'wishlist',{cityId,attractionIds:travelCityById(cityId)!.placeIds.slice(0,2)});
 const done=completeTravelProfile(draft,now);assert.equal(done.wishlist.length,4);assert.equal(travelWishCount(done),8);assert.equal(travelWishCount(readTravelProfile(JSON.parse(JSON.stringify(done)))),8);assert.equal(readSharedTravel(sharedTravel(done))!.wishlist.length,4);
});
test('a declared visit or wishlist edit never creates a check-in or fulfils a wish',()=>{
 let t=setTravelCity(profile.travel,'visited',{cityId:'JP',attractionIds:['jp-1']});t=completeTravelProfile(t,now);assert.equal(t.arrivals.length,0);assert.equal(travelMilestones({...seed(),profile:{...profile,travel:t}}).length,0);
});
test('device city-area check-ins require fresh accurate coordinates in the selected city',()=>{
 const s=seed();assert.equal(cityDistanceKm('JP',...CITY_CENTRES.JP),0);
 assert.throws(()=>recordCityArrival(s,'JP',evidence('FR'),now),/doesn’t match/);assert.throws(()=>recordCityArrival(s,'JP',{...evidence('JP'),observedAt:now.getTime()-121000},now),/fresh/);assert.throws(()=>recordCityArrival(s,'JP',{...evidence('JP'),accuracy:2000},now),/accurate/);assert.throws(()=>recordCityArrival(s,'JP',{...evidence('JP'),latitude:NaN},now),/doesn’t match/);assert.throws(()=>recordCityArrival(s,'JP',{...evidence('JP'),source:'manual' as never},now));
 const arrived=recordCityArrival(s,'JP',evidence('JP'),now);assert.equal(arrived.profile!.travel!.arrivals[0].wishFulfilled,true);assert.equal(arrived.profile!.travel!.arrivals[0].source,'device');assert.equal(arrived.profile!.travel!.visited.some(c=>c.cityId==='JP'),true);assert.equal(recordCityArrival(arrived,'JP',evidence('JP'),now),arrived);
 assert.deepEqual(arrived.daily,s.daily);assert.deepEqual(arrived.social,s.social);assert.deepEqual(arrived.placeJournal,s.placeJournal);assert.equal(palFindingProgress(arrived).canPlay,false);assert.equal(JSON.stringify(arrived.profile).includes('latitude'),false);assert.equal(JSON.stringify(arrived.profile).includes('longitude'),false);
 const restored=readPreview(JSON.parse(JSON.stringify(arrived)),now);assert.deepEqual(restored.profile!.travel,arrived.profile!.travel);assert.equal(travelMilestones(restored).length,1);
});
test('preview arrivals stay marked demo and can be upgraded to a device check-in',()=>{
 const demo=recordCityArrival(seed(),'JP',previewCityEvidence('JP',now),now);assert.equal(travelMilestones(demo)[0].source,'demo');const real=recordCityArrival(demo,'JP',evidence('JP'),now);assert.equal(real.profile!.travel!.arrivals.length,1);assert.equal(travelMilestones(real)[0].source,'device');assert.equal(recordCityArrival(real,'JP',previewCityEvidence('JP',now),now),real);
});
test('a check-in outside the wishlist adds a visited city without inventing a wish milestone',()=>{
 const next=recordCityArrival(seed(),'US',evidence('US'),now);assert.equal(next.profile!.travel!.visited.some(v=>v.cityId==='US'),true);assert.equal(next.profile!.travel!.arrivals[0].wishFulfilled,false);assert.equal(travelMilestones(next).length,0);
});
test('travel data migrates defensively and public travel summaries contain no precise location',()=>{
 const t=readTravelProfile({wishlist:[{cityId:'JP',attractionIds:['jp-1','fr-1']},{cityId:'JP'},{cityId:'bad'}],visited:[{cityId:'GB',attractionIds:['gb-1']}],arrivals:[{cityId:'JP',source:'manual',at:now.toISOString(),wishFulfilled:true}]});assert.equal(t.wishlist.length,1);assert.deepEqual(t.wishlist[0].attractionIds,['jp-1']);assert.equal(t.arrivals.length,0);assert.equal(readSharedTravel(null),undefined);
 const shared=sharedTravel(recordCityArrival(seed(),'JP',evidence('JP'),now).profile!.travel)!;assert.deepEqual(shared.wishlist,['JP','FR','IT']);assert.equal(shared.fulfilled[0].cityId,'JP');assert.equal(JSON.stringify(shared).includes('latitude'),false);
});
test('returned friend cards share cities and wishes without opening worldwide matching before five friends',async()=>{
 const crypto={nonce:()=> 'a'.repeat(32),digest:async(v:string)=>createHash('sha256').update(v).digest('hex')};let s=beginDayCard(seed(),now);for(let i=0;i<3;i++){s=answerInvitePreparation(s,i,questionById(s.launch!.preparation!.ids[i])!.choices![0].label);s=submitInvitePreparation(s,i);}s=finishInvitePreparation(s,now);const invite=await makeFriendInvite(s,crypto,now);assert.ok(challengeToken(invite).length<6000);assert.deepEqual(inviteFromToken(challengeToken(invite),now).person.travel?.wishlist,['JP','FR','IT']);s=rememberInvite(s,invite,now);const guest=receiverPreviewProfile(s,invite),reply=await answerFriendInvite(invite,guest,s.launch!.tickets[0].answers,crypto,now);s=collectPostcard(s,reply,now);
 const roamie=roamieTravels(s)[0];assert.equal(roamie.travel.visited.includes('JP'),true);assert.equal(roamie.travel.wishlist.includes('GB'),true);assert.equal(travelMilestones(s).some(e=>!e.you&&e.source==='demo'),true);assert.equal(palFindingProgress(s).count,1);assert.equal(palFindingProgress(s).canPlay,false);assert.equal(s.social.proofs.length,0);
 const child={...s,profile:{...s.profile!,ageBand:'10-12' as const}};assert.equal(roamieTravels(child).length,0);
});

test('global starter Roamies and unstarted games favour the three dream cities without spending a play',()=>{
 const state={...seed(),profile:{...profile,travel:travelPreview([],['KR','IT','SG'],now)}},world=seedGlobalPals(simulatePalUnlock(state,now),now,'UTC');assert.deepEqual(palSummaries(world).map(p=>p.countryId).sort(),['IT','KR','SG']);const game=beginPerfectDayPlay(world,now);assert.equal(game.daily.active!.countryId,'KR');assert.equal(game.daily.playsToday,0);
});
test('a newly added wish needs a new check-in even when the city was previously visited',()=>{
 const visited=recordCityArrival(seed(),'US',evidence('US'),now);assert.equal(travelMilestones(visited).length,0);const travel={...visited.profile!.travel!,wishlist:[...visited.profile!.travel!.wishlist.slice(0,2),{cityId:'US' as const,attractionIds:[]}]},wished={...visited,profile:{...visited.profile!,travel}};assert.equal(travelMilestones(wished).length,0);const next=recordCityArrival(wished,'US',evidence('US'),now);assert.equal(travelMilestones(next).length,1);
});
