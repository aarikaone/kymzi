import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto,createHash} from 'node:crypto';
import {profileDisplayName,answerFriendInvite,answerInvitePreparation,beginDayCard,collectPostcard,emptyLaunch,emptyPreview,finishInvitePreparation,makeFriendInvite,palFindingProgress,questionById,receiverPreviewProfile,rememberInvite,submitInvitePreparation,type PreviewState} from '@rymzi/core';
import App from './App';
import {FriendUnlockSheet} from './FriendUnlockSheet';
import {simulatePalUnlock} from '@rymzi/core';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-22T06:00:00Z');
const crypto={nonce:(()=>{let n=0;return()=> (++n).toString(16).padStart(32,'0');})(),digest:async(v:string)=>createHash('sha256').update(v).digest('hex')};
async function seed(count:number){
 let state=beginDayCard({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(NOW)},NOW);
 for(let i=0;i<3;i++){state=answerInvitePreparation(state,i,questionById(state.launch!.preparation!.ids[i])!.choices![0].label);state=submitInvitePreparation(state,i);}
 state=finishInvitePreparation(state,NOW);const invite=await makeFriendInvite(state,crypto,NOW);state=rememberInvite(state,invite,NOW);
 for(let i=0;i<count;i++){const guest={...receiverPreviewProfile(state,invite),name:String(100001+i)},reply=await answerFriendInvite(invite,guest,state.launch!.tickets[0].answers,crypto,NOW);state=collectPostcard(state,reply,NOW);}
 localStorage.setItem(KEY,JSON.stringify(state));window.history.replaceState(null,'','/#/home');return state;
}
const saved=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('shows Unlock then the first connected avatar above the feed, without the circle card',async()=>{
 const before=await seed(1),u=userEvent.setup();render(<App/>);const rail=screen.getByRole('region',{name:'Connected friends and Roamies'}),friend=palFindingProgress(before).friends[0];expect(within(rail).getAllByRole('button').map(b=>b.getAttribute('aria-label'))).toEqual(['Find Roamies worldwide','View friend '+(friend.person.username??friend.person.name)]);expect(within(rail).getByText('1/5 friends')).toBeTruthy();expect(within(rail).getByRole('button',{name:'View friend '+(friend.person.username??friend.person.name)}).querySelector('img')?.src).toContain('/avatars/');expect(screen.queryByRole('heading',{name:/Your circle/i})).toBeNull();expect(screen.getByRole('heading',{name:'From friends & Roamies'})).toBeTruthy();expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
 await u.click(within(rail).getByRole('button',{name:'Find Roamies worldwide'}));await u.click((await screen.findAllByRole('button',{name:/^Open bottle in /}))[0]);const sheet=screen.getByRole('dialog',{name:'Find Roamies worldwide'});expect(within(sheet).getByRole('heading',{name:'Find Roamies.'})).toBeTruthy();expect(within(sheet).getByText('Invite 4 more friends.')).toBeTruthy();expect(within(sheet).getByText('A friend counts as soon as they join from your invitation. No game needed.')).toBeTruthy();expect(within(sheet).getByText('1 of 5 friends joined')).toBeTruthy();expect(within(sheet).getByText('Then find Roamies in cities around the world.')).toBeTruthy();expect(within(sheet).getByRole('progressbar',{name:'Friend invite progress'}).getAttribute('aria-valuenow')).toBe('1');expect(within(sheet).getByRole('button',{name:'Share my postcard'})).toBeTruthy();expect(within(sheet).queryByRole('button',{name:'Let’s play'})).toBeNull();await u.click(within(sheet).getByRole('button',{name:'Close unlock'}));expect(screen.queryByRole('dialog')).toBeNull();expect(saved().daily).toEqual(before.daily);expect(palFindingProgress(saved()).canPlay).toBe(false);
});
it('sends Share my postcard to the actual postcard flow without granting friend credit or spending a play',async()=>{
 const before=await seed(1),u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Find Roamies worldwide'}));await u.click((await screen.findAllByRole('button',{name:/^Open bottle in /}))[0]);await u.click(screen.getByRole('button',{name:'Share my postcard'}));expect(await screen.findByRole('button',{name:'Share invitation'})).toBeTruthy();expect(screen.getByRole('button',{name:'Receiver'})).toBeTruthy();expect(screen.queryByRole('dialog')).toBeNull();expect(palFindingProgress(saved()).count).toBe(1);expect(palFindingProgress(saved()).canPlay).toBe(false);expect(saved().daily).toEqual(before.daily);
});
it('shows one friend left at four and restores the normal global flow only once five connect',async()=>{
 const four=await seed(4),u=userEvent.setup();let view=render(<App/>);expect(within(screen.getByRole('region',{name:'Connected friends and Roamies'})).getAllByRole('button')).toHaveLength(5);await u.click(screen.getByRole('button',{name:'Find Roamies worldwide'}));await u.click((await screen.findAllByRole('button',{name:/^Open bottle in /}))[0]);expect(screen.getByText('Invite 1 more friend.')).toBeTruthy();expect(palFindingProgress(four).canPlay).toBe(false);view.unmount();
 await seed(5);view=render(<App/>);expect(screen.queryByRole('button',{name:'Find Roamies worldwide'})).toBeNull();expect(screen.getByRole('button',{name:'Find a Roamie'})).toBeTruthy();expect(palFindingProgress(saved()).canPlay).toBe(true);expect(saved().launch!.globalPlay!.source).toBe('friends');expect(saved().daily.playsToday).toBe(0);
});
it('keeps the connected avatar row after reload and lets an avatar open that friend’s collections',async()=>{
 const state=await seed(1),u=userEvent.setup(),friend=palFindingProgress(state).friends[0];let view=render(<App/>);view.unmount();view=render(<App/>);await u.click(screen.getByRole('button',{name:'View friend '+(friend.person.username??friend.person.name)}));expect(window.location.hash).toBe('#/roamie/'+encodeURIComponent('circle:'+friend.person.name));expect(screen.getByRole('tablist',{name:'Roamie collections'})).toBeTruthy();expect(screen.getByRole('heading',{name:profileDisplayName(friend.person)})).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);
});

