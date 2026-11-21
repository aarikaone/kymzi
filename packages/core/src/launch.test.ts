import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {emptyPreview,emptyLaunch,beginLaunchPlay,finishLaunchPlay,answerDaily,submitDaily,remainingDailyPlays,completeDemoPlay,makeFriendInvite,answerFriendInvite,rememberInvite,collectPostcard,friendScore,challengeToken,inviteFromToken,replyFromToken,challengeURL,readPreview,toggleGuide,toggleGuidePlace,photoMonthProgress,addHomeMoment,removeHomeMoment,launchMoments,removeLaunchMoment,addCameraMoment,LAUNCH_SETS,palFindingProgress,simulatePalUnlock,resetPalUnlock,beginInvitePreparation,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,invitePreparationIndex,palSummaries,beginPalPlay,worldPlaces,cityPhotoFeed,type FriendInvite,type FriendReply,type PreviewState,type ChallengeCrypto} from './index.ts';
const NOW=new Date('2026-11-18T05:00:00Z');
const crypto:ChallengeCrypto={nonce:()=> 'a'.repeat(32),digest:async value=>createHash('sha256').update(value).digest('hex')};
const owner={name:'123456',avatar:'cloud' as const,ageBand:'16-17' as const,city:'Chennai',country:'India'};
const guest={name:'654321',avatar:'sprout' as const,ageBand:'16-17' as const};
function seed():PreviewState{return {...emptyPreview(NOW),profile:owner,launch:emptyLaunch(NOW)};}
function unlocked():PreviewState{
 let s=seed();const invite:FriendInvite={version:1,id:'0'.repeat(32),createdAt:NOW.toISOString(),person:{name:owner.name,avatar:owner.avatar},ids:[...LAUNCH_SETS[0]],hashes:Array(3).fill('0'.repeat(64))};s=rememberInvite(s,invite,NOW);
 for(let i=1;i<=5;i++){const reply:FriendReply={version:1,id:String(i).repeat(32),completedAt:NOW.toISOString(),invite,person:{name:String(700000+i),avatar:'sprout'},hashes:Array(3).fill('1'.repeat(64))};s=collectPostcard(s,reply,NOW);}
 return {...s,launch:{...s.launch!,invites:[],postcards:[]}};
}
function prepared(){let s=beginInvitePreparation(seed(),NOW);for(let i=0;i<3;i++){s=answerInvitePreparation(s,i,['Mango','Cats','French fries'][i]);if(i<2)s=submitInvitePreparation(s,i);}return finishInvitePreparation(s,NOW);}
function played(){let s=beginLaunchPlay(unlocked(),NOW);for(const [i,id]of s.daily.active!.ids.entries())s={...s,daily:answerDaily(s.daily,id,['Mango','Cats','French fries'][i],NOW)};return finishLaunchPlay(s,NOW);}
test('global play saves answers and a fictional same-cohort roamie with an uncovered city',()=>{
 const s=played();assert.equal(s.launch!.tickets.length,1);assert.equal(s.daily.playsToday,1);assert.equal(s.social.proofs.length,1);assert.equal(s.social.proofs[0].simulated,true);assert.equal(s.passport.journeys.length,1);assert.equal(s.completed,true);assert.equal(palSummaries(s)[0].photoUnlocked,false);assert.ok(cityPhotoFeed(s).length>0);assert.throws(()=>completeDemoPlay(s,NOW));
 const copy=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.deepEqual(copy.launch,s.launch);assert.equal(copy.profile!.city,'Chennai');
});
test('shared launch sets are stable across countries, free until submission, resumable and limited to five plays a day',()=>{
 let s=unlocked(),a=beginLaunchPlay(s,NOW),b=beginLaunchPlay({...s,profile:{...owner,country:'France'}},NOW);assert.deepEqual(a.daily.active!.ids,b.daily.active!.ids);assert.equal(a.daily.playsToday,0);
 const id=a.daily.active!.ids[0];a={...a,daily:answerDaily(a.daily,id,'my draft',NOW)};assert.equal(beginLaunchPlay(a,NOW).daily.active!.answers[id],'my draft');a={...a,daily:submitDaily(a.daily,id,NOW)};assert.equal(a.daily.playsToday,1);
 for(let i=0;i<5;i++){s=beginLaunchPlay(s,NOW);for(const q of s.daily.active!.ids)s={...s,daily:answerDaily(s.daily,q,'my answer',NOW)};s=finishLaunchPlay(s,NOW);}assert.equal(remainingDailyPlays(s.daily,NOW),0);assert.throws(()=>beginLaunchPlay(s,NOW));assert.equal(beginLaunchPlay(s,new Date(NOW.getTime()+36*3600000)).daily.playsToday,5);
});
test('friend links contain no answers or private images, compare normalized answers honestly and award only postcards',async()=>{
 const s=played(),invite=await makeFriendInvite(s,crypto,NOW),token=challengeToken(invite),open=inviteFromToken(token,NOW);
 assert.deepEqual(open,invite);assert.equal(JSON.stringify(invite).includes('Mango'),false);assert.equal(JSON.stringify(invite).includes('data:image'),false);assert.equal(challengeURL('https://example.test/',invite).startsWith('https://example.test/#/challenge/'),true);
 const reply=await answerFriendInvite(open,guest,['mango!','cat','toast'],{...crypto,nonce:()=> 'b'.repeat(32)},NOW);assert.equal(friendScore(reply).shared,2);assert.deepEqual(replyFromToken(challengeToken(reply),NOW),reply);
 const all=await answerFriendInvite(open,guest,['Mango','cat','fries'],crypto,NOW);assert.equal(friendScore(all).shared,3);
 const none=await answerFriendInvite(open,guest,['none','none','none'],crypto,NOW);assert.equal(friendScore(none).shared,0);
 const sent=rememberInvite(s,invite,NOW),saved=collectPostcard(sent,reply,NOW);assert.equal(saved.launch!.postcards.length,1);assert.equal(collectPostcard(saved,reply,NOW),saved);assert.deepEqual(saved.social,s.social);assert.deepEqual(saved.daily,s.daily);assert.equal(saved.profile!.photo,undefined);
 assert.throws(()=>collectPostcard({...seed(),profile:{...owner,name:'999999'}},reply,NOW));
});
test('corrupt, expired and oversized challenge links fail safely and children cannot create invitations',async()=>{
 const s=played(),invite=await makeFriendInvite(s,crypto,NOW);assert.throws(()=>inviteFromToken(challengeToken(invite),new Date(NOW.getTime()+8*86400000)));assert.throws(()=>inviteFromToken('x'.repeat(6001),NOW));assert.throws(()=>inviteFromToken('not%a%token',NOW));
 await assert.rejects(makeFriendInvite({...s,profile:{...owner,ageBand:'10-12'}},crypto,NOW));assert.throws(()=>challengeURL('javascript:alert(1)',invite));
});
test('city guides and saved places work before any roamie and never create a city match',()=>{
 const s=toggleGuidePlace(toggleGuide(seed(),'JP',NOW),'jp-1',NOW);assert.deepEqual(s.launch!.guides,['JP']);assert.deepEqual(s.launch!.places,['jp-1']);assert.equal(s.social.proofs.length,0);assert.equal(toggleGuide(s,'JP',NOW).launch!.guides.length,0);assert.equal(photoMonthProgress(s,NOW).count,0);
});

const JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDQooor0TU//9k=";
test('a first home photo works without a roamie, credits the month once and keeps its original city',()=>{
 const initial=seed(),moment={captureId:'home-first',image:JPEG,capturedAt:NOW.toISOString()};
 assert.throws(()=>addHomeMoment(initial,moment,false,NOW));
 const saved=addHomeMoment(initial,moment,true,NOW);assert.equal(saved.launch!.homePhotos[0].city,'Chennai');assert.equal(photoMonthProgress(saved,NOW).count,1);assert.equal(saved.social.proofs.length,0);
 assert.equal(addHomeMoment(saved,moment,true,NOW),saved);assert.throws(()=>addHomeMoment(saved,{...moment,captureId:'repeated-image'},true,NOW));
 const restored=readPreview(JSON.parse(JSON.stringify(saved)),NOW);assert.deepEqual(restored.launch,saved.launch);
 const removed=removeHomeMoment(restored,'home-first');assert.equal(removed.launch!.homePhotos.length,0);assert.equal(photoMonthProgress(removed,NOW).count,1);
 assert.throws(()=>addHomeMoment(initial,{...moment,capturedAt:new Date(NOW.getTime()-20*60000).toISOString()},true,NOW));
});
test('completed postcards stay viewable after the invitation expires, without extending an invitation',async()=>{
 const s=played(),invite=await makeFriendInvite(s,crypto,NOW),reply=await answerFriendInvite(invite,guest,['a','b','c'],crypto,NOW),later=new Date(NOW.getTime()+8*86400000);
 assert.equal(friendScore(replyFromToken(challengeToken(reply),later)).shared,0);assert.throws(()=>inviteFromToken(challengeToken(invite),later));
});

