import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,palFindingProgress,type PreviewState} from '@rymzi/core';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-21T05:00:00Z');
const saved=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
function seed(unlocked:boolean){const base:PreviewState={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(unlocked?simulatePalUnlock(base,NOW):base));window.history.replaceState(null,'','/#/world');}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});afterEach(()=>vi.useRealTimers());
async function openJaipur(u:ReturnType<typeof userEvent.setup>){const field=await screen.findByRole('textbox',{name:'Search world cities'});await u.clear(field);await u.type(field,'Jaipur');await u.click(screen.getByRole('button',{name:/Explore Jaipur, India guide/}));await u.click(await screen.findByRole('button',{name:'Explore Hawa Mahal'}));}
it('opens the World daily-bottle flow without starting or spending a worldwide matching',async()=>{
 seed(true);const u=userEvent.setup();render(<App/>);await openJaipur(u);expect(screen.queryByRole('region',{name:'Available play cards'})).toBeNull();expect(screen.queryByRole('button',{name:'Select Hawa Mahal'})).toBeNull();await u.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();expect(saved().daily.active).toBeNull();expect(saved().daily.playsToday).toBe(0);
});
it('lets a locked user browse bottles without granting worldwide matching or an instant connection',async()=>{
 seed(false);const u=userEvent.setup();render(<App/>);await openJaipur(u);await u.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();expect(palFindingProgress(saved()).canPlay).toBe(false);expect(saved().launch!.places).toEqual([]);expect(saved().social.proofs).toEqual([]);await u.click(screen.getAllByRole('button',{name:/^Open bottle in /})[0]);expect(screen.getByRole('dialog',{name:'Find Roamies worldwide'})).toBeTruthy();
});
it('retains existing favourite controls when opening a saved guide outside World',async()=>{
 seed(false);const data=saved();data.launch!.places=['Q836531'];localStorage.setItem(KEY,JSON.stringify(data));window.history.replaceState(null,'','/#/favorites');const u=userEvent.setup();render(<App/>);await u.click(await screen.findByRole('button',{name:'Open saved Hawa Mahal'}));expect(await screen.findByRole('dialog',{name:'Jaipur place viewer'})).toBeTruthy();expect(screen.getByRole('button',{name:'Select Hawa Mahal'}).getAttribute('aria-pressed')).toBe('true');
 await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));expect(screen.getByRole('dialog',{name:'Remove from Favs?'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Keep saved'}));expect(saved().launch?.places).toContain('Q836531');
 await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));await u.click(screen.getByRole('button',{name:'Yes, unfavourite'}));expect(saved().launch?.places).not.toContain('Q836531');expect(saved().daily.playsToday).toBe(0);
});
