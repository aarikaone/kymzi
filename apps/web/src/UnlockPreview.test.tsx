import {chooseTravelAnswer} from './test-choice-helpers';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {act,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,palFindingProgress,type PreviewState} from '@rymzi/core';
import {LaunchUnlock} from './LaunchUnlock';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-19T05:00:00Z');
function seed():PreviewState{return {...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'16-17',city:'Chennai',country:'India'},launch:emptyLaunch(NOW)};}
function props(){return {state:seed(),now:NOW,onPrepare:vi.fn(),onInvite:vi.fn(),onPlay:vi.fn(),onExplore:vi.fn(),onCollect:vi.fn(),onSimulate:vi.fn(),onResetPreview:vi.fn()};}
async function tick(ms:number){await act(async()=>{await vi.advanceTimersByTimeAsync(ms);});}
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(NOW);Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:vi.fn(()=>({matches:false}))});});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('adds five visible characters in sequence and activates only after the fifth arrival',async()=>{
 const p=props();render(<LaunchUnlock {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Preview five friends'}));
 expect(screen.getByRole('button',{name:'Adding friends…'}).hasAttribute('disabled')).toBe(true);expect(p.onSimulate).not.toHaveBeenCalled();
 await tick(400);expect(screen.getByRole('status').textContent).toContain('1 down. 4 to go.');
 for(let n=2;n<=5;n++){await tick(620);if(n<5)expect(screen.getByRole('status').textContent).toContain(`${n} down. ${5-n} to go.`);}
 expect(p.onSimulate).not.toHaveBeenCalled();await tick(770);expect(p.onSimulate).toHaveBeenCalledTimes(1);expect(screen.getByText('Global play is on.')).toBeTruthy();expect(screen.getByText('Simulated friends · No invites sent')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Find my roamie'}));expect(p.onPlay).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Replay animation'}));fireEvent.click(screen.getByRole('button',{name:'Skip animation'}));await tick(5000);expect(p.onSimulate).toHaveBeenCalledTimes(2);
});
it('cancels cleanly and does not unlock after navigating away',async()=>{
 const p=props(),view=render(<LaunchUnlock {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Preview five friends'}));await tick(400);fireEvent.click(screen.getByRole('button',{name:'Cancel'}));await tick(5000);expect(p.onSimulate).not.toHaveBeenCalled();expect(p.onResetPreview).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Preview five friends'}));view.unmount();await tick(5000);expect(p.onSimulate).not.toHaveBeenCalled();
});
it('respects reduced motion and reports activation failures',async()=>{
 vi.mocked(window.matchMedia).mockReturnValue({matches:true} as MediaQueryList);const p=props();p.onSimulate.mockRejectedValueOnce(new Error('Could not save the preview.'));render(<LaunchUnlock {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Preview five friends'}));await tick(0);expect(screen.getByRole('alert').textContent).toBe('Could not save the preview.');expect(p.onSimulate).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Preview five friends'}));await tick(0);expect(screen.getByRole('button',{name:'Find my roamie'}).hasAttribute('disabled')).toBe(false);
});

