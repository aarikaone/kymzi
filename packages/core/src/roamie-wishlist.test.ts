import {VISITED_JPEGS} from './visited-photo-fixture.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {emptyPreview,emptyLaunch,travelPreview,sharedTravel,readSharedTravel,roamieTravels,pickRoamieWish,seedGlobalPals,simulatePalUnlock,readPreview,fulfillTravelWish,stageWishPhotos,addVisitedPhoto,TRAVEL_CITIES,beginDayCard,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,questionById,makeFriendInvite,answerFriendInvite,challengeToken,replyFromToken,type PreviewState} from './index.ts';
const now=new Date('2026-11-22T06:00:00Z');
const seed=():PreviewState=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',travel:travelPreview(['GB'],['JP','FR','IT'],now)},launch:emptyLaunch(now)},now),now);
test('shared wishlist picks are validated, compact and compatible with older city-only postcards',()=>{
 const shared=sharedTravel(travelPreview(['GB'],['JP','FR','IT'],now))!;
 assert.deepEqual(shared.wishlistPlaces?.[0],{cityId:'JP',attractionIds:['jp-1','jp-2']});assert.deepEqual(sharedTravel({...travelPreview([],['JP'],now),wishlist:[{cityId:'JP',attractionIds:['jp-1','jp-2','jp-3']}]})!.wishlistPlaces![0].attractionIds,['jp-1','jp-2','jp-3']);assert.deepEqual(readSharedTravel(JSON.parse(JSON.stringify(shared))),shared);
 const legacy={visited:['GB'],wishlist:['JP'],fulfilled:[]};assert.deepEqual(readSharedTravel(legacy),legacy);
 const dirty=readSharedTravel({...shared,wishlistPlaces:[{cityId:'JP',attractionIds:['jp-1','jp-1','fr-1']},{cityId:'GB',attractionIds:['gb-1']},{cityId:'bad',attractionIds:['jp-1']}]})!;
 assert.deepEqual(dirty.wishlistPlaces,[{cityId:'JP',attractionIds:['jp-1']}]);assert.equal(JSON.stringify(shared).includes('memories'),false);
});
test('picking a connected Roamie’s wish merges once, survives restoration and leaves social progress and visits unchanged',()=>{
 const s=seed(),roamie=roamieTravels(s)[0],wish=roamie.travel.wishlistPlaces![0],place=wish.attractionIds[0],original=JSON.stringify(roamie.travel),next=pickRoamieWish(s,roamie.id,wish.cityId,place);
 assert.equal(next.profile!.travel!.wishlist.find(c=>c.cityId===wish.cityId)!.attractionIds.includes(place),true);assert.equal(pickRoamieWish(next,roamie.id,wish.cityId,place),next);
 assert.deepEqual(next.daily,s.daily);assert.deepEqual(next.social,s.social);assert.deepEqual(next.launch,s.launch);assert.deepEqual(next.profile!.travel!.visited,s.profile!.travel!.visited);assert.deepEqual(next.profile!.travel!.arrivals,s.profile!.travel!.arrivals);assert.equal(JSON.stringify(roamie.travel),original);
 assert.deepEqual(readPreview(JSON.parse(JSON.stringify(next)),now).profile!.travel,next.profile!.travel);
 let photoDraft=stageWishPhotos(next.profile!.travel!,wish.cityId,place);for(const image of VISITED_JPEGS.slice(0,5))photoDraft=addVisitedPhoto(photoDraft,wish.cityId,image,place,now);const done={...next,profile:{...next.profile!,travel:fulfillTravelWish(photoDraft,wish.cityId,place,now)}};assert.equal(pickRoamieWish(done,roamie.id,wish.cityId,place),done);
 assert.throws(()=>pickRoamieWish(s,'stranger',wish.cityId,place));assert.throws(()=>pickRoamieWish(s,roamie.id,wish.cityId,'not-a-place'));
 assert.throws(()=>pickRoamieWish({...s,profile:{...s.profile!,ageBand:'10-12'}},roamie.id,wish.cityId,place));
});
test('both people’s shared wish picks fit the postcard URL and round-trip without exposing photos',async()=>{
 const cities=[...TRAVEL_CITIES].sort((a,b)=>b.id.length-a.id.length).slice(0,26).map(c=>c.id),travel=travelPreview(cities,cities,now);travel.wishlist=cities.map(cityId=>({cityId,attractionIds:TRAVEL_CITIES.find(c=>c.id===cityId)!.placeIds.slice(0,20)}));
 let s:PreviewState=beginDayCard({...seed(),profile:{...seed().profile!,travel}},now);for(let i=0;i<3;i++){s=answerInvitePreparation(s,i,questionById(s.launch!.preparation!.ids[i])!.choices![0].label);s=submitInvitePreparation(s,i);}s=finishInvitePreparation(s,now);
 const crypto={nonce:()=> 'a'.repeat(32),digest:async(v:string)=>createHash('sha256').update(v).digest('hex')},invite=await makeFriendInvite(s,crypto,now),reply=await answerFriendInvite(invite,{...s.profile!,name:'654321'},s.launch!.tickets.at(-1)!.answers,crypto,now),token=challengeToken(reply);
 assert.ok(token.length<6000,`Postcard too large: ${token.length}`);assert.deepEqual(replyFromToken(token,now),reply);assert.equal(JSON.stringify(reply).includes('memories'),false);assert.equal(reply.person.travel!.wishlistPlaces!.flatMap(c=>c.attractionIds).length,6);
});
