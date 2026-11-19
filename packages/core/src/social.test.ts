import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNTRIES,countryByName,COUNTRY_PEOPLE_TARGET} from './countries.ts';
import {demoPeers,rankMatches,emptyPreview,readPreview} from './index.ts';
import {beginDaily,answerDaily,completeDaily,emptyDaily,scheduleDaily,readDaily,submitDaily,type DailyGame} from './daily.ts';
import {emptyPassport,recordJourney,type PassportState} from './passport.ts';
import {rankPlayMatches,playCountry} from './encounters.ts';
import {emptySocial,recordConnections,connections,countryProgress,knownConnectionIds,canChat,startDemoChat,sendDemoMessage,canPlanMeetup,proposeDemoMeetup,respondToDemoMeetup,cancelDemoMeetup,readSocial,weeklyNewRymzis,meetingDateTime,socialCrew,disconnectPeer,type SocialState} from './social.ts';
import type {DemoPeer,AgeBand} from './types.ts';
const NOW=new Date(2026,10,17,20),band='16-17';
type Played={game:DailyGame;social:SocialState;passport:PassportState};
function play(peer:DemoPeer,turn:number,previous:Played={game:emptyDaily(),social:emptySocial(),passport:emptyPassport()}):Played{
 const now=new Date(NOW);now.setDate(now.getDate()+turn);const category=turn%2?'animals':'food',country=countryByName(peer.country)!;
 let game=beginDaily(previous.game,peer.ageBand,now,category,country.id);const answers=Object.fromEntries(game.active!.ids.map(id=>[id,peer.answers[id]]));
 assert.ok(Object.values(answers).every(Boolean));for(const [id,a]of Object.entries(answers))game=answerDaily(game,id,a,now);game=completeDaily(game,now);if(!game.playTime)game=scheduleDaily(game,'19:00',now);
 const matches=rankPlayMatches(answers,peer.ageBand,game,[],knownConnectionIds(previous.social,peer.ageBand));
 return {game,social:recordConnections(previous.social,game,peer.ageBand,matches),passport:recordJourney(previous.passport,game,peer.ageBand,matches)};
}
const jp=(age:AgeBand='16-17')=>demoPeers.filter(p=>p.ageBand===age&&p.country==='Japan');
function fiveMatches(age:AgeBand='16-17'){const peer=jp(age)[0];let state=play(peer,0);for(let i=1;i<5;i++)state=play(peer,i,state);return {peer,state};}
test('the new catalog adds 20 countries and five distinct same-cohort profiles per country',()=>{
 assert.equal(COUNTRIES.length,26);assert.equal(new Set(COUNTRIES.map(c=>c.id)).size,26);assert.equal(COUNTRY_PEOPLE_TARGET,5);
 for(const c of COUNTRIES)for(const cohort of ['13-15','16-17','18-20','21-24'] as const){const peers=demoPeers.filter(p=>p.ageBand===cohort&&p.country===c.name);assert.equal(peers.length,5);assert.equal(new Set(peers.map(p=>p.id)).size,5);assert.ok(c.timeZone);}
 assert.equal(demoPeers.filter(p=>p.ageBand==='10-12').length,0);
});
test('five different full-match Rymzis unlock a country, with no premature passport',()=>{
 let state:Played|undefined;
 for(const [i,peer]of jp().entries()){state=play(peer,i,state);const progress=countryProgress(state.social,state.passport,band,'JP');assert.equal(progress.count,i+1);assert.equal(progress.unlocked,i===4);}
});
test('matching a person five times unlocks chat but occupies one country slot',()=>{
 const {peer,state}=fiveMatches();assert.equal(countryProgress(state.social,state.passport,band,'JP').count,1);const friend=connections(state.social,band).find(c=>c.peer.id===peer.id)!;assert.equal(friend.matches,5);assert.equal(friend.chatUnlocked,true);assert.equal(canChat(state.social,peer.id,band),true);
});
test('partial matches and duplicate completion callbacks cannot create Rymzis',()=>{
 const first=play(jp()[0],0),before=first.social;const full=rankMatches(Object.fromEntries(first.game.lastQuestionIds.map(id=>[id,jp()[0].answers[id]])),band,first.game.lastQuestionIds);
 assert.equal(recordConnections(before,first.game,band,full),before);
 const partial=full.map(m=>({...m,shared:2,sharedIds:m.sharedIds.slice(0,2)}));assert.equal(recordConnections(emptySocial(),first.game,band,partial).proofs.length,0);
});
test('country focus persists, an untouched restart is free, and a typed draft keeps its original country',()=>{
 let game=beginDaily(emptyDaily(),band,NOW,'food','FR');assert.equal(readDaily(game,false,NOW).active?.countryId,'FR');assert.equal(game.playsToday,0);
 game=beginDaily(game,band,NOW,'animals','JP');assert.equal(game.active!.countryId,'JP');game=answerDaily(game,game.active!.ids[0],'Cat',NOW);
 const resumed=beginDaily(game,band,NOW,'food','FR');assert.equal(resumed.active!.countryId,'JP');assert.equal(resumed.playsToday,0);assert.equal(submitDaily(resumed,resumed.active!.ids[0],NOW).playsToday,1);
});
test('one match, a mismatched cohort and a block cannot bypass the chat gate',()=>{
 const peer=jp()[0],first=play(peer,0);assert.equal(canChat(first.social,peer.id,band),false);assert.throws(()=>startDemoChat(first.social,peer.id,band));
 const {state}=fiveMatches();assert.equal(canChat(state.social,peer.id,'13-15'),false);assert.equal(canChat(state.social,peer.id,band,[peer.id]),false);assert.throws(()=>startDemoChat(state.social,peer.id,band,[peer.id]));
 assert.equal(countryProgress(state.social,state.passport,band,'JP').count,1);
});
test('demo conversations require an unlocked connection and preserve messages without duplicate greetings',()=>{
 const {peer,state}=fiveMatches();let social=startDemoChat(state.social,peer.id,band,[],NOW);assert.equal(social.threads[peer.id].messages.length,1);assert.equal(startDemoChat(social,peer.id,band,[],NOW),social);
 social=sendDemoMessage(social,peer.id,band,'Same brain!',[],NOW);assert.equal(social.threads[peer.id].messages.length,3);assert.equal(social.threads[peer.id].messages[1].body,'Same brain!');assert.equal(social.threads[peer.id].messages[2].from,'demo');
 assert.equal(readSocial(social).threads[peer.id].messages.length,3);assert.throws(()=>sendDemoMessage(social,peer.id,band,'x'.repeat(281)));assert.throws(()=>sendDemoMessage(social,peer.id,band,'blocked',[peer.id]));
});
test('teen chat remains within its cohort and cannot open meetup planning',()=>{
 const {peer,state}=fiveMatches('13-15'),social=startDemoChat(state.social,peer.id,'13-15');assert.equal(canChat(social,peer.id,'13-15'),true);assert.equal(canPlanMeetup(social,peer.id,'13-15'),false);assert.throws(()=>proposeDemoMeetup(social,peer.id,'13-15','cafe',new Date(NOW.getTime()+86400000).toISOString()));
});
test('a meetup remains a proposal until both agree, and cancellation withdraws agreement',()=>{
 const {peer,state}=fiveMatches('18-20'),now=new Date(NOW.getTime()+2*86400000),when=new Date(now.getTime()+86400000).toISOString();let social=startDemoChat(state.social,peer.id,'18-20');
 social=proposeDemoMeetup(social,peer.id,'18-20','cafe',when,[],now);let plan=social.meetups.at(-1)!;assert.equal(plan.status,'proposed');assert.equal(plan.youAccepted,true);assert.equal(plan.peerAccepted,false);
 assert.equal(proposeDemoMeetup(social,peer.id,'18-20','cafe',when,[],now),social);
 social=respondToDemoMeetup(social,plan.id,'18-20',true);assert.equal(social.meetups.at(-1)!.status,'confirmed');
 social=cancelDemoMeetup(social,plan.id,'18-20');plan=social.meetups.at(-1)!;assert.equal(plan.status,'cancelled');assert.equal(plan.youAccepted,false);assert.equal(plan.peerAccepted,false);
});
test('a new venue or time needs a new agreement and cannot reuse an old acceptance',()=>{
 const {peer,state}=fiveMatches('21-24'),now=new Date(NOW.getTime()+2*86400000),when=new Date(now.getTime()+86400000).toISOString();let social=startDemoChat(state.social,peer.id,'21-24');social=proposeDemoMeetup(social,peer.id,'21-24','cafe',when,[],now);social=respondToDemoMeetup(social,social.meetups[0].id,'21-24',true);
 social=proposeDemoMeetup(social,peer.id,'21-24','gallery',when,[],now);assert.equal(social.meetups.at(-1)!.status,'proposed');assert.equal(social.meetups.at(-1)!.peerAccepted,false);
});
test('meetup actions reject blocked peers, private venues and past dates',()=>{
 const {peer,state}=fiveMatches('18-20'),now=new Date(NOW.getTime()+2*86400000),social=startDemoChat(state.social,peer.id,'18-20');
 assert.throws(()=>proposeDemoMeetup(social,peer.id,'18-20','home' as never,new Date(now.getTime()+86400000).toISOString(),[],now));assert.throws(()=>proposeDemoMeetup(social,peer.id,'18-20','park',NOW.toISOString(),[],now));assert.throws(()=>proposeDemoMeetup(social,peer.id,'18-20','park',new Date(now.getTime()+86400000).toISOString(),[peer.id],now));
});
test('destination-local meeting times convert to UTC and reject invalid dates and DST gaps',()=>{
 assert.equal(meetingDateTime('2026-11-20','16:00','Asia/Tokyo'),'2026-11-20T07:00:00.000Z');assert.throws(()=>meetingDateTime('2026-02-31','16:00','Asia/Tokyo'));assert.throws(()=>meetingDateTime('2026-03-08','02:30','America/New_York'));
});
test('corrupt proofs cannot inflate a passport or bypass the repeat-match gate',()=>{
 const first=play(jp()[0],0),proof=first.social.proofs.find(p=>p.countryId==='JP')!;const social=readSocial({...first.social,proofs:[proof,proof,{...proof,peerId:'not-a-peer'},{...proof,countryId:'FR'},{...proof,questionIds:['K9997','K9998','K9999']}],threads:{[proof.peerId]:{active:true,messages:[]}}});
 assert.equal(social.proofs.length,1);assert.equal(canChat(social,proof.peerId,band),false);
});
test('a stored confirmed plan without two approvals is restored as a proposal',()=>{
 const {peer,state}=fiveMatches('18-20'),now=new Date(NOW.getTime()+2*86400000);let social=startDemoChat(state.social,peer.id,'18-20');social=proposeDemoMeetup(social,peer.id,'18-20','cafe',new Date(now.getTime()+86400000).toISOString(),[],now);social.meetups[0].status='confirmed';assert.equal(readSocial(social).meetups[0].status,'proposed');
});
test('weekly Rymzi scores count first connections, not repeated matches',()=>{
 const {state}=fiveMatches(),end=new Date(NOW.getTime()+2*86400000),one=play(jp()[0],0);assert.equal(weeklyNewRymzis(state.social,band,end)>=weeklyNewRymzis(one.social,band,end),true);const withoutRepeats={...state.social,proofs:state.social.proofs.filter((p,i,all)=>all.findIndex(other=>other.peerId===p.peerId)===i)};assert.equal(weeklyNewRymzis(state.social,band,end),weeklyNewRymzis(withoutRepeats,band,end));assert.equal(socialCrew(state.social,{name:'Nova',avatar:'cloud',ageBand:band},end).find(r=>r.you)!.rymzis,weeklyNewRymzis(state.social,band,end));
});
test('legacy saves recover the last proven full connection once without granting plays',()=>{
 const peer=jp()[0],state=play(peer,0),answers=Object.fromEntries(state.game.lastQuestionIds.map(id=>[id,peer.answers[id]])),raw={...emptyPreview(),profile:{name:'Nova',avatar:'cloud' as const,ageBand:band},completed:true,daily:state.game,answers};delete (raw as Partial<typeof raw>).social;
 const restored=readPreview(raw,NOW);assert.equal(countryProgress(restored.social,restored.passport,band,'JP').count,1);assert.equal(restored.daily.playsToday,1);assert.equal(readPreview(restored,NOW).social.proofs.length,restored.social.proofs.length);
});
test('children remain private even if someone supplies adult-looking match or chat records',()=>{
 const state=play(jp()[0],0);assert.equal(recordConnections(emptySocial(),state.game,'10-12',rankMatches({},'16-17')).proofs.length,0);assert.equal(connections(state.social,'10-12').length,0);assert.equal(canChat(state.social,jp()[0].id,'10-12'),false);assert.deepEqual(socialCrew(state.social,{name:'Cloud',avatar:'cloud',ageBand:'10-12'},NOW),[]);
});

