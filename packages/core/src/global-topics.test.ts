import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,prepareLaunchTopics,beginLaunchPlay,finishLaunchPlay,availableCategories,categoryQuestions,activeQuestions,answerDaily,submitDaily,readPreview,type PreviewState,type AgeBand,type PlayCategoryId} from './index.ts';
const NOW=new Date('2026-11-19T05:00:00Z');
function seed(band:AgeBand='16-17'):PreviewState{const state={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud' as const,ageBand:band,city:'Chennai',country:'India'},launch:emptyLaunch(NOW)};return band==='10-12'?state:simulatePalUnlock(state,NOW);}
test('opening topics is free, creates no questions or roamie and clears only an untouched start',()=>{
 const s=seed(),open=prepareLaunchTopics(s,NOW);assert.equal(open.daily.active,null);assert.equal(open.daily.playsToday,0);assert.deepEqual(open.social,s.social);assert.deepEqual(open.launch!.globalPlay,s.launch!.globalPlay);
 const untouched=beginLaunchPlay(open,NOW,undefined,'food');assert.equal(untouched.daily.active!.categoryId,'food');assert.equal(untouched.daily.playsToday,0);const again=prepareLaunchTopics(untouched,NOW);assert.equal(again.daily.active,null);assert.equal(again.daily.playsToday,0);assert.equal(beginLaunchPlay(again,NOW,undefined,'animals').daily.active!.categoryId,'animals');
});
test('every available topic saves three age-appropriate topic questions and survives an unanswered reload',()=>{
 for(const band of ['10-12','13-15','16-17','18-20','21-24'] as AgeBand[])for(const category of availableCategories(band)){
  const s=beginLaunchPlay(seed(band),NOW,undefined,category.id),ids=new Set(categoryQuestions(category.id,band).map(q=>q.id));assert.equal(s.daily.active!.categoryId,category.id);assert.equal(s.daily.active!.ids.every(id=>ids.has(id)),true);assert.equal(activeQuestions(s.daily,band).length,3);assert.equal(s.daily.playsToday,0);
  const copy=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.deepEqual(copy.daily.active!.ids,s.daily.active!.ids);assert.equal(copy.daily.active!.categoryId,category.id);assert.equal(copy.daily.playsToday,0);
 }
});
test('answered drafts resume the same topic and the charged fifth play can finish without a reset',()=>{
 let s=seed();s={...s,daily:{...s.daily,usageDay:'2026-11-19',playsToday:4}};s=beginLaunchPlay(s,NOW,undefined,'future-you');const first=s.daily.active!.ids[0];s={...s,daily:submitDaily(answerDaily(s.daily,first,'Keep this answer',NOW),first,NOW)};assert.equal(s.daily.playsToday,5);
 const topics=prepareLaunchTopics(s,NOW);assert.deepEqual(topics.daily.active,s.daily.active);const resume=beginLaunchPlay(topics,NOW,undefined,'food');assert.equal(resume.daily.active!.categoryId,'future-you');assert.equal(resume.daily.active!.answers[first],'Keep this answer');
 for(const id of resume.daily.active!.ids)resume.daily=answerDaily(resume.daily,id,'Anything',NOW);const result=finishLaunchPlay(resume,NOW);assert.equal(result.daily.playsToday,5);assert.equal(result.social.proofs.length,1);assert.throws(()=>prepareLaunchTopics(result,NOW),/daily time/);
});
test('locked global accounts and invalid topics cannot bypass the play gates',()=>{
 const s=seed(),locked={...s,launch:emptyLaunch(NOW)};assert.throws(()=>prepareLaunchTopics(locked,NOW),/5 friends/);assert.throws(()=>beginLaunchPlay(locked,NOW,undefined,'food'),/5 friends/);assert.throws(()=>beginLaunchPlay(s,NOW,undefined,'not-a-topic' as PlayCategoryId),/available topics/);assert.equal(s.daily.playsToday,0);
});
