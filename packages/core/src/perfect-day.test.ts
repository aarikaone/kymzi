import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {travelQuestionBank,TRAVEL_COLLECTIONS,questionById,attractionById,travelQuestionsForDay,beginDayCard,hasDayCard,founderJourney,perfectDayPicks,emptyPreview,emptyLaunch,beginInvitePreparation,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,invitePreparationIndex,beginPerfectDayPlay,simulatePalUnlock,answerDaily,submitDaily,finishLaunchPlay,readPreview,palSummaries,makeFriendInvite,rememberInvite,answerFriendInvite,collectPostcard,friendScore,challengeURL,palFindingProgress,type PreviewState,type ChallengeCrypto} from './index.ts';
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
test('global travel play retains five daily plays and the five-match roamie limit',()=>{
 let s=simulatePalUnlock(prepare(),now);s=finish(beginPerfectDayPlay(s,now,undefined,'food'));const pal=palSummaries(s).find(p=>p.id===s.social.proofs.at(-1)!.peerId)!;
 for(let i=1;i<5;i++)s=finish(beginPerfectDayPlay(s,now,pal.id,'food'));
 assert.equal(palSummaries(s).find(p=>p.id===pal.id)!.matches,5);assert.throws(()=>beginPerfectDayPlay(s,now,pal.id,'food'));
 assert.equal(s.daily.playsToday,5);assert.throws(()=>beginPerfectDayPlay(s,now));
});
test('five distinct completed friend cards open global play; sharing and duplicate replies never grant credit',async()=>{
 let s=prepare();assert.throws(()=>beginPerfectDayPlay(s,now));const answers=s.launch!.tickets[0].answers,invite=await makeFriendInvite(s,crypto,now);s=rememberInvite(s,invite,now);assert.equal(palFindingProgress(s).count,0);assert.ok(challengeURL('http://localhost:4178',invite).startsWith('http://localhost:4178/#/challenge/'));for(const a of answers)assert.equal(JSON.stringify(invite).includes(a),false);
 await assert.rejects(answerFriendInvite(invite,{...s.profile!,name:'654321'},['typed','invalid','answers'],crypto,now),/six choices/);
 for(let i=1;i<=5;i++){const guest={...s.profile!,name:String(600000+i)},opts=[...answers];if(i===1)opts[2]=questionById(invite.ids[2])!.choices!.find(c=>c.label!==opts[2])!.label;
 const reply=await answerFriendInvite(invite,guest,opts,{...crypto,nonce:()=>String(i).repeat(32)},now);if(i===1)assert.equal(friendScore(reply).shared,2);s=collectPostcard(s,reply,now);assert.equal(collectPostcard(s,reply,now),s);assert.equal(palFindingProgress(s).count,i);assert.equal(palFindingProgress(s).unlocked,i===5);}
 assert.equal(founderJourney(s).stage,'world-open');assert.equal(s.daily.playsToday,0);assert.equal(s.social.proofs.length,0);assert.equal(readPreview(JSON.parse(JSON.stringify(s)),now).launch!.friendCredits.length,5);
});
test('younger explorers keep a private travel game without referral invitations or social matches',()=>{
 const s={...seed(),profile:{...seed().profile!,ageBand:'10-12' as const}};assert.throws(()=>beginDayCard(s,now));const played=finish(beginPerfectDayPlay(s,now,undefined,'animals'));assert.equal(played.social.proofs.length,0);assert.equal(played.daily.playsToday,1);
});
