import {afterEach,expect,it,vi} from 'vitest';
import {act,render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyLaunch,emptyPreview,travelPreview,type PreviewState} from '@rymzi/core';
import App from './App';

const KEY='rymzi.preview.v1';
function seed(path='/home'){
 const now=new Date(),s:PreviewState={...emptyPreview(now),profile:{name:'123456',avatar:'nori',ageBand:'25-30',travel:travelPreview(['GB'],['JP','FR','IT'],now)},launch:emptyLaunch(now)};
 localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'',`/#${path}`);return s;
}
const stored=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
afterEach(()=>vi.restoreAllMocks());

it('opens wishlist editing directly, stages changes, and Cancel returns to Profile without saving them',async()=>{
 const before=seed(),u=userEvent.setup();render(<App/>);
 expect(screen.queryByRole('group',{name:'Travel lists'})).toBeNull();await u.click(screen.getByRole('button',{name:'Profile'}));
 await u.click(screen.getByRole('button',{name:'Edit travel wishlist'}));
 expect(screen.getByRole('tab',{name:'Wishlist 6'}).getAttribute('aria-selected')).toBe('true');
 expect(screen.queryByRole('button',{name:'Previous setup step'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Go back'})).toBeNull();
 await u.click(await screen.findByRole('button',{name:'Edit Shibuya Crossing wish'}));
 const sheet=screen.getByRole('region',{name:'Tokyo'});expect(screen.queryByRole('dialog')).toBeNull();
 await u.click(within(sheet).getByRole('button',{name:'Remove these wishes'}));
 expect(await screen.findByLabelText('4 wishlist places')).toBeTruthy();
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Cancel'}));
 await waitFor(()=>expect(window.location.hash).toBe('#/profile'));
 expect(await screen.findByRole('button',{name:'Open my Tokyo wish'})).toBeTruthy();
 expect(stored().daily).toEqual(before.daily);
 await u.click(screen.getByRole('button',{name:'Edit travel wishlist'}));
 expect(screen.getByLabelText('6 wishlist places')).toBeTruthy();
});

it('pushes city editing from Profile, keeps drafts across sections, and saves only travel before returning',async()=>{
 const before=seed('/profile'),u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'My travel list'}));
 expect(screen.getByRole('tab',{name:'Visited 1'}).getAttribute('aria-selected')).toBe('true');
 await u.click(screen.getByRole('button',{name:'Add visited places'}));await u.click(screen.getByRole('button',{name:'Choose Barcelona'}));
 let sheet=screen.getByRole('region',{name:'Barcelona'});
 await u.click(await within(sheet).findByRole('button',{name:'Select Sagrada Família'},{timeout:5000}));
 await u.click(screen.getByRole('button',{name:'Go back'}));await screen.findByRole('button',{name:'Choose Barcelona'});
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Choose Barcelona'}));
 sheet=screen.getByRole('region',{name:'Barcelona'});
 expect(within(sheet).getByRole('button',{name:'Select Sagrada Família'}).getAttribute('aria-pressed')).toBe('false');
 await u.click(await within(sheet).findByRole('button',{name:'Select Sagrada Família'},{timeout:5000}));
 await u.click(within(sheet).getByRole('button',{name:'Add visited city'}));
 await u.click(await screen.findByRole('tab',{name:'Wishlist 6'}));
 await u.click(screen.getByRole('tab',{name:'Visited 2'}));
 expect(await screen.findByRole('button',{name:'Edit Sagrada Família visit'})).toBeTruthy();
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(window.location.hash).toBe('#/profile'));
 const after=stored();expect(after.profile!.travel!.visited).toContainEqual({cityId:'ES',attractionIds:['es-1']});
 expect(after.profile!.avatar).toBe('nori');expect(after.daily).toEqual(before.daily);expect(after.social).toEqual(before.social);expect(after.launch).toEqual(before.launch);
});

it.each(['app Back','browser Back'])('returns to visited cities with %s during onboarding and preserves selected cities',async(kind)=>{
 window.history.replaceState(null,'','/#/welcome');const u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'Get started'}));await u.click(await screen.findByRole('button',{name:'Next'}));
 expect(screen.getAllByRole('button',{name:'Go back'})).toHaveLength(1);
 await u.click(screen.getByRole('button',{name:'Add visited places'}));await u.click(screen.getByRole('button',{name:'Choose London'}));
 await u.click(within(screen.getByRole('region',{name:'London'})).getByRole('button',{name:'Add visited city'}));
 await u.click(await screen.findByRole('button',{name:'Next'}));
 expect(screen.getByRole('heading',{name:/Your someday\s+list\./})).toBeTruthy();
 if(kind==='app Back')await u.click(screen.getByRole('button',{name:'Go back'}));else await act(async()=>{window.history.back();});
 await waitFor(()=>expect(screen.getByRole('heading',{name:/Your memories\./})).toBeTruthy());
 expect(await screen.findByRole('button',{name:'Edit London visit'})).toBeTruthy();
 expect(stored().profile).toBeNull();
});

