import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto,createHash} from 'node:crypto';
import {answerInvitePreparation,beginDayCard,emptyLaunch,emptyPreview,finishInvitePreparation,makeFriendInvite,palFindingProgress,questionById,rememberInvite,submitInvitePreparation,placeCheckInFeed,palUpdates,type PreviewState} from '@rymzi/core';
import App from './App';

const KEY='rymzi.preview.v1',NOW=new Date('2026-11-20T05:00:00Z');
const owner={name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,city:'Bengaluru',country:'India'};
async function seed(){
 let state=beginDayCard({...emptyPreview(NOW),profile:owner,launch:emptyLaunch(NOW)},NOW);
 for(let i=0;i<3;i++){state=answerInvitePreparation(state,i,questionById(state.launch!.preparation!.ids[i])!.choices![0].label);state=submitInvitePreparation(state,i);}
 state=finishInvitePreparation(state,NOW);
 const invite=await makeFriendInvite(state,{nonce:()=> 'a'.repeat(32),digest:async v=>createHash('sha256').update(v).digest('hex')},NOW);
 state=rememberInvite(state,invite,NOW);localStorage.setItem(KEY,JSON.stringify(state));window.history.replaceState(null,'',`/#/launch/invite/${invite.id}`);return {state,invite};
}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
async function finish(user:ReturnType<typeof userEvent.setup>){for(let i=0;i<3;i++){await user.click(screen.getAllByRole('radio')[i===2?1:0]);await user.click(screen.getByRole('button',{name:i===2?'Reveal our match':'Next'}));}}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});

it('previews a receiver, credits one completed card, returns to the owner profile and survives reload without duplicate friends',async()=>{
 const {state,invite}=await seed(),user=userEvent.setup();let view=render(<App/>);
 expect(screen.getByRole('button',{name:'Send my postcard'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));
 expect(screen.getByText('Your travel day')).toBeTruthy();expect(screen.getByText('With #123456')).toBeTruthy();expect(screen.getAllByRole('radio')).toHaveLength(6);expect(screen.getByRole('button',{name:'Next'}).hasAttribute('disabled')).toBe(true);
 expect(palFindingProgress(saved()).count).toBe(0);await finish(user);await screen.findByRole('heading',{name:/You’re.*connected/});
 expect(screen.getByText('2/3 shared picks')).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);expect(palFindingProgress(saved()).canPlay).toBe(false);
 const reply=saved().launch!.postcards[0];expect(reply.person.name).not.toBe(owner.name);expect(reply.person.avatar).not.toBe(owner.avatar);
 expect(saved().profile).toEqual(owner);expect(saved().launch!.tickets).toEqual(state.launch!.tickets);expect(saved().daily).toEqual(state.daily);expect(saved().social.proofs).toHaveLength(0);
 await user.click(screen.getByRole('button',{name:'Back to my profile'}));expect(screen.getByRole('heading',{name:'#123456'})).toBeTruthy();
 const circle=screen.getByRole('region',{name:'Your circle'});expect(within(circle).getByText('1 added · 4 left')).toBeTruthy();expect(screen.getByRole('button',{name:'My postcards'})).toBeTruthy();
 view.unmount();view=render(<App/>);expect(within(screen.getByRole('region',{name:'Your circle'})).getByText('1 added · 4 left')).toBeTruthy();
 view.unmount();window.history.replaceState(null,'',`/#/launch/receiver/${invite.id}`);render(<App/>);expect(screen.getByRole('heading',{name:/You’re.*connected/})).toBeTruthy();expect(screen.queryByRole('radiogroup')).toBeNull();
 await user.click(screen.getByRole('button',{name:'Back to my profile'}));expect(palFindingProgress(saved()).count).toBe(1);expect(saved().launch!.postcards).toHaveLength(1);
});
it('leaving an unfinished receiver never credits a friend or changes the owner’s play allowance',async()=>{
 const {state}=await seed(),user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));await user.click(screen.getAllByRole('radio')[0]);await user.click(screen.getByRole('button',{name:'Next'}));
 await user.click(screen.getByRole('button',{name:'Close receiver preview'}));expect(screen.getByRole('button',{name:'Receiver'})).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(0);expect(saved().daily).toEqual(state.daily);expect(saved().profile).toEqual(owner);
 await user.click(screen.getByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));expect(screen.getByLabelText('Question 1 of 3')).toBeTruthy();expect(screen.getByRole('button',{name:'Next'}).hasAttribute('disabled')).toBe(true);
});
it('does not show success if saving fails and retries the same completion once storage recovers',async()=>{
 await seed();const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));
 for(let i=0;i<2;i++){await user.click(screen.getAllByRole('radio')[0]);await user.click(screen.getByRole('button',{name:'Next'}));}await user.click(screen.getAllByRole('radio')[0]);
 const store=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Full');});
 await user.click(screen.getByRole('button',{name:'Reveal our match'}));await screen.findByRole('alert');expect(screen.queryByRole('heading',{name:/You’re.*connected/})).toBeNull();expect(palFindingProgress(saved()).count).toBe(0);
 store.mockRestore();await user.dblClick(screen.getByRole('button',{name:'Reveal our match'}));await waitFor(()=>expect(palFindingProgress(saved()).count).toBe(1));expect(saved().launch!.postcards).toHaveLength(1);expect(screen.getByText('3/3 shared picks')).toBeTruthy();
});

