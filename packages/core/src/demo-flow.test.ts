import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNTRIES,PLAY_CATEGORIES,demoPeers,emptyPreview,beginDaily,answerDaily,submitDaily,completeDaily,scheduleDaily,remainingDailyPlays,recordConnections,emptySocial,rankPlayMatches,connections,canChat,startDemoChat,sendDemoMessage,portraitRevealed,revealDemoPortrait,worldStats,uncoveredPlace,readPreview,readSocial,dailyStatus,type AgeBand,type PreviewState} from './index.ts';
import {demoPlayMatches,completeDemoPlay,completedPreviewMatches,prepareDemoPlay} from './demo-flow.ts';
const NOW=new Date(2026,10,18,14),arbitrary=['a completely new answer','紫の雲 🐸','90817 whatever'];
function ready(band:AgeBand='16-17',countryId='JP',previous?:PreviewState){
 let state:PreviewState=previous??{...emptyPreview(),profile:{name:'Nova',avatar:'cloud',ageBand:band}};
 let daily=beginDaily(prepareDemoPlay(state.daily,NOW),band,NOW,'food',countryId as 'JP');
 for(const [i,id] of daily.active!.ids.entries())daily=answerDaily(daily,id,arbitrary[i],NOW);
 return {...state,daily};
}
test('any valid answers produce one clearly simulated Roamie across every country, cohort and topic',()=>{
 const fixtures=JSON.stringify(demoPeers);
 for(const c of COUNTRIES)for(const band of ['13-15','16-17','18-20','21-24'] as AgeBand[])for(const topic of PLAY_CATEGORIES){
  const daily=beginDaily(emptyPreview().daily,band,NOW,topic.id,c.id),answers=Object.fromEntries(daily.active!.ids.map((id,i)=>[id,arbitrary[i]])),matches=demoPlayMatches(answers,band,daily);
  assert.equal(matches.length,1);assert.equal(matches[0].simulated,true);assert.equal(matches[0].shared,3);assert.equal(matches[0].peer.country,c.name);assert.equal(matches[0].peer.ageBand,band);
  for(const id of daily.active!.ids)assert.equal(matches[0].peer.answers[id],answers[id]);
 }
 assert.equal(JSON.stringify(demoPeers),fixtures);
});
test('one preview play reveals a city, keeps chat locked, and survives reopening',()=>{
 const state=ready(),done=completeDemoPlay(state,NOW),match=completedPreviewMatches(done)[0],friend=connections(done.social,'16-17')[0];
 assert.equal(worldStats(done).cities,1);assert.equal(uncoveredPlace(done,'JP').attractions.length,4);assert.equal(done.daily.playsToday,1);assert.equal(done.daily.playTime,'19:00');assert.equal(dailyStatus(done.daily,NOW).kind,'ready');
 assert.equal(friend.matches,1);assert.equal(friend.simulated,true);assert.equal(canChat(done.social,match.peer.id,'16-17'),false);
 const reopened=readPreview(JSON.parse(JSON.stringify(done)),NOW);assert.deepEqual(completedPreviewMatches(reopened),completedPreviewMatches(done));assert.equal(connections(reopened.social,'16-17')[0].chatUnlocked,false);
 assert.throws(()=>startDemoChat(reopened.social,friend.peer.id,'16-17',[],NOW));
});
test('typed but unsubmitted answers stay free and completion charges a submitted play only once',()=>{
 let state=ready();assert.equal(state.daily.playsToday,0);state={...state,daily:submitDaily(state.daily,state.daily.active!.ids[0],NOW)};assert.equal(state.daily.playsToday,1);
 const done=completeDemoPlay(state,NOW);assert.equal(done.daily.playsToday,1);assert.throws(()=>completeDemoPlay(done,NOW),/Start a play/);
});
test('private play uncovers a virtual city without a Roamie, chat or portrait reveal',()=>{
 const done=completeDemoPlay(ready('10-12'),NOW);assert.equal(worldStats(done).cities,1);assert.equal(done.social.proofs.length,0);assert.equal(completedPreviewMatches(done).length,0);assert.equal(canChat(done.social,'16-17-0','10-12'),false);
});
test('demo selection respects blocks, requires complete answers and stays in the selected age group',()=>{
 const state=ready(),first=demoPlayMatches(state.daily.active!.answers,'16-17',state.daily)[0],next=demoPlayMatches(state.daily.active!.answers,'16-17',state.daily,[first.peer.id]);assert.notEqual(next[0].peer.id,first.peer.id);
 assert.deepEqual(demoPlayMatches({},'16-17',state.daily),[]);assert.deepEqual(demoPlayMatches(state.daily.active!.answers,'16-17',state.daily,demoPeers.filter(p=>p.ageBand==='16-17').map(p=>p.id)),[]);
 assert.equal(canChat(completeDemoPlay(state,NOW).social,first.peer.id,'18-20'),false);
});
test('exact matching still rejects arbitrary answers and does not inherit the demo chat shortcut',()=>{
 const state=ready();assert.equal(rankPlayMatches(state.daily.active!.answers,'16-17',state.daily).length,0);
 const peer=demoPeers.find(p=>p.id==='16-17-0')!;let daily=beginDaily(emptyPreview().daily,'16-17',NOW,'food','JP');for(const id of daily.active!.ids)daily=answerDaily(daily,id,peer.answers[id],NOW);daily=completeDaily(daily,NOW);
 const exact=recordConnections(emptySocial(),daily,'16-17',rankPlayMatches(peer.answers,'16-17',daily));assert.equal(connections(exact,'16-17').find(f=>f.peer.id===peer.id)!.simulated,false);assert.equal(canChat(exact,peer.id,'16-17'),false);
});
test('the default time removes setup friction without changing a custom time or the five-play limit',()=>{
 let done=completeDemoPlay(ready(),NOW);done={...done,daily:scheduleDaily(done.daily,'21:30',NOW)};
 for(let i=1;i<5;i++)done=completeDemoPlay(ready('16-17','JP',done),NOW);
 assert.equal(done.daily.playTime,'21:30');assert.equal(done.daily.playsToday,5);assert.equal(remainingDailyPlays(done.daily,NOW),0);assert.equal(dailyStatus(done.daily,NOW).kind,'waiting');assert.equal(connections(done.social,'16-17').length,1);assert.equal(connections(done.social,'16-17')[0].matches,5);
 const malformed=JSON.parse(JSON.stringify(done.social));delete malformed.proofs[0].demoAnswers;assert.equal(readSocial(malformed).proofs.length,4);
});
