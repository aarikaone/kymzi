import {finishNewProfile} from './test-travel-setup';
import {chooseTravelAnswer} from './test-choice-helpers';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto} from 'node:crypto';
import {emptyPreview,emptyLaunch,inviteFromToken,replyFromToken,friendScore,challengeToken,palFindingProgress,LAUNCH_SETS,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-18T05:00:00Z');
const owner={name:'123456',avatar:'cloud' as const,ageBand:'16-17' as const,city:'Chennai',country:'India'};
function seed(){const state={...emptyPreview(NOW),profile:owner,launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(state));return state;}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
function route(path:string){window.history.replaceState(null,'',`/#${path}`);}
async function play(user:ReturnType<typeof userEvent.setup>){await user.click(screen.getByRole('button',{name:'Build my day'}));const answers:string[]=[];for(let i=0;i<3;i++){answers.push(await chooseTravelAnswer(user));await user.click(screen.getByRole('button',{name:i===2?'Make my day card':'Next'}));}return answers;}

beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('opens a founding explorer home and useful city guides without waiting for a roamie or requiring invitations',async()=>{
 seed();const user=userEvent.setup();render(<App/>);expect(screen.getByRole('heading',{name:/Your day.*Your kind of roamie/})).toBeTruthy();expect(screen.getByRole('button',{name:'Build my day'})).toBeTruthy();expect(screen.queryByText(/Kymzis found|match found/i)).toBeNull();
 await user.click(screen.getByRole('button',{name:'Places'}));await user.click(screen.getByRole('button',{name:'Explore Tokyo guide'}));expect(screen.getByRole('heading',{name:'Sensō-ji'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Save city guide'}));await user.click(screen.getByRole('button',{name:'Save this place'}));expect(saved().launch!.guides).toEqual(['JP']);expect(saved().launch!.places).toEqual(['jp-1']);expect(saved().social.proofs).toHaveLength(0);expect(saved().daily.playsToday).toBe(0);
});
it('completes the owner → browser friend → postcard return journey with an honest partial score and no roamie unlock',async()=>{
 seed();const user=userEvent.setup();let view=render(<App/>);const answers=await play(user);expect(screen.getByRole('heading',{name:/Start your.*first circle/})).toBeTruthy();expect(saved().social.proofs).toHaveLength(0);expect(saved().launch!.tickets).toHaveLength(1);expect(saved().daily.playsToday).toBe(0);
 await user.click(screen.getByRole('button',{name:'Invite an explorer'}));await screen.findByRole('button',{name:'Copy link'});await user.click(screen.getByRole('button',{name:'Copy link'}));const invitation=await navigator.clipboard.readText(),inviteToken=new URL(invitation).hash.slice('#/challenge/'.length),invite=inviteFromToken(inviteToken,NOW),ownerSave=localStorage.getItem(KEY)!;
 for(const answer of answers)expect(JSON.stringify(invite)).not.toContain(answer);expect(JSON.stringify(invite)).not.toContain('Chennai');
 view.unmount();localStorage.clear();route(`/challenge/${inviteToken}`);view=render(<App/>);expect(screen.queryByRole('button',{name:'Get started'})).toBeNull();
 for(let i=0;i<3;i++){if(i<2)await chooseTravelAnswer(user,answers[i]);else{const different=screen.getAllByRole('radio').find(r=>r.getAttribute('aria-label')!==answers[i])!;await user.click(different);}await user.click(screen.getByRole('button',{name:i===2?'See our day cards':'Next'}));}
 await screen.findByText('A little alike. A lot to discover.');expect(screen.getByLabelText('2 of 3 answers matched')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Send our postcard'}));const resultURL=await navigator.clipboard.readText(),replyToken=new URL(resultURL).hash.slice('#/challenge/result/'.length),reply=replyFromToken(replyToken,NOW);expect(friendScore(reply).shared).toBe(2);
 await user.click(screen.getByRole('button',{name:'Start my passport'}));await finishNewProfile(user);expect(saved().launch!.postcards).toHaveLength(1);expect(saved().social.proofs).toHaveLength(0);
 view.unmount();localStorage.clear();localStorage.setItem(KEY,ownerSave);route(`/challenge/result/${replyToken}`);render(<App/>);await user.click(screen.getByRole('button',{name:'Save to my passport'}));expect(screen.getByRole('heading',{name:/Start your.*first circle/})).toBeTruthy();expect(screen.getByRole('progressbar',{name:'Friend unlock progress'}).getAttribute('aria-valuenow')).toBe('1');expect(saved().launch!.postcards).toHaveLength(1);expect(saved().social.proofs).toHaveLength(0);expect(saved().daily.playsToday).toBe(0);
});
it('offers a first place check-in in your own city before any roamie exists',async()=>{seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Task'}));expect(screen.getByText('My gems')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Share a hidden gem'}));expect(screen.getByRole('heading',{name:'Where do locals go?'})).toBeTruthy();expect(document.querySelector('input[type=file]')).toBeNull();expect(saved().daily.playsToday).toBe(0);});

it('handles malformed public links without redirecting the guest into signup or inventing a result',()=>{
 route('/challenge/broken');render(<App/>);expect(screen.getByRole('alert')).toBeTruthy();expect(screen.getByRole('button',{name:'Start my passport'})).toBeTruthy();expect(screen.queryByText(/3\/3 answers matched/)).toBeNull();
});

it('unlocks Find my roamie only after five friends and handles the scheduled daily opening correctly',async()=>{
 const s=seed(),invite:FriendInvite={version:1,id:'0'.repeat(32),createdAt:NOW.toISOString(),person:{name:owner.name,avatar:owner.avatar},ids:[...LAUNCH_SETS[0]],hashes:Array(3).fill('0'.repeat(64))};
 s.launch.invites=[invite];s.launch.friendCredits=Array.from({length:4},(_,i):FriendReply=>({version:1,id:String(i+1).repeat(32),completedAt:NOW.toISOString(),invite,person:{name:String(600001+i),avatar:'sprout'},hashes:Array(3).fill('1'.repeat(64))}));localStorage.setItem(KEY,JSON.stringify(s));
 const fifth:FriendReply={version:1,id:'5'.repeat(32),completedAt:NOW.toISOString(),invite,person:{name:'600005',avatar:'sprout'},hashes:Array(3).fill('1'.repeat(64))};route(`/challenge/result/${challengeToken(fifth)}`);const user=userEvent.setup(),view=render(<App/>);await user.click(screen.getByRole('button',{name:'Save to my passport'}));expect(screen.getByRole('heading',{name:/Your world.*Wide open/})).toBeTruthy();expect(screen.getByRole('button',{name:'Find my roamie'}).hasAttribute('disabled')).toBe(false);await user.click(screen.getByRole('button',{name:'Find my roamie'}));await confirmUnlock(user);expect(screen.getByRole('heading',{name:'Pick your day.'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Choose Little stops'}));expect(screen.getByRole('radiogroup',{name:'Your answer'})).toBeTruthy();const unlocked=saved();view.unmount();
 const waiting={...unlocked,daily:{...s.daily,usageDay:'2026-11-17',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-18T13:30:00Z'}};localStorage.setItem(KEY,JSON.stringify(waiting));route('/home');render(<App/>);expect(screen.getByRole('button',{name:'Next play at your daily time'}).hasAttribute('disabled')).toBe(true);expect(screen.queryByRole('button',{name:'Find my roamie'})).toBeNull();
});
it('direct global-play links cannot bypass the friend gate and free invite drafts resume',async()=>{
 const s=seed();route('/play/0');const user=userEvent.setup(),view=render(<App/>);await screen.findByRole('heading',{name:/Start your.*first circle/});expect(screen.queryByRole('radiogroup',{name:'Your answer'})).toBeNull();await user.click(screen.getByRole('button',{name:'Build my day'}));const selected=await chooseTravelAnswer(user);await user.click(screen.getByRole('button',{name:'Next'}));expect(saved().daily.playsToday).toBe(0);view.unmount();route('/home');render(<App/>);await user.click(screen.getByRole('button',{name:'Build my day'}));expect(screen.getByLabelText('Question 2 of 3')).toBeTruthy();expect(saved().launch!.preparation!.answers[0]).toBe(selected);
});

async function confirmUnlock(user:ReturnType<typeof userEvent.setup>){const start=screen.queryByRole('button',{name:/^(Let’s play|Continue my answers)$/});if(start)await user.click(start);}
