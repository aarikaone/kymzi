import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {travelQuestionBank,TRAVEL_COLLECTIONS,questionById,attractionById,travelQuestionsForDay,beginDayCard,hasDayCard,founderJourney,perfectDayPicks,emptyPreview,emptyLaunch,beginInvitePreparation,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,invitePreparationIndex,beginPerfectDayPlay,simulatePalUnlock,answerDaily,submitDaily,finishLaunchPlay,readPreview,palSummaries,makeFriendInvite,rememberInvite,answerFriendInvite,collectPostcard,friendScore,senderPostcardPicks,openFriendPostcard,inviteQuestions,challengeURL,palFindingProgress,type PreviewState,type ChallengeCrypto} from './index.ts';
const now=new Date('2026-11-20T05:00:00Z');
const seed=():PreviewState=>({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(now)});
const crypto:ChallengeCrypto={nonce:()=> 'a'.repeat(32),digest:async v=>createHash('sha256').update(v).digest('hex')};
function prepare(){let s=beginDayCard(seed(),now);for(let i=0;i<3;i++){s=answerInvitePreparation(s,i,questionById(s.launch!.preparation!.ids[i])!.choices![0].label);s=submitInvitePreparation(s,i);}return finishInvitePreparation(s,now);}
function finish(s:PreviewState){for(const id of s.daily.active!.ids)s={...s,daily:answerDaily(s.daily,id,questionById(id)!.choices![0].label,now)};return finishLaunchPlay(s,now);}
test('travel catalogue contains exactly 1,000 unique complete questions with six illustrated answers',()=>{
 assert.equal(travelQuestionBank.length,1000);assert.equal(new Set(travelQuestionBank.map(q=>q.id)).size,1000);
 assert.equal(new Set(travelQuestionBank.map(q=>q.prompt.toLowerCase().replace(/[^a-z0-9]/g,''))).size,1000);
 const families=new Map<string,number>();for(const q of travelQuestionBank){assert.equal(q.choices!.length,6);assert.equal(new Set(q.choices!.map(c=>c.label)).size,6);assert.equal(q.answer_format,'single_choice');assert.equal(q.min_age,10);assert.equal(q.max_age,30);assert.ok(q.prompt.endsWith('?'));for(const c of q.choices!){assert.ok(c.label.length<=40);assert.ok(attractionById(c.artworkId));}families.set(q.familyId!,1+(families.get(q.familyId!)??0));}
 assert.equal(families.size,25);assert.ok([...families.values()].every(n=>n===40));
});
test('each collection draws a stable varied trio without repeating used questions',()=>{
 for(const topic of TRAVEL_COLLECTIONS){const first=travelQuestionsForDay('2026-11-20','25-30',[],topic.id);assert.deepEqual(first,travelQuestionsForDay('2026-11-20','25-30',[],topic.id));assert.equal(first.length,3);assert.equal(new Set(first.map(q=>q.familyId)).size,3);assert.ok(first.every(q=>q.topicId===topic.id));const next=travelQuestionsForDay('2026-11-20','25-30',first.map(q=>q.id),topic.id,1);assert.ok(next.every(q=>!first.some(p=>p.id===q.id)));}
});
test('a first day card is free, resumes selected choices, rejects typing and migrates only free legacy preparation',()=>{
 let s=beginDayCard(seed(),now);assert.equal(founderJourney(s).stage,'make-day');const ids=s.launch!.preparation!.ids,choice=questionById(ids[0])!.choices![0].label;
 assert.throws(()=>answerInvitePreparation(s,0,'arbitrary typing'),/six choices/);s=submitInvitePreparation(answerInvitePreparation(s,0,choice),0);s=readPreview(JSON.parse(JSON.stringify(s)),now);assert.equal(invitePreparationIndex(beginDayCard(s,now)),1);assert.equal(s.launch!.preparation!.answers[0],choice);assert.equal(s.daily.playsToday,0);assert.equal(s.social.proofs.length,0);
 const legacy=beginInvitePreparation(seed(),now),migrated=beginDayCard(legacy,now);assert.ok(migrated.launch!.preparation!.ids.every(id=>id.startsWith('T')));assert.deepEqual(migrated.daily,legacy.daily);
 s=prepare();assert.equal(hasDayCard(s),true);assert.equal(perfectDayPicks(s).length,3);assert.equal(founderJourney(s).stage,'build-circle');assert.equal(s.daily.playsToday,0);assert.equal(palFindingProgress(s).count,0);
});
test('global picks stay free until first submission, resume on reload, and preserve match proofs',()=>{
 let s=beginPerfectDayPlay(simulatePalUnlock(prepare(),now),now,undefined,'food');const id=s.daily.active!.ids[0];assert.equal(s.daily.playsToday,0);assert.throws(()=>answerDaily(s.daily,id,'typed choice',now),/six choices/);
 s={...s,daily:answerDaily(s.daily,id,questionById(id)!.choices![0].label,now)};assert.equal(s.daily.playsToday,0);s={...s,daily:submitDaily(s.daily,id,now)};assert.equal(s.daily.playsToday,1);
 const active=s.daily.active;s=readPreview(JSON.parse(JSON.stringify(s)),now);s=beginPerfectDayPlay(s,now,undefined,'animals');assert.deepEqual(s.daily.active,active);s=finish(s);const copy=readPreview(JSON.parse(JSON.stringify(s)),now);assert.deepEqual(copy.social.proofs,s.social.proofs);assert.deepEqual(copy.daily,s.daily);assert.equal(s.daily.playsToday,1);assert.ok(s.daily.lastQuestionIds.every(id=>id.startsWith('T')));
});
test('global travel play retains five daily plays and the five-match Roamie limit',()=>{
 let s=simulatePalUnlock(prepare(),now);s=finish(beginPerfectDayPlay(s,now,undefined,'food'));const pal=palSummaries(s).find(p=>p.id===s.social.proofs.at(-1)!.peerId)!;
 for(let i=1;i<5;i++)s=finish(beginPerfectDayPlay(s,now,pal.id,'food'));
 assert.equal(palSummaries(s).find(p=>p.id===pal.id)!.matches,5);assert.throws(()=>beginPerfectDayPlay(s,now,pal.id,'food'));
 assert.equal(s.daily.playsToday,5);assert.throws(()=>beginPerfectDayPlay(s,now));
});
test('five distinct completed friend cards open worldwide matching; sharing and duplicate replies never grant credit',async()=>{
 let s=prepare();assert.throws(()=>beginPerfectDayPlay(s,now));const answers=s.launch!.tickets[0].answers,invite=await makeFriendInvite(s,crypto,now);s=rememberInvite(s,invite,now);assert.equal(palFindingProgress(s).count,0);assert.ok(challengeURL('http://localhost:4178',invite).startsWith('http://localhost:4178/#/challenge/'));for(const a of answers)assert.equal(JSON.stringify(invite).includes(a),false);
 await assert.rejects(answerFriendInvite(invite,{...s.profile!,name:'654321'},['typed','invalid','answers'],crypto,now),/six choices/);
 for(let i=1;i<=5;i++){const guest={...s.profile!,name:String(600000+i)},opts=[...answers];if(i===1)opts[2]=questionById(invite.ids[2])!.choices!.find(c=>c.label!==opts[2])!.label;
 const reply=await answerFriendInvite(invite,guest,opts,{...crypto,nonce:()=>String(i).repeat(32)},now);if(i===1)assert.equal(friendScore(reply).shared,2);s=collectPostcard(s,reply,now);assert.equal(collectPostcard(s,reply,now),s);assert.equal(palFindingProgress(s).count,i);assert.equal(palFindingProgress(s).unlocked,i===5);}
 assert.equal(founderJourney(s).stage,'world-open');assert.equal(s.daily.playsToday,0);assert.equal(s.social.proofs.length,0);assert.equal(readPreview(JSON.parse(JSON.stringify(s)),now).launch!.friendCredits.length,5);
});
test('younger explorers keep a private travel game without referral invitations or social matches',()=>{
 const s={...seed(),profile:{...seed().profile!,ageBand:'10-12' as const}};assert.throws(()=>beginDayCard(s,now));const played=finish(beginPerfectDayPlay(s,now,undefined,'animals'));assert.equal(played.social.proofs.length,0);assert.equal(played.daily.playsToday,1);
});