it('opens friend updates after the first connection while the global gate stays off',async()=>{
 await seed();const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));await finish(user);await user.click(await screen.findByRole('button',{name:'Back to my profile'}));
 expect(screen.getByText('1 added · 4 left')).toBeTruthy();expect(screen.getByText('Global OFF')).toBeTruthy();await user.click(screen.getByRole('button',{name:'See your feed'}));
 expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();expect(document.querySelectorAll('.feed-gem')).toHaveLength(1);expect(screen.getByRole('region',{name:'Roamie wishes'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Find my roamie'})).toBeNull();
 const place=placeCheckInFeed(saved(),undefined,NOW)[0];expect(place.circleFriendId).toBeTruthy();expect(screen.getAllByRole('article').some(a=>a.textContent?.includes(place.alias))).toBe(true);
 await user.click(screen.getByRole('button',{name:'Notifications'}));const update=palUpdates(saved(),NOW).find(n=>n.id.startsWith('circle-update:'))!;await user.click(screen.getByText(update.title));
 expect(screen.getByRole('heading',{name:place.name})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Save this place'}));expect(saved().placeJournal!.savedIds).toHaveLength(1);expect(palFindingProgress(saved()).canPlay).toBe(false);expect(saved().social.proofs).toHaveLength(0);
 await user.click(screen.getByRole('button',{name:'Go back'}));await user.click(screen.getByRole('button',{name:'Go back'}));await user.click(screen.getByRole('button',{name:'Roamies'}));expect(screen.getByText('friends to go')).toBeTruthy();expect(screen.queryByText('Your next hello is out there.')).toBeNull();expect(screen.getByRole('heading',{name:'Global Roamies'})).toBeTruthy();expect(screen.getByRole('progressbar',{name:'Global unlock progress'}).getAttribute('aria-valuenow')).toBe('1');await user.click(screen.getByRole('button',{name:'Invite a friend'}));expect(await screen.findByRole('button',{name:'Receiver'})).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);
});
it('can repeat all five receiver journeys and opens full global play only at five distinct completions',async()=>{
 await seed();const user=userEvent.setup();let view=render(<App/>);const names=new Set<string>();
 for(let count=1;count<=5;count++){
  await user.click(await screen.findByRole('button',{name:'Receiver'}));await user.click(screen.getByRole('button',{name:'Answer to open'}));await finish(user);
  await user.click(await screen.findByRole('button',{name:count===5?'Open my world':'Back to my profile'}));
  const state=saved();expect(palFindingProgress(state).count).toBe(count);const guest=state.launch!.postcards.at(-1)!.person.name;expect(names.has(guest)).toBe(false);names.add(guest);expect(state.profile).toEqual(owner);expect(state.daily.playsToday).toBe(0);
  if(count<5){expect(screen.getByText(`${count} added · ${5-count} left`)).toBeTruthy();expect(screen.getByText('Global OFF')).toBeTruthy();expect(state.launch!.globalPlay).toBeUndefined();expect(state.social.proofs).toHaveLength(0);await user.click(screen.getByRole('button',{name:'Invite next friend'}));}
 }
 expect(saved().launch!.globalPlay!.source).toBe('friends');expect(saved().social.proofs).toHaveLength(3);expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();
 view.unmount();view=render(<App/>);expect(palFindingProgress(saved()).canPlay).toBe(true);await user.click(screen.getByRole('button',{name:'Profile'}));expect(screen.getByText('Global ON')).toBeTruthy();expect(screen.getByText('5 friends')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Explore the world'}));
 await user.click(screen.getByRole('button',{name:'Find my roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();await user.click(screen.getAllByRole('button',{name:/^Open bottle in /})[0]);expect(screen.getAllByRole('radio')).toHaveLength(6);
},15000);
it('hides the appbar demo while invitations and the direct preview URL respect the five-friend gate',async()=>{
 await seed();window.history.replaceState(null,'','/#/home');const user=userEvent.setup();let view=render(<App/>);await user.click(screen.getByRole('button',{name:'Roamies'}));expect(screen.getByRole('heading',{name:'Global Roamies'})).toBeTruthy();expect(screen.getByRole('progressbar',{name:'Global unlock progress'}).getAttribute('aria-valuenow')).toBe('0');expect(screen.getByRole('button',{name:'Invite a friend'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Home'}));expect(screen.queryByRole('button',{name:'Demo'})).toBeNull();await user.click(screen.getByRole('button',{name:'Roamies'}));await user.click(screen.getByRole('button',{name:'Invite a friend'}));expect(await screen.findByRole('button',{name:'Receiver'})).toBeTruthy();expect(palFindingProgress(saved()).canPlay).toBe(false);
 view.unmount();window.history.replaceState(null,'','/#/launch/unlock?demo=1');view=render(<App/>);expect(screen.queryByRole('button',{name:'Skip animation'})).toBeNull();expect(screen.queryByRole('button',{name:'Preview five friends'})).toBeNull();expect(palFindingProgress(saved()).canPlay).toBe(false);
});

it('explains the travel invitation, rejects a low match, and connects once a retry reaches two shared picks',async()=>{
 await seed();const user=userEvent.setup();const view=render(<App/>);await user.click(screen.getByRole('button',{name:'Receiver'}));
 expect(screen.getByRole('heading',{name:'Same travel vibe?'})).toBeTruthy();expect(screen.getByText('Same 3 questions. Match 2 to open.')).toBeTruthy();expect(screen.queryByRole('radiogroup')).toBeNull();
 await user.click(screen.getByRole('button',{name:'Answer to open'}));
 for(let i=0;i<3;i++){await user.click(screen.getAllByRole('radio')[1]);await user.click(screen.getByRole('button',{name:i===2?'Reveal our match':'Next'}));}
 await screen.findByRole('heading',{name:'Different travel vibes.'});expect(screen.queryByRole('heading',{name:'You’re connected.'})).toBeNull();expect(screen.getByLabelText('0 percent travel match')).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(0);expect(saved().launch!.friendCredits).toHaveLength(0);
 await user.click(screen.getByRole('button',{name:'Try another day'}));await finish(user);await screen.findByRole('heading',{name:'You’re connected.'});expect(screen.getByLabelText('67 percent travel match')).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);expect(saved().launch!.postcards).toHaveLength(2);
 await user.click(screen.getByRole('button',{name:'Back to my profile'}));expect(screen.getByText('1 added · 4 left')).toBeTruthy();
 const invite=saved().launch!.invites[0];view.unmount();window.history.replaceState(null,'',`/#/launch/receiver/${invite.id}`);render(<App/>);expect(screen.getByRole('heading',{name:'You’re connected.'})).toBeTruthy();expect(screen.getByLabelText('67 percent travel match')).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);
});

it('keeps the sender’s postcard sealed at one match and opens their actual travel day at two',async()=>{
 const {invite}=await seed(),user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Receiver'}));
 const sealed=screen.getByRole('article',{name:'Sealed postcard from #123456'});expect(within(sealed).queryByRole('img',{name:/Illustration of/})).toBeNull();expect(screen.queryByRole('region',{name:'Opened postcard from #123456'})).toBeNull();
 await user.click(screen.getByRole('button',{name:'Answer to open'}));
 for(let i=0;i<3;i++){expect(screen.getByRole('heading',{name:questionById(invite.ids[i])!.prompt})).toBeTruthy();await user.click(screen.getAllByRole('radio')[i===0?0:1]);await user.click(screen.getByRole('button',{name:i===2?'Reveal our match':'Next'}));}
 await screen.findByRole('heading',{name:'Different travel vibes.'});expect(screen.getByText('1/3 shared picks')).toBeTruthy();expect(screen.getByRole('article',{name:'Sealed postcard from #123456'})).toBeTruthy();expect(screen.queryByRole('region',{name:'Opened postcard from #123456'})).toBeNull();expect(palFindingProgress(saved()).count).toBe(0);
 await user.click(screen.getByRole('button',{name:'Try another day'}));await finish(user);const opened=await screen.findByRole('region',{name:'Opened postcard from #123456'});
 for(const id of invite.ids)expect(within(opened).getByText(questionById(id)!.choices![0].label)).toBeTruthy();expect(screen.queryByRole('article',{name:'Sealed postcard from #123456'})).toBeNull();expect(screen.getByRole('heading',{name:'You’re connected.'})).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);
});
