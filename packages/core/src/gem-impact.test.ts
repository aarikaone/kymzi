import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,palSummaries,parseMapsPlaceLink,publishMapsPlace,recordReceivedPlaceFav,gemImpact,removePlaceCheckIn,readPreview,type PreviewState,type PlaceDraft} from './index.ts';
const now=new Date('2026-11-21T08:00:00Z');
const seed=():PreviewState=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(now)},now),now);
const gem=(id:string,city='Bengaluru',country='India'):PlaceDraft=>({id,name:`Little find ${id}`,categoryId:'cafe',maps:parseMapsPlaceLink(`https://maps.apple.com/?q=Find&auid=${id}`),location:{city,country,source:'maps'}});
test('gems are an all-time collection with no quota, expiry or invented reach',()=>{
 let s=seed();for(let i=0;i<18;i++)s=publishMapsPlace(s,gem(String(i)),now);
 const stats=gemImpact(s,new Date('2027-02-01T08:00:00Z'));
 assert.equal(stats.count,18);assert.equal(stats.saves,0);assert.equal(stats.helped,0);assert.deepEqual(stats.cities,[{city:'Bengaluru',country:'India',gems:18,saves:0}]);assert.equal(s.daily.playsToday,0);
});
test('impact counts unique active saves from eligible Roamies, separately from people helped',()=>{
 let s=publishMapsPlace(publishMapsPlace(seed(),gem('a'),now),gem('b','Kyoto','Japan'),now);const [a,b]=palSummaries(s);
 s=recordReceivedPlaceFav(s,'a',a.id,true,now);s=recordReceivedPlaceFav(s,'a',b.id,true,now);s=recordReceivedPlaceFav(s,'b',a.id,true,now);
 assert.equal(gemImpact(s,now).saves,3);assert.equal(gemImpact(s,now).helped,2);assert.equal(gemImpact(s,now).recentSaves.length,3);
 s=recordReceivedPlaceFav(s,'a',a.id,false,new Date(now.getTime()+1000));assert.equal(gemImpact(s,now).saves,2);assert.equal(gemImpact(s,now).helped,2);
 const journal=s.placeJournal!;const corrupted={...s,placeJournal:{...journal,receivedFavs:[...journal.receivedFavs!,journal.receivedFavs![1],{placeId:'a',palId:'missing-peer',active:true,at:now.toISOString()},{placeId:'a',palId:a.id,active:true,at:'2099-01-01T00:00:00Z'}]}};
 assert.equal(gemImpact(corrupted,now).saves,2);assert.equal(gemImpact(removePlaceCheckIn(s,'a'),now).saves,1);
});
test('city impact combines case variants while keeping countries distinct',()=>{
 let s=seed();s=publishMapsPlace(s,gem('a','Paris','France'),now);s=publishMapsPlace(s,gem('b',' paris ','france'),now);s=publishMapsPlace(s,gem('c','Paris','United States'),now);
 const stats=gemImpact(s,now);assert.equal(stats.cities.length,2);assert.deepEqual(stats.cities.find(c=>c.country.toLowerCase()==='france')?.gems,2);
});
test('local tips are sanitized, optional, and survive restoring a gem',()=>{
 const s=publishMapsPlace(seed(),{...gem('a'),tip:'  Go at sunset.\u0000 '+ 'x'.repeat(200)},now),restored=readPreview(JSON.parse(JSON.stringify(s)),now);
 const tip=gemImpact(restored,now).gems[0].tip!;assert.equal(tip.length,160);assert.ok(tip.startsWith('Go at sunset.'));assert.ok(!tip.includes('\u0000'));
 assert.equal(gemImpact(publishMapsPlace(seed(),{...gem('b'),tip:'  '},now),now).gems[0].tip,undefined);
});
test('younger explorers keep gems private and never accrue public impact',()=>{
 let s=seed();s=publishMapsPlace(s,gem('a'),now);const p=palSummaries(s)[0];s=recordReceivedPlaceFav(s,'a',p.id,true,now);
 s={...s,profile:{...s.profile!,ageBand:'10-12'},placeJournal:{...s.placeJournal!,entries:s.placeJournal!.entries.map(e=>({...e,ageBand:'10-12'}))}};
 const impact=gemImpact(s,now);assert.equal(impact.count,1);assert.equal(impact.private,true);assert.equal(impact.saves,0);assert.equal(impact.helped,0);assert.equal(impact.recentSaves.length,0);
});
test('share cards include only public place details and the Maps link',async()=>{
 const {gemShareCard}=await import('./index.ts');const card=gemShareCard({...gem('a'),tip:'Go before the crowds.'});
 assert.equal(card.title,'Little find a · Bengaluru');assert.ok(card.text.includes('Go before the crowds.'));assert.ok(card.url.startsWith('https://maps.apple.com/'));assert.ok(!JSON.stringify(card).includes('123456'));assert.ok(!JSON.stringify(card).includes('ageBand'));
});
