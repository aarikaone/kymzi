import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,comingHomeVisit,homeVisitForPal,homeVisitChatGate,homeVisitMeet,checkInHomeVisit,previewHomePalCheckIn,startHomeVisitChat,sendHomeVisitMessage,leaveHomeVisit,palFor,readPreview,type PreviewState} from './index.ts';
const NOW=new Date('2026-11-19T05:00:00Z');
function seed():PreviewState{return seedGlobalPals(simulatePalUnlock({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'16-17',city:'Bengaluru',country:'India'},launch:emptyLaunch(NOW)},NOW),NOW,'Asia/Kolkata');}
function own(){const s=seed(),id=comingHomeVisit(s,NOW)!.peerId;return {id,s:checkInHomeVisit(s,id,{city:'Bengaluru',country:'India',placeId:'park',placeName:'Public park entrance'},NOW)};}
function ready(){const {id,s}=own();return {id,s:previewHomePalCheckIn(s,id,{city:'Bengaluru',country:'India'},NOW)};}
test('a planned visit alone never opens chat; an explicit public-place check-in still waits for the roamie',()=>{
 const original=seed(),id=comingHomeVisit(original,NOW)!.peerId;assert.equal(homeVisitChatGate(original,id,NOW).open,false);assert.throws(()=>startHomeVisitChat(original,id,NOW));assert.throws(()=>previewHomePalCheckIn(original,id,{city:'Bengaluru',country:'India'},NOW),/Check in/);
 const s=checkInHomeVisit(original,id,{city:'Bengaluru',country:'India',placeId:'park'},NOW),gate=homeVisitChatGate(s,id,NOW);assert.equal(gate.reason,'waiting');assert.equal(gate.ownActive,true);assert.equal(gate.peerActive,false);assert.equal(gate.open,false);assert.deepEqual(s.daily,original.daily);assert.deepEqual(s.social,original.social);assert.deepEqual(s.visits,original.visits);assert.equal(palFor(s,id)!.photoUnlocked,false);assert.equal(homeVisitMeet(s,id)!.preview,true);
});
test('chat requires both active consents in the same city and country, independently from a future arrival date',()=>{
 let {id,s}=own();s=previewHomePalCheckIn(s,id,{city:'Mysuru',country:'India'},NOW);assert.equal(homeVisitChatGate(s,id,NOW).reason,'different-city');assert.throws(()=>startHomeVisitChat(s,id,NOW));s=previewHomePalCheckIn(s,id,{city:'Bengaluru',country:'Another country'},NOW);assert.equal(homeVisitChatGate(s,id,NOW).open,false);
 s=previewHomePalCheckIn(s,id,{city:'  BENGALURU  ',country:' india '},NOW);assert.equal(homeVisitChatGate(s,id,NOW).open,true);s=startHomeVisitChat(s,id,NOW);assert.equal(homeVisitMeet(s,id)!.messages.length,1);s=sendHomeVisitMessage(s,id,'Meet at the public entrance?',NOW);assert.equal(homeVisitMeet(s,id)!.messages.length,3);assert.equal(homeVisitMeet(s,id)!.messages[1].from,'you');assert.equal(palFor(s,id)!.chatUnlocked,false);assert.equal(palFor(s,id)!.matches,1);assert.deepEqual(s.social.threads,{});assert.throws(()=>sendHomeVisitMessage(s,id,'x'.repeat(281),NOW));
});
test('reload preserves check-ins and local messages but cannot prolong them beyond the one-hour expiry',()=>{
 const {id,s}=ready(),chat=sendHomeVisitMessage(startHomeVisitChat(s,id,NOW),id,'Hello!',NOW),copy=readPreview(JSON.parse(JSON.stringify(chat)),NOW);assert.equal(homeVisitChatGate(copy,id,NOW).open,true);assert.deepEqual(homeVisitMeet(copy,id),homeVisitMeet(chat,id));const expired=new Date(NOW.getTime()+60*60000);assert.equal(homeVisitChatGate(copy,id,expired).open,false);assert.throws(()=>sendHomeVisitMessage(copy,id,'Still here?',expired));assert.throws(()=>startHomeVisitChat(copy,id,expired));assert.ok(homeVisitForPal(copy,id));
});
test('checkout and a changed check-in city immediately close the chat without losing history or game progress',()=>{
 const {id,s}=ready(),chat=startHomeVisitChat(s,id,NOW),left=leaveHomeVisit(chat,id);assert.equal(homeVisitChatGate(left,id,NOW).reason,'check-in');assert.equal(homeVisitMeet(left,id)!.chatActive,false);assert.equal(homeVisitMeet(left,id)!.messages.length,1);assert.throws(()=>sendHomeVisitMessage(left,id,'Can I send?',NOW));
 const different=checkInHomeVisit(chat,id,{city:'Mysuru',country:'India',placeId:'cafe'},NOW);assert.equal(homeVisitChatGate(different,id,NOW).open,false);assert.equal(homeVisitMeet(different,id)!.chatActive,false);assert.deepEqual(different.daily,s.daily);assert.deepEqual(different.social,s.social);
});
test('blocking, cohort changes, younger children and changed home-visit ownership prevent city-chat access',()=>{
 const {id,s}=ready();for(const other of [{...s,blocked:[id]},{...s,profile:{...s.profile!,ageBand:'13-15' as const}},{...s,profile:{...s.profile!,ageBand:'10-12' as const}},{...s,profile:{...s.profile!,city:'Chennai'}},{...s,profile:{...s.profile!,name:'999999'}}]){assert.equal(homeVisitChatGate(other,id,NOW).open,false);assert.throws(()=>startHomeVisitChat(other,id,NOW));}
 assert.equal(s.visits.visits.length,0);assert.equal(s.social.meetups.length,0);assert.equal(homeVisitMeet(s,id)!.preview,true);
});
test('corrupt saved records cannot bypass check-in duration or consent and never retain GPS or extra private fields',()=>{
 const {id,s}=ready(),raw=JSON.parse(JSON.stringify(startHomeVisitChat(s,id,NOW)));const m=raw.launch.globalPals.visitMeets[0];m.preview=false;m.own.latitude=12;m.peer.longitude=77;m.secretPhoto='private';const copy=readPreview(raw,NOW),restored=homeVisitMeet(copy,id)!;assert.equal(restored.preview,true);assert.equal(JSON.stringify(restored).includes('latitude'),false);assert.equal(JSON.stringify(restored).includes('longitude'),false);assert.equal(JSON.stringify(restored).includes('secretPhoto'),false);
 m.own.until=new Date(NOW.getTime()+24*3600000).toISOString();assert.equal(homeVisitChatGate(readPreview(raw,NOW),id,NOW).open,false);m.own.until=new Date(NOW.getTime()+60*60000).toISOString();m.peer.consent=false;assert.equal(homeVisitChatGate(readPreview(raw,NOW),id,NOW).open,false);m.owner='999999';assert.equal(homeVisitChatGate(readPreview(raw,NOW),id,NOW).open,false);
});

test('rapid replies remain unique after the 100-message history cap and survive reload',()=>{
 let {id,s}=ready();s=startHomeVisitChat(s,id,NOW);for(let i=0;i<65;i++)s=sendHomeVisitMessage(s,id,`Hello ${i}`,NOW);const messages=homeVisitMeet(s,id)!.messages;assert.equal(messages.length,100);assert.equal(new Set(messages.map(m=>m.id)).size,100);assert.deepEqual(homeVisitMeet(readPreview(JSON.parse(JSON.stringify(s)),NOW),id)!.messages,messages);assert.equal(messages.at(-2)!.text,'Hello 64');
});
