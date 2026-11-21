import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,readPreview,confirmPlaceCheckIn,checkInMonthProgress,placeCheckInFeed,togglePlaceFavorite,favoritePlaces,placeInterests,PLACE_CATEGORIES,placeCategorySVG,seedGlobalPals,type PlaceDraft,type PreviewState,type AgeBand} from './index.ts';
const now=new Date(2026,10,20,12);
const seed=(ageBand:AgeBand='25-30'):PreviewState=>({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand,city:'Bengaluru',country:'India'}});
const draft=(id='cafe',name='Corner Café'):PlaceDraft=>({id,name,categoryId:'cafe',location:{city:'Bengaluru',country:'India',countryCode:'IN',source:'device'}});
test('only confirmed check-ins count, and retrying a confirmation is idempotent',()=>{
 const s=seed(),d=draft();assert.equal(checkInMonthProgress(s,now).count,0);
 const next=confirmPlaceCheckIn(s,d,now);assert.equal(checkInMonthProgress(next,now).count,1);
 assert.equal(confirmPlaceCheckIn(next,d,now),next);assert.equal(s.placeJournal!.entries.length,0);
 assert.equal(next.daily.playsToday,0);
});
test('one public place counts once per month even with a new id, casing or category',()=>{
 const s=confirmPlaceCheckIn(seed(),draft(),now);
 assert.throws(()=>confirmPlaceCheckIn(s,{...draft('new',' CORNER  CAFÉ '),categoryId:'mall'},now),/already checked in/);
 const december=new Date(2026,11,1,12),next=confirmPlaceCheckIn(s,draft('december'),december);
 assert.equal(checkInMonthProgress(next,december).count,1);
});
test('three check-ins renew activity, monthly rollover resets progress, missed months pause',()=>{
 let s=seed();for(let i=0;i<3;i++)s=confirmPlaceCheckIn(s,draft('place-'+i,'Public place '+i),new Date(2026,10,2+i*8,12));
 assert.equal(checkInMonthProgress(s,now).done,true);
 const december=new Date(2026,11,1,12),january=new Date(2027,0,1,12);
 assert.equal(checkInMonthProgress(s,december).count,0);assert.equal(checkInMonthProgress(s,december).active,true);
 assert.equal(checkInMonthProgress(s,january).active,false);
 for(let i=0;i<3;i++)s=confirmPlaceCheckIn(s,draft('jan-'+i,'January place '+i),january);
 assert.equal(checkInMonthProgress(s,january).active,true);
});
test('restart preserves check-ins, place favourites and derived interests, without raw GPS',()=>{
 const withCoordinates={...draft(),location:{...draft().location,latitude:12.98765,longitude:77.54321}};
 let s=confirmPlaceCheckIn(seed(),withCoordinates,now);s=togglePlaceFavorite(s,'cafe',now);
 const restored=readPreview(JSON.parse(JSON.stringify(s)),now),own=placeCheckInFeed(restored,undefined,now).find(p=>p.you)!;
 assert.equal(favoritePlaces(restored,now)[0].name,'Corner Café');assert.equal(checkInMonthProgress(restored,now).count,1);
 assert.deepEqual(placeInterests(restored,now).map(i=>[i.category.id,i.score]),[['cafe',3]]);
 assert.ok(!('latitude' in own.location));assert.ok(!('longitude' in own.location));
});
test('private and other age groups do not leak place cards or favourites',()=>{
 const adult=togglePlaceFavorite(confirmPlaceCheckIn(seed(),draft(),now),'cafe',now);
 const child={...adult,profile:{...adult.profile!,ageBand:'10-12' as AgeBand}};
 assert.equal(placeCheckInFeed(child,undefined,now).length,0);assert.equal(favoritePlaces(child,now).length,0);
 const own=confirmPlaceCheckIn(seed('10-12'),draft(),now);assert.equal(placeCheckInFeed(own,undefined,now).length,1);assert.equal(placeCheckInFeed(own,undefined,now)[0].you,true);
});
test('a Bengaluru check-in is not incorrectly shown in the Mumbai city feed',()=>{
 const s=confirmPlaceCheckIn(seed(),draft(),now);assert.equal(placeCheckInFeed(s,'IN',now).length,0);
 assert.equal(placeCheckInFeed(s,undefined,now)[0].location.city,'Bengaluru');
});
test('restoration rejects corrupt categories and future records; old photos receive no check-in credit',()=>{
 const s=confirmPlaceCheckIn(seed(),draft(),now),bad=JSON.parse(JSON.stringify(s));
 bad.placeJournal.entries.push({...bad.placeJournal.entries[0],id:'invalid',categoryId:'not-a-category'});
 bad.placeJournal.entries.push({...bad.placeJournal.entries[0],id:'future',checkedInAt:'2036-01-01T00:00:00Z'});
 const restored=readPreview(bad,now);assert.equal(restored.placeJournal!.entries.length,1);
 const old=JSON.parse(JSON.stringify(seed()));delete old.placeJournal;old.photos.credits=[{captureId:'old-photo',ageBand:'25-30',capturedAt:now.toISOString(),week:'2026-11-16'}];
 assert.equal(checkInMonthProgress(readPreview(old,now),now).count,0);
});
test('all twenty category characters are unique, self-contained SVGs with no unresolved placeholders',()=>{
 assert.equal(PLACE_CATEGORIES.length,20);assert.equal(new Set(PLACE_CATEGORIES.map(c=>c.id)).size,20);
 const art=PLACE_CATEGORIES.map(c=>placeCategorySVG(c.id));assert.equal(new Set(art).size,20);
 for(const svg of art){assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('BODY'));assert.ok(!svg.includes('LIGHT'));assert.ok(!svg.includes('http://')||svg.includes('xmlns="http://www.w3.org/2000/svg"'));}
});
