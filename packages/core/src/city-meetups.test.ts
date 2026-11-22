import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,beginCityMeetup,chooseMeetupCity,checkInForMeetup,chooseMeetupRequest,dismissMeetupRequest,pinCityMeetup,previewMeetupArrival,cancelPinnedMeetup,leaveMeetupCity,viewMeetupRequests,cityMeetupActive,cityMeetupStatus,cityMeetupNotice,readCityMeetup,readPreview,citySpots,type CityMeetupState,type Profile} from './index.ts';
const NOW=new Date('2026-11-19T05:00:00Z'),profile:Profile={name:'123456',ageBand:'21-24',avatar:'cloud',city:'Chennai',country:'India'},spots=citySpots('JP');
function checked(){return checkInForMeetup(chooseMeetupCity(beginCityMeetup(profile),'JP'),spots[0].id,NOW);}
function pinned(){const s=checked();return pinCityMeetup(chooseMeetupRequest(s,s.requests[0].id,NOW),spots[1].id,10,NOW);}
test('explicit city check-in creates only local fictional requests and an hour of manually declared presence',()=>{
 let s=beginCityMeetup(profile);assert.equal(s.checkIn,null);assert.equal(s.requests.length,0);s=chooseMeetupCity(s,'JP');assert.equal(s.checkIn,null);s=checkInForMeetup(s,spots[0].id,NOW);
 assert.equal(cityMeetupActive(s,NOW),true);assert.equal(Date.parse(s.checkIn!.until)-NOW.getTime(),60*60000);assert.equal(s.requests.length,2);assert.equal(s.requests.every(r=>r.status==='new'),true);assert.equal(checkInForMeetup(s,spots[0].id,NOW),s);assert.throws(()=>chooseMeetupCity(s,'FR'),/Check out/);
 const root={...emptyPreview(NOW),profile,launch:emptyLaunch(NOW),cityMeetup:s},copy=readPreview(JSON.parse(JSON.stringify(root)),NOW);assert.deepEqual(copy.cityMeetup,s);assert.equal(copy.social.proofs.length,0);assert.equal(copy.passport.journeys.length,0);assert.equal(copy.daily.playsToday,0);
});
test('incoming requests lead to a public pin, explicit coming confirmation, then explicit arrival',()=>{
 const s=pinned();assert.equal(s.meeting!.spotId,spots[1].id);assert.notEqual(s.checkIn!.spotId,s.meeting!.spotId);assert.equal(cityMeetupStatus(s,NOW),'pinned');assert.throws(()=>previewMeetupArrival(s,'arrived',NOW));
 const coming=previewMeetupArrival(s,'coming',NOW);assert.equal(cityMeetupStatus(coming,NOW),'coming');assert.equal(cityMeetupNotice(coming,NOW)!.title,'@boba_trails is coming');
 const arrived=previewMeetupArrival(coming,'arrived',NOW);assert.equal(cityMeetupStatus(arrived,NOW),'arrived');assert.equal(cityMeetupNotice(arrived,NOW)!.title,'@boba_trails is at the pin');assert.throws(()=>previewMeetupArrival(arrived,'coming',NOW));
 assert.deepEqual(readCityMeetup(JSON.parse(JSON.stringify(arrived)),profile),arrived);
});
test('pins cannot bypass check-in, request ownership, public locations, meeting times or active-plan limits',()=>{
 const empty=beginCityMeetup(profile);assert.throws(()=>chooseMeetupRequest(empty,'preview-pal-024',NOW));assert.throws(()=>checkInForMeetup(chooseMeetupCity(empty,'JP'),'hotel-room',NOW));
 const s=checked(),selected=chooseMeetupRequest(s,s.requests[0].id,NOW);assert.throws(()=>chooseMeetupRequest(s,'some-real-user',NOW));assert.throws(()=>pinCityMeetup(s,spots[0].id,10,NOW));assert.throws(()=>pinCityMeetup(selected,citySpots('FR')[0].id,10,NOW));assert.throws(()=>pinCityMeetup(selected,spots[0].id,5,NOW));
 assert.throws(()=>pinCityMeetup(selected,spots[0].id,20,new Date(NOW.getTime()+45*60000)));assert.throws(()=>chooseMeetupRequest(pinned(),s.requests[1].id,NOW));
});
test('expiry and checkout withdraw requests and arrival access without inferring anyone’s physical location',()=>{
 const s=pinned(),later=new Date(NOW.getTime()+60*60000);assert.equal(cityMeetupActive(s,later),false);assert.equal(cityMeetupStatus(s,later),'expired');assert.equal(cityMeetupNotice(s,later),null);assert.throws(()=>previewMeetupArrival(s,'coming',later));
 const left=leaveMeetupCity(s);assert.equal(left.checkIn,null);assert.equal(left.requests.length,0);assert.equal(left.meeting,null);assert.equal(cityMeetupNotice(left,NOW),null);assert.equal(chooseMeetupCity(left,'FR').cityId,'FR');
 const newVisit=checkInForMeetup(left,spots[2].id,later);assert.equal(newVisit.checkIn!.spotId,spots[2].id);assert.equal(newVisit.requests.length,2);
});
test('passing, cancelling and notification reads preserve consent and avoid duplicate requests',()=>{
 const s=checked(),passed=dismissMeetupRequest(s,s.requests[0].id,NOW);assert.equal(passed.requests.filter(r=>r.status==='new').length,1);assert.throws(()=>chooseMeetupRequest(passed,s.requests[0].id,NOW));
 const plan=pinned(),cancelled=cancelPinnedMeetup(plan);assert.equal(cancelled.meeting,null);assert.equal(cancelled.requests[0].status,'declined');assert.equal(chooseMeetupRequest(cancelled,cancelled.requests[1].id,NOW).step,'pin');
 assert.equal(cityMeetupNotice(s,NOW)!.unread,true);const seen=viewMeetupRequests(s);assert.equal(cityMeetupNotice(seen,NOW)!.unread,false);assert.equal(cityMeetupNotice(previewMeetupArrival({...plan,seen:plan.update},'coming',NOW),NOW)!.unread,true);
});
test('younger children remain private and teen walkthroughs cannot change age or create public adult presence',()=>{
 assert.throws(()=>beginCityMeetup({...profile,ageBand:'10-12'}));const teen={...profile,ageBand:'16-17' as const},s=checked(),preview=beginCityMeetup(teen);assert.equal(preview.preview,true);assert.equal(teen.ageBand,'16-17');assert.equal(readCityMeetup(s,teen),undefined);assert.equal(readCityMeetup(s,{...profile,name:'999999'}),undefined);
 const restored=readCityMeetup({...chooseMeetupCity(preview,'JP'),preview:false},teen)!;assert.equal(restored.preview,true);assert.equal(restored.ageBand,'16-17');
});
test('restoring corrupt state rejects invalid pins, fabricated identities and excessive presence without throwing',()=>{
 const s=pinned(),raw=JSON.parse(JSON.stringify(s));raw.requests[0].alias='Real Person';raw.requests[0].avatar='real-photo';raw.requests.push({id:'real-user',alias:'Someone',avatar:'cloud',status:'new'});raw.latitude=1;raw.meeting.longitude=2;
 const restored=readCityMeetup(raw,profile)!;assert.equal(restored.requests[0].alias,'@boba_trails');assert.equal(restored.requests[0].avatar,'boba');assert.equal(restored.requests.length,2);assert.equal(JSON.stringify(restored).includes('latitude'),false);assert.equal(JSON.stringify(restored).includes('longitude'),false);
 raw.checkIn.until=new Date(NOW.getTime()+4*3600000).toISOString();const invalid=readCityMeetup(raw,profile)!;assert.equal(invalid.checkIn,null);assert.equal(invalid.meeting,null);assert.equal(invalid.requests.length,0);
 assert.doesNotThrow(()=>readCityMeetup({version:1,owner:profile.name,ageBand:profile.ageBand,requests:42,meeting:[]},profile));
});