test('travel invitations connect at 50% or above and lower matches never credit the global gate',async()=>{
 let state=prepare();const answers=state.launch!.tickets[0].answers,invite=await makeFriendInvite(state,crypto,now);state=rememberInvite(state,invite,now);
 for(let shared=0;shared<=3;shared++){
  const picks=answers.map((value,i)=>i<shared?value:questionById(invite.ids[i])!.choices!.find(c=>c.label!==value)!.label),guest={...state.profile!,name:String(800000+shared)};
  const reply=await answerFriendInvite(invite,guest,picks,{...crypto,nonce:()=>String(shared+1).repeat(32)},now),score=friendScore(reply),result=collectPostcard(state,reply,now);
  assert.equal(score.shared,shared);assert.equal(score.percentage,[0,33,67,100][shared]);assert.equal(score.connects,shared>=2);
  assert.equal(result.launch!.postcards.length,1);assert.equal(palFindingProgress(result).count,shared>=2?1:0);assert.equal(result.social.proofs.length,0);assert.deepEqual(result.daily,state.daily);
  assert.equal(palFindingProgress(readPreview(JSON.parse(JSON.stringify(result)),now)).count,shared>=2?1:0);
 }
 const guest={...state.profile!,name:'899999'},miss=answers.map((v,i)=>questionById(invite.ids[i])!.choices!.find(c=>c.label!==v)!.label);
 state=collectPostcard(state,await answerFriendInvite(invite,guest,miss,{...crypto,nonce:()=> 'b'.repeat(32)},now),now);
 assert.equal(palFindingProgress(state).count,0);
 state=collectPostcard(state,await answerFriendInvite(invite,guest,answers,{...crypto,nonce:()=> 'c'.repeat(32)},now),now);
 assert.equal(palFindingProgress(state).count,1);assert.equal(state.launch!.friendCredits.length,1);
});

