import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,palSummaries,parseMapsPlaceLink,publishMapsPlace,sharedMapPlaces,shareTaskProgress,confirmPlaceCheckIn,togglePlaceFavorite,receivedPlaceFavs,recordReceivedPlaceFav,placeShareLeaderboard,readPreview,placeCheckInFeed,type PreviewState,type PlaceDraft} from './index.ts';
const now=new Date(2026,10,20,12);
const seed=():PreviewState=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(now)},now),now);
const draft=(id='p1',name='Senso-ji',city='Tokyo'):PlaceDraft=>({id,name,categoryId:'attraction',maps:parseMapsPlaceLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+', '+city+', Japan')}`),location:{city,country:'Japan',source:'maps'}});
test('accepts Maps shares embedded in text, strips tracking and supports Google and Apple IDs',()=>{
 const g=parseMapsPlaceLink('Senso-ji\nhttps://maps.app.goo.gl/abcd?g_st=ic&utm_source=share');assert.equal(g.short,true);assert.equal(g.nameHint,'Senso-ji');assert.equal(g.url,'https://maps.app.goo.gl/abcd');
 const a=parseMapsPlaceLink('https://maps.apple.com/?name=Senso-ji&place-id=abc&ll=35,139');assert.equal(a.identity,'apple:id:abc');
 assert.equal(parseMapsPlaceLink('https://www.google.com/maps/search/?api=1&query=Park&query_place_id=xyz').identity,'google:id:xyz');
 for(const u of ['http://maps.apple.com/?q=Park','https://google.com.evil.example/maps/place/Park','https://maps.app.goo.gl@evil.example/a','https://www.google.com/maps/@35,139,13z','https://127.0.0.1/maps?q=Park'])assert.throws(()=>parseMapsPlaceLink(u));
});
test('only publishing a unique Maps place counts; legacy physical check-ins and cancelled drafts do not',()=>{
 const s=seed(),d=draft();assert.equal(shareTaskProgress(s,now).count,0);
 const old=confirmPlaceCheckIn(s,{...d,maps:undefined,id:'old'},now);assert.equal(shareTaskProgress(old,now).count,0);
 const next=publishMapsPlace(s,{...d,location:{...d.location,source:'device',latitude:35} as PlaceDraft['location']},now);
 assert.equal(shareTaskProgress(next,now).count,1);assert.equal(next.placeJournal!.entries[0].location.source,'maps');assert.ok(!('latitude' in next.placeJournal!.entries[0].location));assert.equal(next.daily.playsToday,s.daily.playsToday);
 assert.equal(publishMapsPlace(next,d,now),next);assert.throws(()=>publishMapsPlace(s,{...d,maps:undefined},now),/Maps/);
});
test('reposts and provider aliases cannot mint credit in this month or a later month',()=>{
 const s=publishMapsPlace(seed(),draft(),now),alias={...draft('alias',' SENSO-JI '),maps:parseMapsPlaceLink('https://maps.apple.com/?q=Senso-ji&auid=other')};
 assert.throws(()=>publishMapsPlace(s,alias,now),/already shared/);
 assert.throws(()=>publishMapsPlace(s,draft('later'),new Date(2026,11,2)),/already shared/);
 const renamed={...draft('renamed','Different text'),maps:draft().maps};assert.throws(()=>publishMapsPlace(s,renamed,now),/already shared/);
 const otherCity=publishMapsPlace(s,draft('osaka','Senso-ji','Osaka'),now);assert.equal(shareTaskProgress(otherCity,now).count,2);
});
test('15 unique places complete the month, rollover resets progress, a missed month pauses activity',()=>{
 let s=seed();for(let i=0;i<15;i++)s=publishMapsPlace(s,draft('p'+i,'Place '+i),now);
 assert.equal(shareTaskProgress(s,now).done,true);assert.equal(shareTaskProgress(s,now).remaining,0);assert.equal(sharedMapPlaces(s).length,15);
 assert.equal(shareTaskProgress(s,new Date(2026,11,1)).count,0);assert.equal(shareTaskProgress(s,new Date(2026,11,1)).active,true);assert.equal(shareTaskProgress(s,new Date(2027,0,1)).active,false);
});
test('own saves never score; eligible received favourites are idempotent and reversible',()=>{
 let s=publishMapsPlace(seed(),draft(),now);const p=palSummaries(s)[0];s=togglePlaceFavorite(s,'p1',now);assert.equal(receivedPlaceFavs(s),0);assert.equal(placeShareLeaderboard(s).length,0);
 s=recordReceivedPlaceFav(s,'p1',p.id,true,now);assert.equal(receivedPlaceFavs(s),1);assert.equal(placeShareLeaderboard(s)[0].id,'you');
 s=recordReceivedPlaceFav(s,'p1',p.id,true,now);assert.equal(receivedPlaceFavs(s),1);
 s=recordReceivedPlaceFav(s,'p1',p.id,false,now);assert.equal(receivedPlaceFavs(s),0);assert.equal(placeShareLeaderboard(s).length,0);
 assert.throws(()=>recordReceivedPlaceFav(s,'missing',p.id,true,now));assert.throws(()=>recordReceivedPlaceFav(s,'p1','you',true,now));
});
test('favouriting a roamie scores the roamie, while received favs rank you higher',()=>{
 let s=publishMapsPlace(seed(),draft(),now);const pals=palSummaries(s),place=placeCheckInFeed(s,undefined,now).find(p=>p.peerId===pals[0].id)!;
 s=togglePlaceFavorite(s,place.id,now);assert.equal(placeShareLeaderboard(s)[0].id,pals[0].id);
 s=recordReceivedPlaceFav(s,'p1',pals[0].id,true,now);assert.equal(placeShareLeaderboard(s).find(r=>r.you)!.rank,1);
 s=recordReceivedPlaceFav(s,'p1',pals[1].id,true,now);assert.equal(placeShareLeaderboard(s)[0].id,'you');assert.equal(placeShareLeaderboard(s)[1].rank,2);
});
test('sharing, scores and Maps metadata survive restart; blocked roamies and children do not score',()=>{
 let s=publishMapsPlace(seed(),draft(),now);const p=palSummaries(s)[0];s=recordReceivedPlaceFav(s,'p1',p.id,true,now);
 const restored=readPreview(JSON.parse(JSON.stringify(s)),now);assert.equal(shareTaskProgress(restored,now).count,1);assert.equal(receivedPlaceFavs(restored),1);assert.equal(sharedMapPlaces(restored)[0].maps!.identity,draft().maps!.identity);
 const blocked={...restored,blocked:[p.id]};assert.equal(receivedPlaceFavs(blocked),0);assert.throws(()=>recordReceivedPlaceFav(blocked,'p1',p.id,true,now));
 const child={...restored,profile:{...restored.profile!,ageBand:'10-12' as const}};assert.equal(receivedPlaceFavs(child),0);assert.equal(placeShareLeaderboard(child).length,0);assert.equal(sharedMapPlaces(child).length,0);
});
