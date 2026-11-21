import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,palFindingProgress,type PreviewState} from '@rymzi/core';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-21T05:00:00Z');
const saved=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
function seed(unlocked:boolean){const base:PreviewState={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(unlocked?simulatePalUnlock(base,NOW):base));window.history.replaceState(null,'','/#/world');}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});afterEach(()=>vi.useRealTimers());
async function openJaipur(u:ReturnType<typeof userEvent.setup>){await u.type(await screen.findByRole('textbox',{name:'Search world cities'}),'Jaipur');await u.click(screen.getByRole('button',{name:/Explore Jaipur, India guide/}));await u.click(await screen.findByRole('button',{name:'Explore Hawa Mahal'}));}
it('starts the selected play card from an attraction without spending a play on opening',async()=>{
 seed(true);const u=userEvent.setup();render(<App/>);await openJaipur(u);expect(screen.getByRole('region',{name:'Available play cards'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Play City stories'}));
 expect(screen.queryByRole('dialog',{name:'Jaipur place viewer'})).toBeNull();expect(await screen.findByRole('radiogroup',{name:'Your answer'})).toBeTruthy();expect(saved().daily.active?.categoryId).toBe('play');expect(saved().daily.playsToday).toBe(0);
 await u.click(screen.getAllByRole('radio')[0]);await u.click(screen.getByRole('button',{name:'Next'}));expect(saved().daily.playsToday).toBe(1);const ids=saved().daily.active!.ids;
 await u.click(screen.getByRole('button',{name:'Close game'}));await u.click(screen.getByRole('button',{name:'Places'}));await u.click(screen.getByRole('button',{name:'World'}));
 await openJaipur(u);await u.click(screen.getByRole('button',{name:'Continue my answers'}));expect(await screen.findByLabelText('Question 2 of 3')).toBeTruthy();expect(saved().daily.active!.ids).toEqual(ids);expect(saved().daily.playsToday).toBe(1);
});
it('keeps global play locked until five friends join, including play cards inside city stories',async()=>{
 seed(false);const u=userEvent.setup();render(<App/>);await openJaipur(u);expect(within(screen.getByRole('region',{name:'Available play cards'})).getByText('5 friends to unlock')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Find Roamies'}));expect(palFindingProgress(saved()).canPlay).toBe(false);expect(saved().daily.playsToday).toBe(0);expect(saved().daily.active).toBeNull();expect(saved().launch?.preparation).toBeTruthy();
});

it('lets a locked user explore and save a city place, then opens it from Favs after reload',async()=>{
 seed(false);const u=userEvent.setup(),app=render(<App/>);await openJaipur(u);
 await u.click(screen.getByRole('button',{name:'Explore this city'}));expect(screen.getByRole('dialog',{name:'Jaipur attractions'})).toBeTruthy();expect(saved().daily.active).toBeNull();
 await u.click(screen.getByRole('button',{name:'Explore Hawa Mahal'}));await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));expect(saved().launch?.places).toContain('Q836531');expect(palFindingProgress(saved()).canPlay).toBe(false);
 app.unmount();window.history.replaceState(null,'','/#/favorites');render(<App/>);await u.click(await screen.findByRole('button',{name:'Open saved Hawa Mahal'}));expect(await screen.findByRole('dialog',{name:'Jaipur place viewer'})).toBeTruthy();expect(screen.getByRole('button',{name:'Select Hawa Mahal'}).getAttribute('aria-pressed')).toBe('true');
 await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));expect(screen.getByRole('dialog',{name:'Remove from Favs?'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Keep saved'}));expect(saved().launch?.places).toContain('Q836531');
 await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));await u.click(screen.getByRole('button',{name:'Yes, unfavourite'}));expect(saved().launch?.places).not.toContain('Q836531');expect(saved().daily.playsToday).toBe(0);
});
