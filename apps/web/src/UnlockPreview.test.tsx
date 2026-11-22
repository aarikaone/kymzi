import {chooseTravelAnswer} from './test-choice-helpers';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {act,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,palFindingProgress,discoveryCard,palFor,type PreviewState} from '@rymzi/core';
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

it('preserves global activation and opens the bottle flow after the unlock preview',async()=>{
 vi.useRealTimers();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);const original=seed();original.launch!.globalPlay={activatedAt:NOW.toISOString(),source:'simulation'};localStorage.setItem(KEY,JSON.stringify(original));window.history.replaceState(null,'','/#/launch/unlock?demo=1');const u=userEvent.setup();render(<App/>);await u.click(await screen.findByRole('button',{name:'Skip animation'}));await u.click(screen.getByRole('button',{name:'Find my roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();await u.click(screen.getAllByRole('button',{name:/^Open bottle in /})[0]);const card=discoveryCard(JSON.parse(localStorage.getItem(KEY)!),JSON.parse(localStorage.getItem(KEY)!).postcardDiscovery.active.cardId)!;for(let i=0;i<3;i++){await u.click(screen.getByRole('radio',{name:card.picks[i]}));await u.click(screen.getByRole('button',{name:i===2?'Open bottle':'Stamp my pick'}));}expect(await screen.findByRole('heading',{name:'Your routes cross.'})).toBeTruthy();const saved=JSON.parse(localStorage.getItem(KEY)!) as PreviewState;expect(palFor(saved,card.ownerId)).toBeTruthy();expect(saved.launch!.globalPlay!.activatedAt).toBe(original.launch!.globalPlay!.activatedAt);expect(saved.daily.playsToday).toBe(0);expect(saved.postcardDiscovery!.drop!.openedIds).toHaveLength(1);
});
it('replaying the unlock animation preserves the spent daily allowance and saved opening time',async()=>{
 vi.useRealTimers();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);const original=seed();original.launch!.globalPlay={activatedAt:NOW.toISOString(),source:'simulation'};original.daily={...original.daily,usageDay:'2026-11-19',playsToday:5,playTime:'19:00',nextUnlockAt:'2026-11-20T19:00:00Z'};localStorage.setItem(KEY,JSON.stringify(original));window.history.replaceState(null,'','/#/home');const u=userEvent.setup();render(<App/>);expect(screen.getByRole('button',{name:'Find my roamie'}).hasAttribute('disabled')).toBe(false);await act(async()=>{window.location.hash='/launch/unlock?demo=1';});await u.click(await screen.findByRole('button',{name:'Skip animation'}));expect(screen.getByRole('button',{name:'Find my roamie'}).hasAttribute('disabled')).toBe(false);await u.click(screen.getByRole('button',{name:'Explore'}));const saved=JSON.parse(localStorage.getItem(KEY)!) as PreviewState;expect(saved.daily.playsToday).toBe(5);expect(saved.daily.nextUnlockAt).toBe(original.daily.nextUnlockAt);expect(palFindingProgress(saved).activated).toBe(true);
});

async function confirmUnlock(user:ReturnType<typeof userEvent.setup>){const start=screen.queryByRole('button',{name:/^(Let’s play|Continue my answers)$/});if(start)await user.click(start);}
