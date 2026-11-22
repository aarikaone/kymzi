import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,searchGemPlaces,gemPlaceFromMaps,makePhotoGemDraft,publishMapsPlace,readPreview,placeCheckInFeed,cleanPlaceDraft,MAX_GEM_PHOTOS} from './index.ts';
import {VISITED_JPEGS} from './visited-photo-fixture.ts';
const NOW=new Date('2026-11-23T06:00:00Z'),photos=VISITED_JPEGS.slice(0,2).map((image,i)=>({id:'photo-'+i,image}));
const seed=()=>({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const},launch:emptyLaunch(NOW)});
test('the local Places-style search finds names, cities and Bangalore aliases without a network lookup',()=>{
 assert.equal(searchGemPlaces('Cubbon Bengaluru')[0].name,'Cubbon Park');assert.equal(searchGemPlaces('Bangalore')[0].city,'Bengaluru');assert.equal(searchGemPlaces('hawa jaipur')[0].name,'Hawa Mahal');assert.equal(searchGemPlaces('unknown moon cafe').length,0);
 const imported=gemPlaceFromMaps('https://maps.apple.com/?q=Cubbon+Park,+Bengaluru,+India&auid=123');assert.equal(imported.address,searchGemPlaces('Cubbon')[0].address);assert.equal(imported.mapsUrl.includes('auid=123'),true);assert.throws(()=>gemPlaceFromMaps('https://evil.example/park'));
});
test('a sample image cannot be published, and real place photos retain their address and pin after reload',()=>{
 const place=searchGemPlaces('Cubbon')[0],before=seed();assert.throws(()=>makePhotoGemDraft(place,[]),/own photo/);assert.throws(()=>makePhotoGemDraft({...place,address:''},photos),/address/);
 const draft=makePhotoGemDraft(place,photos,'Go early for the quiet paths.','gem'),next=publishMapsPlace(before,draft,NOW),restored=readPreview(JSON.parse(JSON.stringify(next)),NOW),post=placeCheckInFeed(restored,undefined,NOW).find(p=>p.id==='gem')!;
 assert.equal(post.photos?.length,2);assert.deepEqual(post.photos,photos);assert.equal(post.location.address,place.address);assert.equal(post.location.placePin?.latitude,place.latitude);assert.equal(post.location.placePin?.longitude,place.longitude);assert.equal(post.tip,draft.tip);assert.equal('sampleId' in post,false);assert.equal(post.illustration,undefined);assert.deepEqual(JSON.parse(JSON.stringify(restored.daily)),JSON.parse(JSON.stringify(before.daily)));assert.equal(restored.profile?.travel?.arrivals?.length??0,0);
});
test('photo validation rejects remote image URLs, duplicate IDs, oversized albums and invalid place pins',()=>{
 const place=searchGemPlaces('Hawa')[0],draft=makePhotoGemDraft(place,photos);
 assert.throws(()=>cleanPlaceDraft({...draft,photos:[{id:'remote',image:'https://example.com/photo.jpg'}]}));assert.throws(()=>cleanPlaceDraft({...draft,photos:[photos[0],photos[0]]}));
 assert.throws(()=>cleanPlaceDraft({...draft,photos:Array.from({length:MAX_GEM_PHOTOS+1},(_,i)=>({id:String(i),image:photos[0].image}))}),/5 photos/);
 assert.throws(()=>cleanPlaceDraft({...draft,location:{...draft.location,placePin:{latitude:200,longitude:0}}}),/valid place location/);
 const child={...seed(),profile:{...seed().profile,ageBand:'10-12' as const}},shared=publishMapsPlace(child,draft,NOW);assert.equal(placeCheckInFeed(shared,undefined,NOW).every(p=>p.you),true);
});
