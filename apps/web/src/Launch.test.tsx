import {StrictMode} from 'react';
import {LaunchInvite} from './LaunchExperience';
import {finishNewProfile} from './test-travel-setup';
import {chooseTravelAnswer} from './test-choice-helpers';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto} from 'node:crypto';
import {beginDayCard,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation,questionById,makeFriendInvite,rememberInvite,emptyPreview,emptyLaunch,inviteFromToken,replyFromToken,friendScore,challengeToken,palFindingProgress,LAUNCH_SETS,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-18T05:00:00Z');
const owner={name:'123456',avatar:'cloud' as const,ageBand:'16-17' as const,city:'Chennai',country:'India'};
function seed(){const state={...emptyPreview(NOW),profile:owner,launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(state));return state;}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
function route(path:string){window.history.replaceState(null,'',`/#${path}`);}
async function play(user:ReturnType<typeof userEvent.setup>){await user.click(screen.getByRole('button',{name:'Invite friends'}));const answers:string[]=[];for(let i=0;i<3;i++){answers.push(await chooseTravelAnswer(user));await user.click(screen.getByRole('button',{name:i===2?'Make my postcard':'Next'}));}return answers;}

beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('opens a founding explorer home and useful city guides without waiting for a Roamie or requiring invitations',async()=>{
 seed();const user=userEvent.setup();render(<App/>);expect(screen.getByRole('heading',{name:/Meet Roamies.*worldwide/})).toBeTruthy();expect(screen.getByRole('button',{name:'Invite friends'})).toBeTruthy();expect(screen.queryByText(/Kymzis found|match found/i)).toBeNull();
 await user.click(screen.getByRole('button',{name:'Places'}));expect(screen.getByRole('heading',{name:'Your next city awaits.'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Browse World'}));await user.type(screen.getByRole('textbox',{name:'Search world cities'}),'Tokyo');await user.click(screen.getByRole('button',{name:'Explore Tokyo, Japan guide'}));await user.click(await screen.findByRole('button',{name:'Explore Sensō-ji'}));expect(screen.queryByRole('button',{name:'Select Sensō-ji'})).toBeNull();await user.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();expect(saved().launch!.guides).toEqual([]);expect(saved().launch!.places).toEqual([]);expect(saved().social.proofs).toHaveLength(0);expect(saved().daily.playsToday).toBe(0);
});
it('completes the owner → browser friend → postcard return journey with an honest partial score and no Roamie unlock',async()=>{
 let initial=beginDayCard(seed(),NOW);for(let i=0;i<3;i++){initial=answerInvitePreparation(initial,i,questionById(initial.launch!.preparation!.ids[i])!.choices![0].label);initial=submitInvitePreparation(initial,i);}initial=finishInvitePreparation(initial,NOW);const answers=initial.launch!.tickets[0].answers,legacyInvite=await makeFriendInvite(initial,{nonce:()=> 'a'.repeat(32),digest:async value=>{const bytes=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}},NOW);initial=rememberInvite(initial,legacyInvite,NOW);localStorage.setItem(KEY,JSON.stringify(initial));route('/launch/invite/'+legacyInvite.id);const user=userEvent.setup();let view=render(<App/>);expect(saved().daily.playsToday).toBe(0);
 await screen.findByRole('button',{name:'Copy link'});await user.click(screen.getByRole('button',{name:'Copy link'}));const invitation=await navigator.clipboard.readText(),inviteToken=new URL(invitation).hash.slice('#/challenge/'.length),invite=inviteFromToken(inviteToken,NOW),ownerSave=localStorage.getItem(KEY)!;
 for(const answer of answers)expect(JSON.stringify(invite)).not.toContain(answer);expect(JSON.stringify(invite)).not.toContain('Chennai');
 view.unmount();localStorage.clear();route(`/challenge/${inviteToken}`);view=render(<App/>);expect(screen.queryByRole('button',{name:'Get started'})).toBeNull();await user.click(screen.getByRole('button',{name:'Answer to open'}));
 for(let i=0;i<3;i++){if(i<2)await chooseTravelAnswer(user,answers[i]);else{const different=screen.getAllByRole('radio').find(r=>r.getAttribute('aria-label')!==answers[i])!;await user.click(different);}await user.click(screen.getByRole('button',{name:i===2?'Reveal our match':'Next'}));}
 await screen.findByRole('heading',{name:'Postcard opened.'});expect(screen.getByLabelText('2 of 3 answers matched')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Send our postcard'}));const resultURL=await navigator.clipboard.readText(),replyToken=new URL(resultURL).hash.slice('#/challenge/result/'.length),reply=replyFromToken(replyToken,NOW);expect(friendScore(reply).shared).toBe(2);
 await user.click(screen.getByRole('button',{name:'Create my profile'}));await finishNewProfile(user);expect(saved().launch!.postcards).toHaveLength(1);expect(saved().social.proofs).toHaveLength(0);
 view.unmount();localStorage.clear();localStorage.setItem(KEY,ownerSave);route(`/challenge/result/${replyToken}`);render(<App/>);await user.click(screen.getByRole('button',{name:'Save connection'}));expect(screen.getByRole('heading',{name:/Invite your.*friends/})).toBeTruthy();expect(screen.getByRole('progressbar',{name:'Friend invite progress'}).getAttribute('aria-valuenow')).toBe('1');expect(saved().launch!.postcards).toHaveLength(1);expect(saved().social.proofs).toHaveLength(0);expect(saved().daily.playsToday).toBe(0);
});
it('offers a first place check-in in your own city before any Roamie exists',async()=>{seed();window.history.replaceState(null,'','/#/camera');const u=userEvent.setup();render(<App/>);expect(screen.getByRole('heading',{name:'Where do locals go?'})).toBeTruthy();expect(document.querySelector('input[type=file]')).toBeNull();expect(saved().daily.playsToday).toBe(0);});

it('handles malformed public links without redirecting the guest into signup or inventing a result',()=>{
 route('/challenge/broken');render(<App/>);expect(screen.getByRole('alert')).toBeTruthy();expect(screen.getByRole('button',{name:'Create my profile'})).toBeTruthy();expect(screen.queryByText(/3\/3 answers matched/)).toBeNull();
});

it('unlocks Find my Roamie only after five friends and opens the daily bottle drop independently of older game timers',async()=>{
 const s=seed(),invite:FriendInvite={version:1,id:'0'.repeat(32),createdAt:NOW.toISOString(),person:{name:owner.name,avatar:owner.avatar},ids:[...LAUNCH_SETS[0]],hashes:Array(3).fill('0'.repeat(64))};
 s.launch.invites=[invite];s.launch.friendCredits=Array.from({length:4},(_,i):FriendReply=>({version:1,id:String(i+1).repeat(32),completedAt:NOW.toISOString(),invite,person:{name:String(600001+i),avatar:'sprout'},hashes:Array(3).fill('0'.repeat(64))}));localStorage.setItem(KEY,JSON.stringify(s));
 const fifth:FriendReply={version:1,id:'5'.repeat(32),completedAt:NOW.toISOString(),invite,person:{name:'600005',avatar:'sprout'},hashes:Array(3).fill('0'.repeat(64))};route(`/challenge/result/${challengeToken(fifth)}`);const user=userEvent.setup(),view=render(<App/>);await user.click(screen.getByRole('button',{name:'Save connection'}));expect(screen.getByRole('heading',{name:/Meet Roamies.*worldwide/})).toBeTruthy();expect(screen.getByRole('button',{name:'Find a Roamie'}).hasAttribute('disabled')).toBe(false);await user.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();await user.click(screen.getAllByRole('button',{name:/^Open bottle in /})[0]);expect(screen.getByRole('radiogroup',{name:'Your postcard answer'})).toBeTruthy();const unlocked=saved();view.unmount();
 const waiting={...unlocked,daily:{...s.daily,usageDay:'2026-11-17',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-18T13:30:00Z'}};localStorage.setItem(KEY,JSON.stringify(waiting));route('/home');render(<App/>);expect(screen.getByRole('button',{name:'Find a Roamie'}).hasAttribute('disabled')).toBe(false);await user.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();expect(saved().daily.playsToday).toBe(5);
});
it('direct global-play links lead to invitations without requiring a game and preserve the generated invite after reload',async()=>{
 seed();route('/play/0');const user=userEvent.setup(),view=render(<App/>);await screen.findByRole('heading',{name:/Invite your.*friends/});expect(screen.queryByRole('radiogroup',{name:'Your answer'})).toBeNull();await user.click(screen.getByRole('button',{name:'Invite a friend'}));expect(screen.getByRole('button',{name:'Share invitation'})).toBeTruthy();expect(saved().launch!.preparation).toBeNull();expect(saved().launch!.tickets).toHaveLength(0);expect(saved().daily.playsToday).toBe(0);const id=saved().launch!.invites[0].id;view.unmount();route('/launch/invite/'+id);render(<App/>);expect(screen.getByRole('button',{name:'Share invitation'})).toBeTruthy();expect(saved().launch!.invites[0].kind).toBe('friend');
});

async function confirmUnlock(user:ReturnType<typeof userEvent.setup>){const start=screen.queryByRole('button',{name:/^(Let’s play|Continue my answers)$/});if(start)await user.click(start);}

it('keeps postcard sharing usable after React StrictMode mounts and cleans up effects',async()=>{
 const user=userEvent.setup(),invite:FriendInvite={version:1,id:'a'.repeat(32),createdAt:NOW.toISOString(),person:{name:owner.name,avatar:owner.avatar},ids:[...LAUNCH_SETS[0]],hashes:Array(3).fill('0'.repeat(64))};
 render(<StrictMode><LaunchInvite invite={invite} onBack={()=>{}}/></StrictMode>);
 await user.click(screen.getByRole('button',{name:'Copy link'}));expect((await screen.findByRole('status')).textContent).toContain('Link copied. Send your postcard.');expect(screen.getByRole('button',{name:'Send my postcard'}).hasAttribute('disabled')).toBe(false);
 await user.click(screen.getByRole('button',{name:'Copy link'}));expect(new URL(await navigator.clipboard.readText()).hash).toContain('/challenge/');
});