test('adopting launch keeps older camera moments visible and preserves their earned monthly credits',()=>{
 const initial=seed(),state={...initial,photos:addCameraMoment(initial,{captureId:'before-launch',countryId:'JP',image:JPEG,capturedAt:NOW.toISOString()},true,NOW)};
 assert.equal(launchMoments(state)[0].city,'Tokyo');assert.equal(photoMonthProgress(state,NOW).count,1);
 const next=removeLaunchMoment(state,'before-launch');assert.equal(launchMoments(next).length,0);assert.equal(photoMonthProgress(next,NOW).count,1);assert.deepEqual(next.social,state.social);
});

test('roamie finding requires five distinct completed friends, not shares, duplicate replies or received postcards',async()=>{
 let s=prepared();assert.equal(palFindingProgress(s).count,0);assert.throws(()=>beginLaunchPlay(s,NOW),/5 friends/);
 const invite=await makeFriendInvite(s,crypto,NOW);s=rememberInvite(s,invite,NOW);assert.equal(palFindingProgress(s).count,0);
 for(let i=1;i<=5;i++){
  const friend={...guest,name:String(600000+i)},reply=await answerFriendInvite(invite,friend,['x','y','z'],{...crypto,nonce:()=>String(i).repeat(32)},NOW);
  s=collectPostcard(s,reply,NOW);assert.equal(palFindingProgress(s).count,i);assert.equal(palFindingProgress(s).unlocked,i===5);
  const repeat=await answerFriendInvite(invite,friend,['a','b','c'],{...crypto,nonce:()=>(i+5).toString(16).repeat(32)},NOW);s=collectPostcard(s,repeat,NOW);assert.equal(palFindingProgress(s).count,i);
  if(i<5)assert.throws(()=>beginLaunchPlay(s,NOW));
 }
 assert.equal(beginLaunchPlay(s,NOW).daily.playsToday,0);assert.equal(s.social.proofs.length,0);
 const archived={...s,launch:{...s.launch!,postcards:[],invites:[]}},restored=readPreview(JSON.parse(JSON.stringify(archived)),NOW);assert.equal(palFindingProgress(restored).unlocked,true);
 const received=await answerFriendInvite(invite,guest,['a','b','c'],crypto,NOW),guestState=collectPostcard({...seed(),profile:guest},received,NOW);assert.equal(palFindingProgress(guestState).count,0);
});
test('making an invite is free, resumes and works while global games are closed',()=>{
 const initial={...seed(),daily:{...seed().daily,usageDay:'2026-11-17',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-18T13:30:00Z'}};
 let s=beginInvitePreparation(initial,NOW);s=answerInvitePreparation(s,0,'My first answer');s=submitInvitePreparation(s,0);const restored=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.equal(invitePreparationIndex(restored),1);assert.equal(restored.launch!.preparation!.answers[0],'My first answer');
 s=answerInvitePreparation(restored,1,'second');s=submitInvitePreparation(s,1);s=answerInvitePreparation(s,2,'third');s=finishInvitePreparation(s,NOW);assert.deepEqual(s.daily,readPreview(initial,NOW).daily);assert.equal(s.launch!.tickets.length,1);assert.equal(s.launch!.preparation,null);assert.equal(palFindingProgress(s).unlocked,false);
 assert.throws(()=>beginInvitePreparation({...seed(),profile:{...owner,ageBand:'10-12'}},NOW));
});



test('activation is durable and never resets the real daily quota, draft, referral count or consent gates',()=>{
 const original=prepared(),active=simulatePalUnlock(original,NOW),p=palFindingProgress(active);
 assert.equal(p.count,0);assert.equal(p.unlocked,false);assert.equal(p.activated,true);assert.equal(p.simulated,true);assert.equal(p.canPlay,true);
 assert.deepEqual(active.daily,original.daily);assert.deepEqual(active.social,original.social);assert.deepEqual(active.launch!.friendCredits,original.launch!.friendCredits);assert.equal(simulatePalUnlock(active,NOW),active);assert.equal(resetPalUnlock(active),active);
 const reload=readPreview(JSON.parse(JSON.stringify(active)),NOW);assert.equal(palFindingProgress(reload).canPlay,true);assert.deepEqual(reload.launch!.globalPlay,active.launch!.globalPlay);
 let playing=beginLaunchPlay(reload,NOW);assert.equal(playing.daily.playsToday,0);for(const id of playing.daily.active!.ids)playing={...playing,daily:answerDaily(playing.daily,id,'Anything I type',NOW)};
 const result=finishLaunchPlay(playing,NOW);assert.equal(result.daily.playsToday,1);assert.equal(result.social.proofs.length,1);assert.equal(result.social.proofs[0].simulated,true);assert.equal(result.launch!.tickets.length,original.launch!.tickets.length+1);assert.equal(palFindingProgress(result).count,0);assert.equal(resetPalUnlock(result),result);assert.equal(palFindingProgress(readPreview(JSON.parse(JSON.stringify(result)),NOW)).canPlay,true);
});
test('old already-activated previews migrate to permanent global play without restoring stale quota snapshots',()=>{
 const original=seed(),legacy={...original,launch:{...original.launch!,unlockPreview:{originalDaily:{...original.daily,playsToday:5}}}};
 const migrated=readPreview(JSON.parse(JSON.stringify(legacy)),NOW);assert.equal(palFindingProgress(migrated).activated,true);assert.equal(migrated.launch!.globalPlay!.source,'simulation');assert.equal(migrated.launch!.unlockPreview,undefined);assert.equal(migrated.daily.playsToday,0);
 const paid=beginLaunchPlay(migrated,NOW),id=paid.daily.active!.ids[0],draft={...paid,daily:submitDaily(answerDaily(paid.daily,id,'Saved draft',NOW),id,NOW)},reactivated=simulatePalUnlock(draft,NOW);assert.equal(reactivated,draft);assert.equal(beginLaunchPlay(readPreview(JSON.parse(JSON.stringify(draft)),NOW),NOW).daily.active!.answers[id],'Saved draft');assert.equal(reactivated.daily.playsToday,1);
 const waiting={...draft,daily:{...draft.daily,active:null,usageDay:'2026-11-18',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-20T19:00:00Z'}};assert.throws(()=>beginLaunchPlay(simulatePalUnlock(waiting,NOW),NOW),/daily time/);assert.deepEqual(simulatePalUnlock(waiting,NOW).daily,waiting.daily);
});
test('the same roamie can be replayed to three photo matches and five chat matches, then random world play continues',()=>{
 let s=simulatePalUnlock(seed(),NOW),peerId='';
 for(let i=0;i<5;i++){s=beginLaunchPlay(s,NOW,peerId||undefined);for(const id of s.daily.active!.ids)s={...s,daily:answerDaily(s.daily,id,`Any answer ${i}`,NOW)};s=finishLaunchPlay(s,NOW);const pal=palSummaries(s)[0];peerId=pal.id;assert.equal(pal.matches,i+1);assert.equal(pal.photoUnlocked,i>=2);assert.equal(pal.chatUnlocked,i>=4);assert.equal(s.daily.playsToday,i+1);assert.equal(s.social.proofs.every(p=>p.simulated===true),true);}
 assert.throws(()=>beginLaunchPlay(s,NOW),/daily time/);const tomorrow=new Date(NOW.getTime()+36*3600000);assert.throws(()=>beginLaunchPlay(s,tomorrow,peerId),/five games/);const next=beginLaunchPlay(s,tomorrow);assert.ok(next.daily.active);assert.equal(next.daily.active!.peerId,undefined);assert.equal(palFindingProgress(next).canPlay,true);assert.equal(worldPlaces(s).filter(p=>p.uncovered).length,1);
});
test('activation respects private children and actual friend unlocks without adding fake friend credits',()=>{
 assert.throws(()=>simulatePalUnlock({...seed(),profile:{...owner,ageBand:'10-12'}},NOW));assert.throws(()=>simulatePalUnlock({...seed(),profile:null},NOW));const real=unlocked();assert.equal(real.launch!.globalPlay!.source,'friends');assert.equal(simulatePalUnlock(real,NOW),real);assert.equal(resetPalUnlock(real),real);
 const corrupt=readPreview({...seed(),launch:{...seed().launch,globalPlay:{activatedAt:'not-a-date',source:'simulation'},unlockPreview:true}},NOW);assert.equal(palFindingProgress(corrupt).canPlay,false);
});