it('keeps the editor open when saving fails, then retries without changing play allowance',async()=>{
 const before=seed('/profile'),u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'My travel list'}));
 const original=Storage.prototype.setItem;
 const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){if(key===KEY)throw new Error('Full');original.call(this,key,value);});
 await u.click(screen.getByRole('button',{name:'Save changes'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Couldn’t save. Free some device storage and try again.');
 expect(stored().profile).toEqual(before.profile);expect(screen.getByRole('button',{name:'Cancel'})).toBeTruthy();
 fail.mockRestore();await u.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(window.location.hash).toBe('#/profile'));expect(stored().daily).toEqual(before.daily);
});

it('makes room for city results during search and opens a city without an extra dismissal tap',async()=>{
 seed('/profile');const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'My travel list'}));
 await user.click(screen.getByRole('button',{name:'Add visited places'}));const field=screen.getByRole('textbox',{name:'Find a city'});await user.click(field);
 expect(screen.queryByRole('heading',{name:/Your memories/})).toBeNull();expect(screen.queryByRole('button',{name:'Save changes'})).toBeNull();
 await user.type(field,'Munnar');expect(screen.getAllByRole('button',{name:/^Choose /})).toHaveLength(1);
 await user.click(screen.getByRole('button',{name:'Done'}));expect(screen.getByRole('heading',{name:/Find your\s+places/})).toBeTruthy();expect(screen.queryByRole('button',{name:'Save changes'})).toBeNull();expect((field as HTMLInputElement).value).toBe('Munnar');
 await user.click(field);await user.click(screen.getByRole('button',{name:/^Choose Munnar/}));expect(await screen.findByRole('heading',{name:'Munnar'})).toBeTruthy();expect(screen.queryByRole('dialog')).toBeNull();expect(await screen.findByRole('button',{name:'Select Anamudi'})).toBeTruthy();
});

it.each(['viewer Back','browser Back'])('browses London attraction images on a full page and keeps picks after %s',async(backKind)=>{
 const before=seed('/profile');before.profile!.travel!.visited=[];localStorage.setItem(KEY,JSON.stringify(before));const user=userEvent.setup();render(<App/>);
 await user.click(screen.getByRole('button',{name:'My travel list'}));await user.click(screen.getByRole('button',{name:'Add visited places'}));await user.click(screen.getByRole('button',{name:'Choose London'}));
 await user.click(await screen.findByRole('button',{name:'Explore Tower Bridge'}));const feed=await screen.findByRole('feed',{name:'London attractions feed'});
 expect(screen.queryByRole('dialog')).toBeNull();expect(within(feed).getByRole('heading',{name:'Tower Bridge'})).toBeTruthy();expect(screen.getByRole('button',{name:'Select Tower Bridge'}).getAttribute('aria-pressed')).toBe('false');
 await user.click(screen.getByRole('button',{name:'Select Tower Bridge'}));await user.click(screen.getByRole('button',{name:'Next attraction'}));expect(screen.getByRole('heading',{name:'British Museum'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Select British Museum'}));expect(stored().profile).toEqual(before.profile);
 if(backKind==='viewer Back')await user.click(screen.getByRole('button',{name:'Back to London places'}));else await act(async()=>{window.history.back();});
 await waitFor(()=>expect(screen.queryByRole('feed')).toBeNull());expect((await screen.findByRole('button',{name:'Select Tower Bridge'})).getAttribute('aria-pressed')).toBe('true');expect(screen.getByRole('button',{name:'Select British Museum'}).getAttribute('aria-pressed')).toBe('true');
 await user.click(screen.getByRole('button',{name:'Add visited city'}));await user.click(await screen.findByRole('button',{name:'Save changes'}));await waitFor(()=>expect(window.location.hash).toBe('#/profile'));
 expect(stored().profile!.travel!.visited).toContainEqual({cityId:'GB',attractionIds:['gb-1','gb-2']});expect(stored().daily).toEqual(before.daily);
});
