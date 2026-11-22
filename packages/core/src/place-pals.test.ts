import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,palSummaries,palsForPlace,demoPeers,type PlaceDraft,type PreviewState} from './index.ts';
const now=new Date('2026-11-20T12:00:00Z');
const seed=()=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(now)},now),now);
const place=(city='Tokyo',country='Japan'):Pick<PlaceDraft,'location'>=>({location:{city,country,source:'maps'}});
test('place Roamies are connected to the exact city and country, including normalized labels',()=>{
 const s=seed(),expected=palSummaries(s).filter(p=>p.countryId==='JP').map(p=>p.id);
 assert.ok(expected.length);assert.deepEqual(palsForPlace(s,place()).map(p=>p.id),expected);
 assert.deepEqual(palsForPlace(s,place(' TOKYO ',' japan ')).map(p=>p.id),expected);
 assert.deepEqual(palsForPlace(s,place('Tokyo','JP')).map(p=>p.id),expected);
 assert.equal(palsForPlace(s,place('Osaka')).length,0);assert.equal(palsForPlace(s,place('Tokyo','France')).length,0);
});
test('place Roamies exclude blocks, other cohorts, children and absent profiles',()=>{
 const s=seed(),jp=palSummaries(s).find(p=>p.countryId==='JP')!;
 assert.equal(palsForPlace({...s,blocked:[jp.id]},place()).length,0);
 assert.equal(palsForPlace({...s,profile:{...s.profile!,ageBand:'21-24'}},place()).length,0);
 assert.equal(palsForPlace({...s,profile:{...s.profile!,ageBand:'10-12'}},place()).length,0);
 assert.equal(palsForPlace({...s,profile:null},place()).length,0);
});
test('a place author appears first without changing the underlying connections',()=>{
 const s=seed(),first=palSummaries(s).find(p=>p.countryId==='JP')!,other=demoPeers.find(p=>p.ageBand==='25-30'&&p.country==='Japan'&&p.id!==first.id)!,proof=s.social.proofs.find(p=>p.peerId===first.id)!;
 const two:PreviewState={...s,social:{...s.social,proofs:[...s.social.proofs,{...proof,peerId:other.id,playId:'second-city-pal'}]}};
 const before=JSON.stringify(two),pals=palsForPlace(two,{...place(),peerId:other.id});assert.equal(pals.length,2);assert.equal(pals[0].id,other.id);assert.equal(JSON.stringify(two),before);
});
