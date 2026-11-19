import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COUNTRIES,emptyDaily,beginSurpriseDaily,answerDaily} from './index.ts';
const now=new Date('2026-11-17T12:00:00Z');
test('every catalog country can be drawn without using a play',()=>{for(let i=0;i<COUNTRIES.length;i++){const game=beginSurpriseDaily(emptyDaily(),'16-17',now,'food',()=>i/COUNTRIES.length+.0001);assert.equal(game.active!.countryId,COUNTRIES[i].id);assert.equal(game.playsToday,0);}});
test('a drafted surprise resumes its original destination and never draws again',()=>{let calls=0;let game=beginSurpriseDaily(emptyDaily(),'16-17',now,'food',()=>.999);game=answerDaily(game,game.active!.ids[0],'My draft',now);const resumed=beginSurpriseDaily(game,'16-17',now,'animals',()=>{calls++;return 0;});assert.equal(calls,0);assert.equal(resumed.active!.countryId,'AR');assert.equal(resumed.active!.categoryId,'food');assert.equal(resumed.playsToday,0);assert.equal(resumed.active!.answers[game.active!.ids[0]],'My draft');});
test('out-of-range draws stay within the catalog',()=>{assert.equal(beginSurpriseDaily(emptyDaily(),'16-17',now,'food',()=>1).active!.countryId,'AR');assert.equal(beginSurpriseDaily(emptyDaily(),'16-17',now,'food',()=>NaN).active!.countryId,'JP');});
