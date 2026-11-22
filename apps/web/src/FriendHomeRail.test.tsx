import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto,createHash} from 'node:crypto';
import {answerFriendInvite,answerInvitePreparation,beginDayCard,collectPostcard,emptyLaunch,emptyPreview,finishInvitePreparation,makeFriendInvite,palFindingProgress,questionById,receiverPreviewProfile,rememberInvite,submitInvitePreparation,type PreviewState} from '@rymzi/core';
import App from './App';
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
 const before=await seed(1),u=userEvent.setup();render(<App/>);const rail=screen.getByRole('region',{name:'Connected roamies'}),friend=palFindingProgress(before).friends[0];expect(within(rail).getAllByRole('button').map(b=>b.getAttribute('aria-label'))).toEqual(['Unlock global play','View friend '+friend.person.name]);expect(within(rail).getByText('1/5 friends')).toBeTruthy();expect(within(rail).getByRole('button',{name:'View friend '+friend.person.name}).querySelector('img')?.src).toContain('/avatars/');expect(screen.queryByRole('heading',{name:/Your circle/i})).toBeNull();expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
 await u.click(within(rail).getByRole('button',{name:'Unlock global play'}));const sheet=screen.getByRole('dialog',{name:'Unlock global play'});expect(within(sheet).getByRole('heading',{name:'Go global.'})).toBeTruthy();expect(within(sheet).getByText('4 friends to go')).toBeTruthy();expect(within(sheet).getByRole('progressbar',{name:'Global unlock progress'}).getAttribute('aria-valuenow')).toBe('1');expect(within(sheet).getByRole('button',{name:'Share with friends'})).toBeTruthy();expect(within(sheet).queryByRole('button',{name:'Let’s play'})).toBeNull();await u.click(within(sheet).getByRole('button',{name:'Close unlock'}));expect(screen.queryByRole('dialog')).toBeNull();expect(saved().daily).toEqual(before.daily);expect(palFindingProgress(saved()).canPlay).toBe(false);
});
it('sends Share with friends to the actual postcard flow without granting friend credit or spending a play',async()=>{
 const before=await seed(1),u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Unlock global play'}));await u.click(screen.getByRole('button',{name:'Share with friends'}));expect(await screen.findByRole('button',{name:'Send my postcard'})).toBeTruthy();expect(screen.getByRole('button',{name:'Receiver'})).toBeTruthy();expect(screen.queryByRole('dialog')).toBeNull();expect(palFindingProgress(saved()).count).toBe(1);expect(palFindingProgress(saved()).canPlay).toBe(false);expect(saved().daily).toEqual(before.daily);
});
it('shows one friend left at four and restores the normal global flow only once five connect',async()=>{
 const four=await seed(4),u=userEvent.setup();let view=render(<App/>);expect(within(screen.getByRole('region',{name:'Connected roamies'})).getAllByRole('button')).toHaveLength(5);await u.click(screen.getByRole('button',{name:'Unlock global play'}));expect(screen.getByText('1 friend to go')).toBeTruthy();expect(palFindingProgress(four).canPlay).toBe(false);view.unmount();
 await seed(5);view=render(<App/>);expect(screen.queryByRole('button',{name:'Unlock global play'})).toBeNull();expect(screen.getByRole('button',{name:'Find my roamie'})).toBeTruthy();expect(palFindingProgress(saved()).canPlay).toBe(true);expect(saved().launch!.globalPlay!.source).toBe('friends');expect(saved().daily.playsToday).toBe(0);
});
it('keeps the connected avatar row after reload and lets an avatar open the friend postcards',async()=>{
 const state=await seed(1),u=userEvent.setup(),friend=palFindingProgress(state).friends[0];let view=render(<App/>);view.unmount();view=render(<App/>);await u.click(screen.getByRole('button',{name:'View friend '+friend.person.name}));expect(window.location.hash).toBe('#/launch/postcards');expect(screen.getByRole('button',{name:'Open 3 of 3 postcard'}).textContent).toContain('#'+friend.person.name);expect(palFindingProgress(saved()).count).toBe(1);
});
