import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {emptyPreview,emptyLaunch,initialPlacePostcard,preparePlacePostcard,placePostcard,placePostcardAt,placePostcardOpened,readPlacePostcards,readPreview,questionById,palFindingProgress,answerFriendInvite,receiverPreviewProfile,collectPostcard,type PreviewState} from './index.ts';
const now=new Date('2026-11-22T08:00:00Z');
const state=():PreviewState=>({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(now)});
const crypto={nonce:()=> 'a'.repeat(32),digest:async(v:string)=>createHash('sha256').update(v).digest('hex')};
const draft=(s:PreviewState)=>{const d=initialPlacePostcard(s,now);return {...d,answers:d.ids.map(id=>questionById(id)!.choices![0].label)};};
test('placing a postcard binds the selected attraction without saving it, matching anyone or spending a play',async()=>{
 const s=state(),prepared=await preparePlacePostcard(s,'JP','jp-3',draft(s),crypto,now);assert.equal(s.launch!.invites.length,0);const next=placePostcard(s,prepared),record=placePostcardAt(next,'JP','jp-3')!;
 assert.equal(record.placeId,'jp-3');assert.equal(record.cityId,'JP');assert.equal(next.launch!.invites[0].id,record.inviteId);assert.deepEqual(next.launch!.places,[]);assert.deepEqual(next.daily,s.daily);assert.deepEqual(next.social,s.social);assert.deepEqual(next.profile,s.profile);assert.equal(palFindingProgress(next).canPlay,false);assert.equal(palFindingProgress(next).count,0);assert.equal(placePostcardOpened(next,record),false);
 assert.equal(placePostcard(next,prepared),next);const restored=readPreview(JSON.parse(JSON.stringify(next)),now);assert.deepEqual(placePostcardAt(restored,'JP','jp-3'),record);assert.equal(initialPlacePostcard(restored,now).answers.length,3);
});
test('a confirmed two-pick receiver reply opens the postcard; placement alone cannot grant a Roamie',async()=>{
 const s=state(),d=draft(s),prepared=await preparePlacePostcard(s,'JP','jp-3',d,crypto,now),placed=placePostcard(s,prepared),guest=receiverPreviewProfile(placed,prepared.invite),reply=await answerFriendInvite(prepared.invite,guest,d.answers,crypto,now),opened=collectPostcard(placed,reply,now);
 assert.equal(placePostcardOpened(placed,prepared.postcard),false);assert.equal(placePostcardOpened(opened,prepared.postcard),true);assert.equal(palFindingProgress(opened).count,1);assert.equal(palFindingProgress(opened).canPlay,false);assert.deepEqual(opened.daily,s.daily);
});
test('placement merges into the latest state, preserves an existing game, and rejects private or mismatched places',async()=>{
 const s=state(),d=draft(s),prepared=await preparePlacePostcard(s,'JP','jp-3',d,crypto,now),newer={...s,daily:{...s.daily,playsToday:3},launch:{...s.launch!,places:['fr-1']}};
 const next=placePostcard(newer,prepared);assert.equal(next.daily.playsToday,3);assert.deepEqual(next.launch!.places,['fr-1']);assert.deepEqual(next.profile,newer.profile);
 await assert.rejects(()=>preparePlacePostcard(s,'JP','fr-1',d,crypto,now));await assert.rejects(()=>preparePlacePostcard(s,'JP','jp-3',{...d,answers:['x','y','z']},crypto,now));await assert.rejects(()=>preparePlacePostcard({...s,profile:{...s.profile!,ageBand:'10-12'}},'JP','jp-3',d,crypto,now));
 assert.throws(()=>placePostcard({...s,profile:{...s.profile!,name:'654321'}},prepared));assert.equal(readPlacePostcards([{...prepared.postcard,placeId:'fr-1'}],[prepared.invite]).length,0);assert.equal(readPlacePostcards([prepared.postcard],[]).length,0);assert.equal(readPlacePostcards([prepared.postcard,prepared.postcard],[prepared.invite]).length,1);
});
