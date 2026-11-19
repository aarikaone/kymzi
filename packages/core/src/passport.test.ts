import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyPassport,recordJourney,passportStats,passportStamps,readPassport,weeklyCityCount,weeklyCrew,passportWeek,selectPassportCover,coverUnlocked,journeyIsNew} from './passport.ts';
import {emptyDaily,beginDaily,answerDaily,completeDaily,type DailyGame} from './daily.ts';
import {rankMatches,emptyPreview,readPreview,SAMPLE_ANSWERS,DAILY_IDS} from './index.ts';
import type {AgeBand} from './types.ts';
const now=new Date(2026,10,17,14),profile={name:'Nova',avatar:'cloud' as const,ageBand:'16-17' as const};
function finish(band:AgeBand='16-17',answers=['Popcorn','Mango','Chips'],day=now,game=emptyDaily()){
 let daily=beginDaily(game,band,day,'food');
 const values=Object.fromEntries(daily.active!.ids.map((id,i)=>[id,answers[i]]));
 for(const [id,a]of Object.entries(values))daily=answerDaily(daily,id,a,day);
 return {game:completeDaily(daily,day),matches:rankMatches(values,band,daily.active!.ids),values};
}
test('only a completed play earns ink and a real seeded match stamp',()=>{
 const state=emptyPassport(),blank=beginDaily(emptyDaily(),'16-17',now,'food');
 assert.equal(recordJourney(state,blank,'16-17',[]),state);
 const {game,matches}=finish(),next=recordJourney(state,game,'16-17',matches);
 assert.deepEqual(passportStats(next),{cities:1,countries:1,continents:1,ink:1,perfect:1});
 assert.equal(next.journeys[0].cityId,'tokyo');assert.equal(next.journeys[0].shared,3);
 assert.equal(recordJourney(next,game,'16-17',matches),next);
 assert.equal(journeyIsNew(next,next.journeys[0]),true);
});
test('a play earns one stamp even when multiple peers match',()=>{
 const {game,matches}=finish('16-17',['Popcorn','Mango','Chips']);
 assert.ok(matches.length>1);assert.equal(recordJourney(emptyPassport(),game,'16-17',matches).journeys.length,1);
});
test('unmatched thoughts earn ink without inventing a location or person',()=>{
 const {game,matches}=finish('16-17',['unseen-x','unseen-y','unseen-z']);assert.equal(matches.length,0);
 const next=recordJourney(emptyPassport(),game,'16-17',matches);
 assert.equal(next.journeys[0].source,'ink');assert.equal(next.journeys[0].cityId,null);assert.equal(passportStats(next).ink,1);assert.equal(passportStats(next).cities,0);
});
test('younger players collect virtual destinations without social scores',()=>{
 const {game,matches}=finish('10-12'),next=recordJourney(emptyPassport(),game,'10-12',matches);
 assert.equal(next.journeys[0].source,'private-trip');assert.equal(next.journeys[0].shared,0);
 assert.equal('peerId' in next.journeys[0],false);assert.deepEqual(weeklyCrew(next,{...profile,ageBand:'10-12'},now),[]);
});
test('repeated cities upgrade the same stamp and never inflate unique counts',()=>{
 const {game,matches}=finish();let next=recordJourney(emptyPassport(),game,'16-17',matches);
 next=recordJourney(next,{...game,played:2,lastCompletedAt:new Date(now.getTime()+1000).toISOString()},'16-17',matches);
 assert.equal(passportStats(next).cities,1);assert.equal(passportStamps(next)[0].visits,2);assert.equal(journeyIsNew(next,next.journeys[1]),false);
});
test('a match from a different age group or question set cannot earn a stamp',()=>{
 const {game,matches}=finish();
 assert.equal(recordJourney(emptyPassport(),game,'13-15',matches).journeys[0].source,'ink');
 assert.equal(recordJourney(emptyPassport(),{...game,lastQuestionIds:['K0101','K0102','K0103']},'16-17',matches).journeys[0].source,'ink');
});
test('weekly scores count distinct cities, exclude future plays, and use local Monday boundaries',()=>{
 const monday=new Date(2026,10,16,0),sunday=new Date(2026,10,15,23,59),nextMonday=new Date(2026,10,23,0);
 const state=emptyPassport();state.journeys=[
  {id:'old',at:sunday.toISOString(),cityId:'rio',shared:1,source:'demo-match'},
  {id:'one',at:monday.toISOString(),cityId:'tokyo',shared:1,source:'demo-match'},
  {id:'repeat',at:now.toISOString(),cityId:'tokyo',shared:3,source:'demo-match'},
  {id:'future',at:nextMonday.toISOString(),cityId:'london',shared:2,source:'demo-match'},
 ];
 assert.equal(weeklyCityCount(state,now),1);assert.equal(weeklyCityCount(state,nextMonday),1);
 assert.equal(passportStats(state).cities,3);assert.equal(passportWeek(new Date(2027,0,1)),'2026-12-28');
});
test('covers unlock from completed plays and collection goals, never from opening a game',()=>{
 let state=emptyPassport();assert.equal(selectPassportCover(state,'lilac'),state);
 for(let i=0;i<3;i++)state={...state,journeys:[...state.journeys,{id:String(i),at:now.toISOString(),cityId:null,shared:0,source:'ink'}]};
 assert.equal(coverUnlocked(state,'lilac'),true);state=selectPassportCover(state,'lilac');assert.equal(state.cover,'lilac');
 assert.equal(coverUnlocked(state,'sunset'),false);
 for(const cityId of ['rio','mumbai','toronto'] as const)state.journeys.push({id:cityId,at:now.toISOString(),cityId,shared:1,source:'demo-match'});
 assert.equal(coverUnlocked(state,'sunset'),true);
});
test('corrupt and duplicate persisted journeys cannot create scores or unlock covers',()=>{
 const good={id:'a',at:now.toISOString(),cityId:'tokyo',shared:1,source:'demo-match'};
 const state=readPassport({cover:'sunset',journeys:[good,good,{...good,id:'bad-city',cityId:'atlantis'},{...good,id:'bad-time',at:'never'},{...good,id:'bad-share',shared:99},{...good,id:'private',shared:0,source:'private-trip',peerId:'ignored'}]});
 assert.equal(state.journeys.length,2);assert.equal(state.cover,'midnight');assert.equal('peerId' in state.journeys[1],false);
 assert.equal(weeklyCityCount(state,now),1);
});
test('legacy saves recover only the last proven result and preserve their play allowance',()=>{
 let daily=beginDaily(emptyDaily(),'16-17',now);for(const id of DAILY_IDS)daily=answerDaily(daily,id,SAMPLE_ANSWERS[id],now);daily=completeDaily(daily,now);
 const raw={...emptyPreview(),profile,completed:true,answers:SAMPLE_ANSWERS,daily};delete (raw as Partial<typeof raw>).passport;
 const migrated=readPreview(raw,now);assert.equal(migrated.passport.journeys.length,1);assert.equal(migrated.daily.playsToday,1);
 assert.equal(readPreview(migrated,now).passport.journeys.length,1);
});
test('weekly crew scores are deterministic demo fixtures and the user score comes from their own passport',()=>{
 const state=emptyPassport(),rows=weeklyCrew(state,profile,now);assert.deepEqual(rows,weeklyCrew(state,profile,now));
 assert.equal(rows.find(r=>r.you)!.cities,0);assert.ok(rows.every(r=>r.cities<=6));
});
