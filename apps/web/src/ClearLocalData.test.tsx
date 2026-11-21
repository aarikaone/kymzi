import {afterEach,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyLaunch,emptyPreview,simulatePalUnlock,type PreviewState} from '@rymzi/core';
import App,{LegacyPreview} from './App';
import {createLocalDataSession} from '../../mobile/local-data';

const KEY='rymzi.preview.v1';
function seed(legacy=false){
 const now=new Date(),profile={name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const,city:'Bengaluru',country:'India'};
 const state=legacy?{...emptyPreview(now),profile}:simulatePalUnlock({...emptyPreview(now),profile,launch:emptyLaunch(now)},now);
 localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem('kymzi.preview.v1',JSON.stringify(state));
 localStorage.setItem('kymzi.friend.saved',JSON.stringify({answers:['Coffee','Beach','Music']}));
 localStorage.setItem('rymzi.ideas.v1',JSON.stringify({week:'2026-11-16',used:2,revealed:{}}));
 sessionStorage.setItem('maps.draft','A place to share');window.history.replaceState(null,'','/#/profile');
}
afterEach(()=>{vi.restoreAllMocks();sessionStorage.clear();});
it('offers clear in Profile and cancelling preserves local data',async()=>{
 seed();const u=userEvent.setup();render(<App/>);const before=localStorage.getItem(KEY);
 await u.click(screen.getByRole('button',{name:'Clear local data'}));const dialog=screen.getByRole('dialog',{name:'Clear local data?'});
 expect(localStorage.getItem(KEY)).toBe(before);await u.click(within(dialog).getByRole('button',{name:'Cancel'}));
 expect(screen.queryByRole('dialog')).toBeNull();expect(localStorage.getItem(KEY)).toBe(before);expect(sessionStorage.getItem('maps.draft')).toBe('A place to share');
});
it.each([['current',App,false],['legacy',LegacyPreview,true]] as const)('clears %s Profile and returns to a fresh welcome without restoring old saves',async(_name,Component,legacy)=>{
 seed(legacy);const u=userEvent.setup(),view=render(<Component/>);await u.click(screen.getByRole('button',{name:'Clear local data'}));await u.click(screen.getByRole('button',{name:'Clear data'}));
 expect(await screen.findByRole('button',{name:'Get started'})).toBeTruthy();expect(window.location.hash).toBe('#/welcome');
 expect(localStorage.getItem('kymzi.preview.v1')).toBeNull();expect(localStorage.getItem('kymzi.friend.saved')).toBeNull();expect(sessionStorage.length).toBe(0);
 const fresh=JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
 expect(fresh.profile).toBeNull();expect(fresh.social.proofs).toHaveLength(0);expect(fresh.daily.playsToday).toBe(0);expect(fresh.daily.active).toBeNull();expect(fresh.launch).toBeUndefined();
 expect(JSON.parse(localStorage.getItem('rymzi.ideas.v1')!).used).toBe(0);
 view.unmount();render(<Component/>);expect(screen.getByRole('button',{name:'Get started'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Get started'}));
 expect(screen.queryByRole('textbox',{name:'City'})).toBeNull();expect(screen.queryByRole('textbox',{name:'Country'})).toBeNull();expect(screen.getByRole('button',{name:'Change character'})).toBeTruthy();
});
it('reports a storage failure without claiming a fresh start',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Clear local data'}));
 vi.spyOn(Storage.prototype,'clear').mockImplementationOnce(()=>{throw new Error('Storage is unavailable.');});
 await u.click(screen.getByRole('button',{name:'Clear data'}));expect(await screen.findByRole('alert')).toHaveProperty('textContent','Storage is unavailable.');
 expect(JSON.parse(localStorage.getItem(KEY)!).profile).not.toBeNull();expect(screen.queryByRole('button',{name:'Get started'})).toBeNull();
 fireEvent(screen.getByRole('dialog'),new Event('cancel',{cancelable:true}));expect(screen.queryByRole('dialog')).toBeNull();
});

function backend(){const data=new Map<string,string>([['profile','old'],['legacy','old'],['draft','old']]);return {data,getItem:async(key:string)=>data.get(key)??null,multiGet:async(keys:readonly string[])=>keys.map(key=>[key,data.get(key)??null] as [string,string|null]),setItem:vi.fn(async(key:string,value:string)=>{data.set(key,value);}),clear:vi.fn(async()=>{data.clear();})};}
it('native reset waits for in-flight saves, discards queued writes and closes the old session',async()=>{
 const disk=backend();let release!:()=>void,started!:()=>void;const wait=new Promise<void>(resolve=>{release=resolve;}),ready=new Promise<void>(resolve=>{started=resolve;});
 disk.setItem.mockImplementation(async(key,value)=>{started();await wait;disk.data.set(key,value);});
 const old=createLocalDataSession(disk),write=old.setItem('profile','late save');await ready;
 const queued=old.setItem('draft','queued save').catch(error=>error);const reset=old.clear();expect(old.clear()).toBe(reset);expect(disk.clear).not.toHaveBeenCalled();
 release();await write;await queued;await reset;expect(disk.data.size).toBe(0);expect(disk.setItem).toHaveBeenCalledTimes(1);expect(disk.clear).toHaveBeenCalledOnce();
 await expect(old.setItem('profile','resurrect old profile')).rejects.toThrow(/reset/);
 const fresh=createLocalDataSession(disk);await fresh.setItem('profile','new explorer');expect(disk.data.get('profile')).toBe('new explorer');
});
it('a failed native clear keeps the existing session usable for retry',async()=>{
 const disk=backend(),session=createLocalDataSession(disk);disk.clear.mockRejectedValueOnce(new Error('Disk busy'));
 await expect(session.clear()).rejects.toThrow('Disk busy');expect(await session.getItem('profile')).toBe('old');
 await session.setItem('draft','still editable');expect(disk.data.get('draft')).toBe('still editable');await session.clear();expect(disk.data.size).toBe(0);
});
