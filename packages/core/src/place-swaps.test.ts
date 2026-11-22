import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,palSummaries,parseMapsPlaceLink,publishPlaceToPal,palPlaceSwap,shareTaskProgress,togglePlaceFavorite,recordReceivedPlaceFav,readPreview,type PlaceDraft} from './index.ts';
const now=new Date('2026-11-20T05:00:00Z');
const seed=()=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,city:'Bengaluru',country:'India'},launch:emptyLaunch(now)},now),now);
const draft=(id='garden',city='Tokyo'):PlaceDraft=>({id,name:'Garden',categoryId:'park',location:{city,country:'Japan',source:'maps'},maps:parseMapsPlaceLink(`https://maps.apple.com/?q=Garden,+${city},+Japan`)});
test('sharing one Maps find with several Roamies credits the monthly task once and restores recipients',()=>{
 let s=seed();const pals=palSummaries(s);s=publishPlaceToPal(s,draft(),pals[0].id,now);s=publishPlaceToPal(s,draft('alias'),pals[1].id,now);s=publishPlaceToPal(s,draft(),pals[0].id,now);assert.equal(shareTaskProgress(s,now).count,1);assert.equal(palPlaceSwap(s,pals[0].id,now)!.outgoing.length,1);assert.equal(palPlaceSwap(s,pals[1].id,now)!.outgoing.length,1);const restored=readPreview(JSON.parse(JSON.stringify(s)),now);assert.equal(restored.placeJournal!.entries[0].sharedWith!.length,2);assert.deepEqual(palPlaceSwap(restored,pals[0].id,now)!.outgoing,palPlaceSwap(s,pals[0].id,now)!.outgoing);
});
test('shared routes use saved Roamie finds and their favourites only in that city',()=>{
 let s=seed();const p=palSummaries(s)[0];const incoming=palPlaceSwap(s,p.id,now)!.incoming[0];s=togglePlaceFavorite(s,incoming.id,now);s=publishPlaceToPal(s,draft('local',p.city),p.id,now);s=publishPlaceToPal(s,draft('away','Paris'),p.id,now);s=recordReceivedPlaceFav(s,'local',p.id,true,now);s=recordReceivedPlaceFav(s,'away',p.id,true,now);assert.deepEqual(palPlaceSwap(s,p.id,now)!.route.map(p=>p.id),[incoming.id,'local']);
});
test('blocked, unavailable and private Roamies cannot receive places',()=>{const s=seed(),p=palSummaries(s)[0];assert.throws(()=>publishPlaceToPal(s,draft(),'missing',now));const blocked={...s,blocked:[p.id]};assert.throws(()=>publishPlaceToPal(blocked,draft(),p.id,now));assert.equal(palPlaceSwap(blocked,p.id,now),null);const child={...s,profile:{...s.profile!,ageBand:'10-12' as const}};assert.throws(()=>publishPlaceToPal(child,draft(),p.id,now));});
