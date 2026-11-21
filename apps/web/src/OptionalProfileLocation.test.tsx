import {finishNewProfile} from './test-travel-setup';
import {expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,type PreviewState} from '@rymzi/core';
import App from './App';
import {chooseTravelAnswer} from './test-choice-helpers';
const KEY='rymzi.preview.v1';
const saved=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
it('starts with one selected avatar and no location fields or photo upload',async()=>{
 const u=userEvent.setup(),view=render(<App/>);await u.click(screen.getByRole('button',{name:'Get started'}));
 expect(screen.getByRole('heading',{name:'Pick your avatar.'})).toBeTruthy();expect(screen.getAllByRole('img')).toHaveLength(1);expect(screen.queryByRole('textbox')).toBeNull();expect(document.querySelector('input[type=file]')).toBeNull();
 await u.click(screen.getByRole('button',{name:'Change character'}));await u.click(screen.getByRole('button',{name:'Choose Nori'}));await u.click(screen.getByRole('button',{name:'Use Nori'}));await finishNewProfile(u);
 expect(screen.getByRole('button',{name:'Build my day'})).toBeTruthy();expect(saved().profile?.avatar).toBe('nori');expect(saved().profile?.city).toBeUndefined();expect(saved().profile?.country).toBeUndefined();expect(saved().profile?.photo).toBeUndefined();expect(saved().profile!.name).toMatch(/^[1-9]\d{5}$/);
 view.unmount();render(<App/>);await u.click(screen.getByRole('button',{name:'Profile'}));expect(screen.getByRole('group',{name:'Your avatar'}).querySelectorAll('img')).toHaveLength(1);expect(screen.getByRole('img',{name:'Nori avatar'})).toBeTruthy();
});
it('keeps existing coarse location and play progress when editing an avatar without location fields',async()=>{
 const now=new Date(),state={...emptyPreview(now),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,city:'Tokyo',country:'Japan'},launch:emptyLaunch(now)};localStorage.setItem(KEY,JSON.stringify(state));window.history.replaceState(null,'','/#/profile');
 const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Edit profile'}));expect(screen.queryByRole('textbox',{name:'City'})).toBeNull();expect(screen.queryByRole('textbox',{name:'Country'})).toBeNull();
 await u.click(screen.getByRole('button',{name:'Change character'}));await u.click(screen.getByRole('button',{name:'Choose Cleo'}));await u.click(screen.getByRole('button',{name:'Use Cleo'}));await u.click(screen.getByRole('button',{name:'Save changes'}));
 expect(saved().profile).toEqual({...state.profile,avatar:'cleo'});expect(saved().daily).toEqual(state.daily);expect(saved().social).toEqual(state.social);
});
it('completes the first day card with an avatar and no city or country',async()=>{
 const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Get started'}));await finishNewProfile(u);await u.click(screen.getByRole('button',{name:'Build my day'}));
 for(let i=0;i<3;i++){await chooseTravelAnswer(u);await u.click(screen.getByRole('button',{name:i===2?'Make my day card':'Next'}));}
 expect(screen.getByRole('button',{name:'Invite an explorer'})).toBeTruthy();expect(saved().launch!.tickets).toHaveLength(1);expect(saved().daily.playsToday).toBe(0);expect(saved().profile?.city).toBeUndefined();expect(saved().profile?.country).toBeUndefined();expect(saved().profile?.photo).toBeUndefined();
});
