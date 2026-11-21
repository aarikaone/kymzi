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

it('opens wishlist editing directly, stages changes, and Cancel returns to Home without saving them',async()=>{
 const before=seed(),u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'Edit travel wishlist'}));
 expect(screen.getByRole('tab',{name:'Wishlist 3'}).getAttribute('aria-selected')).toBe('true');
 expect(screen.queryByRole('button',{name:'Previous setup step'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Go back'})).toBeNull();
 await u.click(screen.getByRole('button',{name:'Edit Tokyo wish'}));
 const sheet=screen.getByRole('dialog',{name:'Tokyo attractions'});
 await u.click(within(sheet).getByRole('button',{name:'Remove city'}));
 expect(screen.getByLabelText('2 of 3 wishlist cities')).toBeTruthy();
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Cancel'}));
 expect(window.location.hash).toBe('#/home');
 expect(await screen.findByRole('button',{name:'Open my Tokyo wish'})).toBeTruthy();
 expect(stored().daily).toEqual(before.daily);
 await u.click(screen.getByRole('button',{name:'Edit travel wishlist'}));
 expect(screen.getByLabelText('3 of 3 wishlist cities')).toBeTruthy();
});

it('pushes city editing from Profile, keeps drafts across sections, and saves only travel before returning',async()=>{
 const before=seed('/profile'),u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'My travel list'}));
 expect(screen.getByRole('tab',{name:'Visited 1'}).getAttribute('aria-selected')).toBe('true');
 await u.click(screen.getByRole('button',{name:'Choose Barcelona'}));
 let sheet=screen.getByRole('dialog',{name:'Barcelona attractions'});
 await u.click(within(sheet).getByRole('button',{name:'Select Sagrada Família'}));
 await u.keyboard('{Escape}');
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Choose Barcelona'}));
 sheet=screen.getByRole('dialog',{name:'Barcelona attractions'});
 expect(within(sheet).getByRole('button',{name:'Select Sagrada Família'}).getAttribute('aria-pressed')).toBe('false');
 await u.click(within(sheet).getByRole('button',{name:'Select Sagrada Família'}));
 await u.click(within(sheet).getByRole('button',{name:'Add visited city'}));
 await u.click(screen.getByRole('tab',{name:'Wishlist 3'}));
 await u.click(screen.getByRole('tab',{name:'Visited 2'}));
 expect(screen.getByRole('button',{name:'Choose Barcelona'}).getAttribute('aria-pressed')).toBe('true');
 expect(stored().profile).toEqual(before.profile);
 await u.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(window.location.hash).toBe('#/profile'));
 const after=stored();expect(after.profile!.travel!.visited).toContainEqual({cityId:'ES',attractionIds:['es-1']});
 expect(after.profile!.avatar).toBe('nori');expect(after.daily).toEqual(before.daily);expect(after.social).toEqual(before.social);expect(after.launch).toEqual(before.launch);
});

it.each(['app Back','browser Back'])('returns to visited cities with %s during onboarding and preserves selected cities',async(kind)=>{
 window.history.replaceState(null,'','/#/welcome');const u=userEvent.setup();render(<App/>);
 await u.click(screen.getByRole('button',{name:'Get started'}));await u.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getAllByRole('button',{name:'Go back'})).toHaveLength(1);
 await u.click(screen.getByRole('button',{name:'Choose London'}));
 await u.click(within(screen.getByRole('dialog',{name:'London attractions'})).getByRole('button',{name:'Add visited city'}));
 await u.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('heading',{name:'Where next?'})).toBeTruthy();
 if(kind==='app Back')await u.click(screen.getByRole('button',{name:'Go back'}));else await act(async()=>{window.history.back();});
 await waitFor(()=>expect(screen.getByRole('heading',{name:/Where have\s+you been\?/})).toBeTruthy());
 expect(screen.getByRole('button',{name:'Choose London'}).getAttribute('aria-pressed')).toBe('true');
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