it('Add all enables global bottles without spending a play and restores after reload',async()=>{
 const before=await seed(1),u=userEvent.setup();let view=render(<App/>);await u.click(screen.getByRole('button',{name:'Find Roamies worldwide'}));await u.click((await screen.findAllByRole('button',{name:/^Open bottle in /}))[0]);await u.click(screen.getByRole('button',{name:'Add all'}));expect(screen.queryByRole('dialog')).toBeNull();expect(palFindingProgress(saved()).canPlay).toBe(true);expect(saved().launch!.globalPlay!.source).toBe('simulation');expect(saved().daily).toEqual(before.daily);const ids=saved().postcardDiscovery!.drop!.cardIds;view.unmount();view=render(<App/>);expect(screen.getByRole('region',{name:'Today’s bottles'})).toBeTruthy();expect(saved().postcardDiscovery!.drop!.cardIds).toEqual(ids);await u.click(screen.getAllByRole('button',{name:/^Open bottle in /})[0]);expect(screen.getAllByRole('radio')).toHaveLength(6);expect(saved().daily.playsToday).toBe(0);
});
it('keeps the unlock sheet open on a storage error and allows Add all to retry',async()=>{
 await seed(4);const u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'Find Roamies worldwide'}));await u.click((await screen.findAllByRole('button',{name:/^Open bottle in /}))[0]);
 const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(()=>{throw new Error('Storage full');});
 await u.click(screen.getByRole('button',{name:'Add all'}));
 expect(screen.getByRole('alert').textContent).toContain('Couldn’t save.');
 expect(palFindingProgress(saved()).canPlay).toBe(false);
 expect(screen.getByRole('dialog',{name:'Find Roamies worldwide'})).toBeTruthy();
 fail.mockRestore();
 await u.click(screen.getByRole('button',{name:'Add all'}));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(palFindingProgress(saved()).canPlay).toBe(true);
});

it('does not ask for more friends when worldwide matching has already been activated',async()=>{
 const state=simulatePalUnlock(await seed(1),NOW);render(<FriendUnlockSheet visible state={state} onClose={()=>{}} onShare={()=>{}} onAddAll={()=>{}}/>);const sheet=screen.getByRole('dialog',{name:'Find Roamies worldwide'});expect(within(sheet).getByText('Worldwide matching is unlocked.')).toBeTruthy();expect(within(sheet).queryByText(/Invite .* more friend/)).toBeNull();expect(within(sheet).queryByRole('progressbar')).toBeNull();expect(within(sheet).queryByRole('button',{name:'Add all'})).toBeNull();
});