it('preserves an existing global activation, finds a roamie, opens their city and resumes the same-roamie game',async()=>{
 vi.useRealTimers();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.spyOn(Math,'random').mockReturnValue(0);
 const original=seed();original.launch!.globalPlay={activatedAt:NOW.toISOString(),source:'simulation'};localStorage.setItem(KEY,JSON.stringify(original));window.history.replaceState(null,'','/#/home');const u=userEvent.setup(),view=render(<App/>);
 await act(async()=>{window.location.hash='/launch/unlock?demo=1';});expect(window.location.hash).toBe('#/launch/unlock?demo=1');expect(await screen.findByRole('button',{name:'Adding friends…'})).toBeTruthy();await u.click(await screen.findByRole('button',{name:'Skip animation'}));let saved=JSON.parse(localStorage.getItem(KEY)!) as PreviewState;expect(palFindingProgress(saved).count).toBe(0);expect(palFindingProgress(saved).activated).toBe(true);expect(saved.launch!.friendCredits).toHaveLength(0);const activatedAt=saved.launch!.globalPlay!.activatedAt;
 await u.click(screen.getByRole('button',{name:'Explore'}));expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Unlock roamie finding'})).toBeNull();view.unmount();const reloaded=render(<App/>);expect(screen.getByRole('button',{name:'Find my roamie'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Find my roamie'}));await confirmUnlock(u);expect(screen.getByRole('heading',{name:'Pick your day.'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Choose Little stops'}));expect(screen.getAllByRole('radio')).toHaveLength(6);
 for(let i=0;i<3;i++){await chooseTravelAnswer(u,`Anything ${i}`);await u.click(screen.getByRole('button',{name:i===2?'Find my roamie':'Next'}));}
 expect(screen.getByRole('heading',{name:'You found a roamie.'})).toBeTruthy();expect(screen.getByText('3/3 answers matched')).toBeTruthy();saved=JSON.parse(localStorage.getItem(KEY)!);expect(saved.social.proofs).toHaveLength(4);expect(saved.social.proofs[0].simulated).toBe(true);expect(saved.launch!.tickets).toHaveLength(1);expect(saved.daily.playsToday).toBe(1);expect(saved.launch!.globalPlay!.activatedAt).toBe(activatedAt);const peerId=saved.social.proofs.at(-1)!.peerId;
 await u.click(screen.getByRole('button',{name:'Meet my roamie'}));expect(screen.getByRole('heading',{name:'A little place swap.'})).toBeTruthy();await u.click(screen.getByRole('button',{name:/Play together/}));expect(screen.getByRole('heading',{name:'Pick your day.'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Choose Slow moments'}));expect((JSON.parse(localStorage.getItem(KEY)!) as PreviewState).daily.active!.peerId).toBe(peerId);await chooseTravelAnswer(u,'A saved answer');await u.click(screen.getByRole('button',{name:'Next'}));await u.click(screen.getByRole('button',{name:'Close game'}));expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Places'}));expect(screen.getByLabelText('Your uncovered world')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Check-ins from Tokyo'}));expect(screen.getByRole('heading',{name:'Tokyo'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByRole('heading',{name:'Tokyo'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));await u.click(screen.getByRole('button',{name:'Explore Tokyo, Japan'}));expect(screen.getByRole('heading',{name:'Tokyo'})).toBeTruthy();
 reloaded.unmount();window.history.replaceState(null,'','/#/home');render(<App/>);expect(screen.getByRole('heading',{name:'From your Roamies'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Unlock roamie finding'})).toBeNull();await act(async()=>{window.location.hash='/launch/unlock?demo=1';});await u.click(await screen.findByRole('button',{name:'Skip animation'}));expect((JSON.parse(localStorage.getItem(KEY)!) as PreviewState).daily.playsToday).toBe(2);await u.click(screen.getByRole('button',{name:'Find my roamie'}));await confirmUnlock(u);expect(screen.getByLabelText('Question 2 of 3')).toBeTruthy();saved=JSON.parse(localStorage.getItem(KEY)!);expect(saved.daily.active!.peerId).toBe(peerId);expect(saved.launch!.globalPlay!.activatedAt).toBe(activatedAt);expect(saved.profile).toEqual(original.profile);
});
it('replaying the unlock animation preserves the spent daily allowance and saved opening time',async()=>{
 vi.useRealTimers();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);const original=seed();original.launch!.globalPlay={activatedAt:NOW.toISOString(),source:'simulation'};original.daily={...original.daily,usageDay:'2026-11-19',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-20T19:00:00Z'};localStorage.setItem(KEY,JSON.stringify(original));window.history.replaceState(null,'','/#/home');const u=userEvent.setup();render(<App/>);expect(screen.getByRole('button',{name:'Next play at your daily time'}).hasAttribute('disabled')).toBe(true);await act(async()=>{window.location.hash='/launch/unlock?demo=1';});await u.click(await screen.findByRole('button',{name:'Skip animation'}));expect(screen.getByRole('button',{name:'Next play at your daily time'}).hasAttribute('disabled')).toBe(true);await u.click(screen.getByRole('button',{name:'Explore'}));const saved=JSON.parse(localStorage.getItem(KEY)!) as PreviewState;expect(saved.daily.playsToday).toBe(5);expect(saved.daily.nextUnlockAt).toBe(original.daily.nextUnlockAt);expect(palFindingProgress(saved).activated).toBe(true);
});

async function confirmUnlock(user:ReturnType<typeof userEvent.setup>){const start=screen.queryByRole('button',{name:/^(Let’s play|Continue my answers)$/});if(start)await user.click(start);}