test('anywhere play rotates independently from the last completed country',()=>{
 const first=play(jp()[0],0),now=new Date(NOW);now.setDate(now.getDate()+1);
 const next=beginDaily(first.game,band,now,'animals');assert.equal(next.active!.countryId,undefined);assert.equal(playCountry(next),'BR');assert.equal(playCountry({...first.game,active:null}),'JP');
});

test('disconnecting cancels plans and pauses chat without losing passport credit or messages',()=>{
 const {peer,state}=fiveMatches('18-20'),now=new Date(NOW.getTime()+2*86400000);let social=startDemoChat(state.social,peer.id,'18-20');social=sendDemoMessage(social,peer.id,'18-20','Hello',[],now);social=proposeDemoMeetup(social,peer.id,'18-20','cafe',new Date(now.getTime()+86400000).toISOString(),[],now);social=respondToDemoMeetup(social,social.meetups[0].id,'18-20',true);
 const proofs=social.proofs.length,messages=social.threads[peer.id].messages.length;social=disconnectPeer(social,peer.id);assert.equal(social.threads[peer.id].active,false);assert.equal(social.meetups[0].status,'cancelled');assert.equal(social.meetups[0].peerAccepted,false);assert.equal(social.proofs.length,proofs);assert.equal(social.threads[peer.id].messages.length,messages);assert.throws(()=>sendDemoMessage(social,peer.id,'18-20','No active chat'));
 const reopened=startDemoChat(social,peer.id,'18-20');assert.equal(reopened.threads[peer.id].messages.length,messages);
});