test('a sealed postcard opens only at two matches and reveals the sender’s original day',async()=>{
 const state=prepare(),answers=state.launch!.tickets[0].answers,invite=await makeFriendInvite(state,crypto,now),guest={...state.profile!,name:'654321'};
 assert.deepEqual(inviteQuestions(invite).map(q=>q.id),invite.ids);
 for(let shared=0;shared<=3;shared++){
  const picks=answers.map((answer,i)=>i<shared?answer:questionById(invite.ids[i])!.choices!.find(c=>c.label!==answer)!.label),reply=await answerFriendInvite(invite,guest,picks,{...crypto,nonce:()=>String(shared+1).repeat(32)},now);
  let calls=0;const revealCrypto={digest:async(value:string)=>{calls++;return crypto.digest(value);}};
  if(shared<2){await assert.rejects(openFriendPostcard(reply,revealCrypto),/Match at least 2/);assert.equal(calls,0);}
  else{const card=await openFriendPostcard(reply,revealCrypto);assert.deepEqual(card.map(p=>p.label),answers);assert.deepEqual(card.map(p=>p.id),invite.ids);assert.ok(card.every(p=>!!attractionById(p.artworkId)));if(shared===2)assert.notEqual(card[2].label,picks[2]);}
 }
});

test('sender preview verifies the exact shared invite instead of displaying a newer travel day',async()=>{
 const state=prepare(),original=state.launch!.tickets[0],invite=await makeFriendInvite(state,crypto,now),later={...original,id:'newer-day',answers:original.ids.map(id=>questionById(id)!.choices![1].label)},changed={...state,launch:{...state.launch!,tickets:[original,later]}};
 const before=JSON.stringify(changed),picks=await senderPostcardPicks(changed,invite,crypto);assert.deepEqual(picks.map(p=>p.label),original.answers);assert.deepEqual(picks.map(p=>p.id),invite.ids);assert.notDeepEqual(picks.map(p=>p.label),later.answers);assert.equal(JSON.stringify(changed),before);
 const missing={...state,launch:{...state.launch!,tickets:[later]}};assert.deepEqual(await senderPostcardPicks(missing,invite,crypto),[]);
});
test('a sender preview never shows saved answers for a different owner',async()=>{
 const state=prepare(),invite=await makeFriendInvite(state,crypto,now);let calls=0;const digest=async(value:string)=>{calls++;return crypto.digest(value);};
 assert.deepEqual(await senderPostcardPicks({...state,profile:{...state.profile!,name:'654321'}},invite,{digest}),[]);assert.equal(calls,0);
});
