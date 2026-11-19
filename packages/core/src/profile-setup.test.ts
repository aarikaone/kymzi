import test from 'node:test';
import assert from 'node:assert/strict';
import {AVATARS,createSetupProfile,emptyPreview,readPreview,readProfileLocation} from './index.ts';

test('a new local profile receives a six-digit nickname and a character from the full roster',()=>{
 const first=createSetupProfile(null,()=>0),last=createSetupProfile(null,()=>.999999);
 assert.equal(first.name,'100000');assert.equal(first.avatar,AVATARS[0].id);
 assert.equal(last.name,'999999');assert.equal(last.avatar,AVATARS.at(-1)!.id);
 assert.equal(first.ageBand,'16-17');assert.equal(first.photo,undefined);
});
test('editing retains an assigned nickname and character, while older editable names are replaced only in the draft',()=>{
 const old={name:'A private old name',avatar:'nori' as const,ageBand:'18-20' as const};
 const draft=createSetupProfile(old,()=>.25);assert.equal(draft.name,'325000');assert.equal(draft.avatar,'nori');assert.equal(draft.ageBand,'18-20');assert.equal(old.name,'A private old name');
 const edited=createSetupProfile({...draft,avatar:'sprout'},()=>{throw new Error('Must not reroll an existing identity');});
 assert.equal(edited.name,draft.name);assert.equal(edited.avatar,'sprout');
});

test('city and country survive reopening, normalize whitespace and tolerate legacy or malformed locations',()=>{
 const now=new Date('2026-11-18T05:00:00Z'),profile={...createSetupProfile(null,()=>.5),city:'  New   Delhi  ',country:' India '};
 const saved={...emptyPreview(now),profile},restored=readPreview(JSON.parse(JSON.stringify(saved)),now);
 assert.equal(restored.profile!.name,profile.name);assert.equal(restored.profile!.city,'New Delhi');assert.equal(restored.profile!.country,'India');assert.equal(restored.profile!.ageBand,profile.ageBand);
 assert.deepEqual(readProfileLocation({city:42,country:{name:'India'}}),{});assert.deepEqual(readProfileLocation(null),{});
 assert.deepEqual(readProfileLocation({city:'  ',country:'India'}),{country:'India'});assert.equal(readProfileLocation({city:'x'.repeat(100)}).city!.length,60);
 assert.equal(readPreview({...saved,profile:createSetupProfile(null,()=>.5)},now).profile!.city,undefined);
});
