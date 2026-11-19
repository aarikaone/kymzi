import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,beginDaily,answerDaily,submitDaily,completeDemoPlay,beginPalPlay,palFor,palSummaries,canChat,startDemoChat,sendDemoMessage,readPreview,readDaily,checkInAtSpot,sharePalMeeting,respondPalMeeting,cityToday,cityPhotoFeed,palForMoment,recordConnections,completedPreviewMatches,palMeetingStatus,palUpdates,type PreviewState,type AgeBand} from './index.ts';
const NOW=new Date('2026-11-18T05:00:00Z');
function first(band:AgeBand='18-20'){let s:PreviewState={...emptyPreview(NOW),profile:{name:'PrivateName',avatar:'cloud',ageBand:band}},daily=beginDaily(s.daily,band,NOW,'food','JP');for(const id of daily.active!.ids)daily=answerDaily(daily,id,'anything new',NOW);return completeDemoPlay({...s,daily},NOW);}
function again(s:PreviewState,id:string){let daily=beginPalPlay(s,id,'food',NOW);for(const q of daily.active!.ids)daily=answerDaily(daily,q,'a new thought',NOW);return completeDemoPlay({...s,daily},NOW);}
test('the same pal reveals their photo at 3 matches, opens chat at 5, and cannot consume a sixth targeted play',()=>{
 let s=first();const id=palSummaries(s)[0].id;
 for(let n=1;n<=5;n++){const p=palFor(s,id)!;assert.equal(p.matches,n);assert.ok(p.avatar);assert.equal(p.photoUnlocked,n>=3);assert.equal(!!p.photoFrame,n>=3);assert.equal(p.chatUnlocked,n===5);assert.equal(canChat(s.social,id,'18-20'),n===5);assert.equal(palSummaries(s).length,1);assert.equal(s.daily.playsToday,n);if(n<5)s=again(s,id);}
 assert.equal(recordConnections(s.social,{...s.daily,played:6},'18-20',completedPreviewMatches(s)),s.social);const before=JSON.stringify(s);assert.throws(()=>beginPalPlay(s,id,'food',NOW),/Five games/);assert.equal(JSON.stringify(s),before);
 const social=startDemoChat(s.social,id,'18-20',[],NOW),reply=sendDemoMessage(social,id,'18-20','Tell me about Sensō-ji',[],NOW);assert.equal(reply.threads[id].messages.length,3);assert.match(reply.threads[id].messages.at(-1)!.body,/City tip:/);
 assert.equal(palFor(readPreview(JSON.parse(JSON.stringify(s)),NOW),id)!.matches,5);
});
test('a targeted draft remains free until submission and resumes the same pal after persistence',()=>{
 let s=first(),id=palSummaries(s)[0].id,daily=beginPalPlay(s,id,'animals',NOW);assert.equal(daily.playsToday,1);daily=answerDaily(daily,daily.active!.ids[0],'Fox',NOW);s={...s,daily};
 const restored=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.equal(restored.daily.active!.peerId,id);assert.equal(restored.daily.playsToday,1);assert.equal(beginPalPlay(restored,'not-a-pal','food',NOW).active!.peerId,id);
 const charged=submitDaily(restored.daily,restored.daily.active!.ids[0],NOW);assert.equal(charged.playsToday,2);assert.equal(readDaily(charged,false,NOW).active!.peerId,id);
});
test('a capped pal is skipped by the next random play without duplicating the old connection',()=>{
 let s=first();const id=palSummaries(s)[0].id;for(let n=1;n<5;n++)s=again(s,id);const later=new Date('2026-11-19T16:00:00Z');let daily=beginDaily(s.daily,'18-20',later,'food','JP');for(const q of daily.active!.ids)daily=answerDaily(daily,q,'new answer',later);s=completeDemoPlay({...s,daily},later);assert.equal(palFor(s,id)!.matches,5);assert.equal(palSummaries(s).length,2);assert.equal(s.daily.playsToday,1);
});
test('pal photo authors resolve to anonymous city aliases and do not reveal names before or after avatar unlock',()=>{
 let s=first('16-17');const id=palSummaries(s)[0].id;assert.equal(palForMoment(s,cityPhotoFeed(s,'JP',NOW)[0])!.id,id);assert.equal(JSON.stringify(palSummaries(s)).includes('Luna'),false);s=again(again(s,id),id);assert.ok(palFor(s,id)!.avatar);assert.equal(JSON.stringify(palSummaries(s)).includes('Luna'),false);assert.equal(palSummaries({...s,blocked:[id]}).length,0);assert.equal(palSummaries({...s,profile:{...s.profile!,ageBand:'13-15'}}).length,0);
});
test('an adult shares only a checked-in public attraction and future time, with separate mutual acceptance',()=>{
 let s=first(),id=palSummaries(s)[0].id,when=new Date(NOW.getTime()+15*60000).toISOString();assert.throws(()=>sharePalMeeting(s,id,'jp-1',when,NOW),/Check in/);
 s={...s,visits:checkInAtSpot(s,'JP','jp-1',NOW)};assert.throws(()=>sharePalMeeting(s,id,'jp-2',when,NOW),/Check in/);assert.throws(()=>sharePalMeeting(s,id,'jp-1',new Date(NOW.getTime()+90*60000).toISOString(),NOW),/within/);
 s={...s,social:sharePalMeeting(s,id,'jp-1',when,NOW)};const plan=s.social.meetups[0];assert.equal(plan.peerAccepted,false);assert.equal(plan.status,'proposed');assert.equal(sharePalMeeting(s,id,'jp-1',when,NOW),s.social);
 const restored=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.equal(restored.social.meetups[0].spotId,'jp-1');s={...restored,social:respondPalMeeting(restored,plan.id,true,NOW)};assert.equal(s.social.meetups[0].status,'confirmed');assert.equal(s.social.meetups[0].peerAccepted,true);assert.equal(palMeetingStatus(s,s.social.meetups[0],new Date(NOW.getTime()+61*60000)),'expired');assert.ok(palUpdates(s,NOW).some(n=>n.target==='pal-meet'&&n.peerId===id));assert.throws(()=>respondPalMeeting(restored,plan.id,true,new Date(NOW.getTime()+61*60000)),/expired/);assert.equal(respondPalMeeting(s,plan.id,false,NOW).meetups[0].status,'cancelled');
});
test('teen and private-child profiles cannot share a meeting location',()=>{
 const teen=first('16-17'),id=palSummaries(teen)[0].id;assert.throws(()=>sharePalMeeting(teen,id,'jp-1',new Date(NOW.getTime()+15*60000).toISOString(),NOW));const child=first('10-12');assert.equal(palSummaries(child).length,0);assert.throws(()=>beginPalPlay(child,id,'food',NOW));
});

test('chosen characters stay public and unchanged while personal photo previews remain gated',()=>{
 let s=first('16-17'),p=palSummaries(s)[0],image=p.imageAvatar;assert.equal(image,p.avatar);assert.equal(p.photoFrame,undefined);assert.equal(p.photoUnlocked,false);assert.equal(palFor(readPreview(JSON.parse(JSON.stringify(s)),NOW),p.id)!.imageAvatar,image);
 s=again(s,p.id);p=palFor(s,p.id)!;assert.equal(p.imageAvatar,image);assert.equal(p.photoFrame,undefined);assert.equal(palForMoment(s,cityPhotoFeed(s,'JP',NOW)[0])!.imageAvatar,image);
 s=again(s,p.id);p=palFor(s,p.id)!;assert.equal(p.imageAvatar,image);assert.ok(p.photoFrame);assert.equal(p.photoUnlocked,true);assert.equal(p.chatUnlocked,false);
});
