import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,beginDaily,answerDaily,completeDemoPlay,seedGlobalPals,enableLaunch,readPreview,palFindingProgress,palSummaries,type PreviewState} from './index.ts';
const NOW=new Date('2026-11-19T05:00:00Z');
function connected():PreviewState{let s:PreviewState={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'16-17',city:'Chennai',country:'India'}};let daily=beginDaily(s.daily,'16-17',NOW,'food','JP');for(const id of daily.active!.ids)daily=answerDaily(daily,id,'Anything',NOW);return completeDemoPlay({...s,daily},NOW);}
test('existing connected saves adopt global play without a new launch gate, a new game or lost progress',()=>{
 const old=connected(),adopted=enableLaunch(old,NOW);assert.equal(palFindingProgress(adopted).activated,true);assert.equal(palSummaries(adopted).length,1);assert.deepEqual(adopted.daily,old.daily);assert.deepEqual(adopted.social,old.social);assert.deepEqual(adopted.passport,old.passport);assert.equal(adopted.launch!.friendCredits.length,0);
 const missing={...old,launch:emptyLaunch(NOW)},live=seedGlobalPals(missing,NOW);assert.ok(live.launch!.globalPlay);assert.deepEqual(live.daily,missing.daily);const restored=readPreview(JSON.parse(JSON.stringify(missing)),NOW);assert.equal(palFindingProgress(restored).canPlay,true);assert.equal(palSummaries(restored).length,1);assert.equal(restored.daily.playsToday,old.daily.playsToday);assert.deepEqual(restored.social,old.social);const reload=readPreview(JSON.parse(JSON.stringify(restored)),new Date(NOW.getTime()+3600000));assert.deepEqual(reload.launch!.globalPlay,restored.launch!.globalPlay);
});
test('a missing flag is not restored from blocked, other-cohort, child or absent connections',()=>{
 const s=connected(),peer=s.social.proofs[0].peerId;
 for(const variant of [{...s,blocked:[peer]},{...s,profile:{...s.profile!,ageBand:'13-15' as const}},{...s,profile:{...s.profile!,ageBand:'10-12' as const}},{...s,social:emptyPreview(NOW).social}]){const copy=readPreview({...variant,launch:emptyLaunch(NOW)},NOW);assert.equal(palFindingProgress(copy).activated,false);assert.equal(palSummaries(copy).length,0);}
});
