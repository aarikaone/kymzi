import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {answerFriendInvite,answerInvitePreparation,beginDayCard,collectPostcard,emptyLaunch,emptyPreview,finishInvitePreparation,makeFriendInvite,palFindingProgress,questionById,readPreview,receiverPreviewProfile,receiverPreviewReply,rememberInvite,submitInvitePreparation,type ChallengeCrypto} from './index.ts';
const now=new Date('2026-11-20T05:00:00Z');
const crypto:ChallengeCrypto={nonce:()=> 'a'.repeat(32),digest:async v=>createHash('sha256').update(v).digest('hex')};
function seed(){let s=beginDayCard({...emptyPreview(now),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,city:'Bengaluru',country:'India',photo:undefined},launch:emptyLaunch(now)},now);for(let i=0;i<3;i++)s=submitInvitePreparation(answerInvitePreparation(s,i,questionById(s.launch!.preparation!.ids[i])!.choices![0].label),i);return finishInvitePreparation(s,now);}
test('receiver walkthrough completes a separate anonymous friend and preserves owner, games and reveal proofs',async()=>{
 let s=seed();const before=s,invite=await makeFriendInvite(s,crypto,now);s=rememberInvite(s,invite,now);const guest=receiverPreviewProfile(s,invite);
 assert.notEqual(guest.name,s.profile!.name);assert.notEqual(guest.avatar,s.profile!.avatar);assert.equal(guest.ageBand,s.profile!.ageBand);assert.equal(guest.city,undefined);assert.equal(guest.photo,undefined);
 const reply=await answerFriendInvite(invite,guest,s.launch!.tickets[0].answers,crypto,now);s=collectPostcard(s,reply,now);
 assert.equal(palFindingProgress(s).count,1);assert.equal(palFindingProgress(s).canPlay,false);assert.deepEqual(s.profile,before.profile);assert.deepEqual(s.daily,before.daily);assert.deepEqual(s.social,before.social);
 s=readPreview(JSON.parse(JSON.stringify(s)),now);assert.equal(receiverPreviewReply(s,invite)?.id,reply.id);assert.equal(receiverPreviewProfile(s,invite).name,guest.name);assert.equal(collectPostcard(s,reply,now),s);
});
test('each new invitation walkthrough chooses a distinct receiver even when generated names would collide',async()=>{
 let s=seed();const names=new Set<string>();
 for(let i=0;i<5;i++){
  const invite=await makeFriendInvite(s,{...crypto,nonce:()=> 'a'.repeat(8)+String(i).repeat(24)},now);s=rememberInvite(s,invite,now);const guest=receiverPreviewProfile(s,invite);assert.equal(names.has(guest.name),false);names.add(guest.name);
  const reply=await answerFriendInvite(invite,guest,s.launch!.tickets[0].answers,{...crypto,nonce:()=>String(i).repeat(32)},now);s=collectPostcard(s,reply,now);assert.equal(palFindingProgress(s).count,i+1);
 }
 assert.equal(palFindingProgress(s).unlocked,true);assert.equal(s.daily.playsToday,0);assert.equal(s.social.proofs.length,0);
});
test('receiver walkthrough cannot be started for a child or another sender',async()=>{
 const s=seed(),invite=await makeFriendInvite(s,crypto,now);assert.throws(()=>receiverPreviewProfile({...s,profile:{...s.profile!,ageBand:'10-12'}},invite));assert.throws(()=>receiverPreviewProfile(s,{...invite,person:{...invite.person,name:'654321'}}));
});
