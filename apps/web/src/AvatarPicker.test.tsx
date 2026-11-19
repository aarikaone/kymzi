import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,beginDaily,answerDaily,completeDemoPlay,type PreviewState} from '@rymzi/core';
import {LegacyPreview as App} from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-18T05:00:00Z');
function seed(){let s:PreviewState={...emptyPreview(NOW),profile:{name:'Nova',avatar:'cloud',ageBand:'18-20'}},daily=beginDaily(s.daily,'18-20',NOW,'food','JP');for(const id of daily.active!.ids)daily=answerDaily(daily,id,'my idea',NOW);s=completeDemoPlay({...s,daily},NOW);localStorage.setItem(KEY,JSON.stringify(s));return s;}
function data(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
async function openPicker(user:ReturnType<typeof userEvent.setup>){await user.click(screen.getByRole('button',{name:'Profile'}));await user.click(screen.getByRole('button',{name:'Edit profile'}));await user.click(screen.getByRole('button',{name:'Change character'}));}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('offers 44 characters, filters by family and search, and previews a selected character',async()=>{
 seed();const user=userEvent.setup();render(<App/>);await openPicker(user);const grid=screen.getByRole('group',{name:'Choose your character'});expect(within(grid).getAllByRole('button',{name:/^Choose /})).toHaveLength(44);expect(screen.getByText('44 characters')).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Cosmic'}));expect(within(grid).queryByRole('button',{name:'Choose Mochi'})).toBeNull();expect(within(grid).getByRole('button',{name:'Choose Comet'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'All'}));await user.type(screen.getByRole('textbox',{name:'Find a character'}),'mOcHi');expect(within(grid).getAllByRole('button')).toHaveLength(1);await user.click(screen.getByRole('button',{name:'Choose Mochi'}));expect(screen.getByRole('img',{name:'Mochi character preview'}).getAttribute('src')).toBe('/avatars/mochi.webp');expect(screen.getByRole('button',{name:'Choose Mochi'}).getAttribute('aria-pressed')).toBe('true');expect(screen.getByRole('button',{name:'Use Mochi'})).toBeTruthy();
});
it('saves a new avatar through Edit Profile, preserves progress, and restores it after reopening',async()=>{
 const before=seed(),user=userEvent.setup(),view=render(<App/>);await openPicker(user);await user.type(screen.getByRole('textbox',{name:'Find a character'}),'nori');await user.click(screen.getByRole('button',{name:'Choose Nori'}));await user.click(screen.getByRole('button',{name:'Use Nori'}));expect(data().profile!.avatar).toBe('cloud');await user.click(screen.getByRole('button',{name:'Save changes'}));expect(screen.getByRole('button',{name:'Profile'}).getAttribute('aria-current')).toBe('page');expect(data().profile!.avatar).toBe('nori');expect(data().daily).toEqual(before.daily);expect(data().social).toEqual(before.social);expect(data().passport).toEqual(before.passport);expect(document.querySelector('.profile-night-hero img')?.getAttribute('src')).toBe('/avatars/nori.webp');view.unmount();render(<App/>);expect(document.querySelector('.profile-night-hero img')?.getAttribute('src')).toBe('/avatars/nori.webp');
});
it('backs out without applying the preview and recovers from an empty search',async()=>{
 seed();const user=userEvent.setup();render(<App/>);await openPicker(user);await user.type(screen.getByRole('textbox',{name:'Find a character'}),'zz-no-such-character');expect(screen.getByText('No characters found.')).toBeTruthy();await user.click(screen.getByRole('button',{name:'See all 44'}));await user.click(screen.getByRole('button',{name:'Choose Cleo'}));await user.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByRole('button',{name:'Change character'}).textContent).toContain('Cloud');expect(data().profile!.avatar).toBe('cloud');
});
