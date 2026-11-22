import test from 'node:test';
import assert from 'node:assert/strict';
import {addVisitedPhoto,MAX_VISITED_PHOTOS,removeVisitedPhoto,visitedPhotoAlbums,emptyTravel,setTravelCity,removeTravelCity,readTravelProfile,sharedTravel,emptyPreview,readPreview,travelPreview,type TravelProfile} from './index.ts';
import {VISITED_JPEGS as images} from './visited-photo-fixture.ts';
const now=new Date('2026-11-22T05:00:00Z');
const visited=()=>setTravelCity(travelPreview([],['JP','FR','IT'],now),'visited',{cityId:'GB',attractionIds:['gb-1','gb-2']});
test('visited photos survive restoration and edits, without adding arrivals, play credits or invitation payloads',()=>{
 const travel=addVisitedPhoto(visited(),'GB',images[0],'gb-1',now),state={...emptyPreview(now),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,travel}},restored=readPreview(JSON.parse(JSON.stringify(state)),now);
 assert.deepEqual(restored.profile!.travel,travel);assert.equal(restored.profile!.travel!.arrivals.length,0);assert.deepEqual(JSON.parse(JSON.stringify(restored.daily)),state.daily);assert.deepEqual(restored.photos,state.photos);
 assert.equal(JSON.stringify(sharedTravel(travel)).includes('data:image'),false);assert.equal(JSON.stringify(sharedTravel(travel)).includes('memories'),false);
 assert.equal(setTravelCity(travel,'visited',{cityId:'GB',attractionIds:['gb-1']}).memories!.length,1);
 assert.equal(setTravelCity(travel,'wishlist',{cityId:'FR',attractionIds:['fr-1']}).memories!.length,1);
 assert.equal(setTravelCity(travel,'visited',{cityId:'GB',attractionIds:['gb-2']}).memories,undefined);
 assert.equal(removeTravelCity(travel,'visited','GB').memories,undefined);
});
test('photo albums are sorted by latest addition and deleting a photo updates the album',()=>{
 let t=addVisitedPhoto(visited(),'GB',images[0],'gb-1',now);t=addVisitedPhoto(t,'GB',images[1],'gb-2',new Date(now.getTime()+1000));t=addVisitedPhoto(t,'GB',images[2],'gb-1',new Date(now.getTime()+2000));
 const albums=visitedPhotoAlbums(t);assert.equal(albums.length,2);assert.equal(albums[0].placeId,'gb-1');assert.deepEqual(albums[0].photos.map(p=>p.image),[images[2],images[0]]);
 t=removeVisitedPhoto(t,albums[0].photos[0].id);assert.equal(visitedPhotoAlbums(t)[0].placeId,'gb-2');for(const photo of [...t.memories!])t=removeVisitedPhoto(t,photo.id);assert.equal(t.memories,undefined);
});
test('uploads reject missing visits, unselected attractions, duplicate images and unsafe image sources',()=>{
 assert.throws(()=>addVisitedPhoto(emptyTravel(),'GB',images[0]),/visited/);assert.throws(()=>addVisitedPhoto(visited(),'GB',images[0],'gb-3'),/visited/);
 const t=addVisitedPhoto(visited(),'GB',images[0]);assert.throws(()=>addVisitedPhoto(t,'GB',images[0],'gb-1'),/already/);
 for(const image of ['https://untrusted.example/a.jpg','file:///original.jpg','data:image/svg+xml;base64,AAA','data:image/jpeg;base64,/9j/2Q=='])assert.throws(()=>addVisitedPhoto(visited(),'GB',image));
});
test('restoration strips photo metadata, validates place ownership, deduplicates and caps the device album',()=>{
 const pixel=Buffer.from(images[0].split(',')[1],'base64'),tag=Buffer.from('GPS private original filename'),segment=Buffer.concat([Buffer.from([255,225,0,tag.length+2]),tag]),image='data:image/jpeg;base64,'+Buffer.concat([pixel.subarray(0,2),segment,pixel.subarray(2)]).toString('base64');
 const entry={id:'memory-test',cityId:'GB',placeId:'gb-1',image,addedAt:now.toISOString()};const t=readTravelProfile({...visited(),memories:[entry,{...entry,id:'memory-invalid',cityId:'JP'},{...entry,id:'memory-wrongplace',placeId:'fr-1'},{...entry,id:'memory-duplicate'},{...entry,id:'bad-id'}]});assert.equal(t.memories!.length,1);assert.equal(t.memories![0].image,images[0]);
 const capped={...visited(),memories:Array.from({length:MAX_VISITED_PHOTOS},(_,i)=>({...entry,id:`memory-${i}`,image:images[i%4]}))} as TravelProfile;
 // Valid distinct pixel streams with harmless JFIF density changes.
 capped.memories=capped.memories!.map((p,i)=>{const bytes=Buffer.from(p.image.split(',')[1],'base64');bytes[13]=i+1;return {...p,image:'data:image/jpeg;base64,'+bytes.toString('base64')};});
 assert.equal(readTravelProfile(capped).memories!.length,MAX_VISITED_PHOTOS);assert.throws(()=>addVisitedPhoto(capped,'GB',images[3]),/full/);
});
