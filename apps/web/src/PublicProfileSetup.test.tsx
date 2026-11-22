import {useState} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {act,fireEvent,render,screen} from '@testing-library/react';
import {emptyPreview,makeProfilePhoto,type Profile,type PreviewState} from '@rymzi/core';
import {VISITED_JPEGS} from '../../../packages/core/src/visited-photo-fixture';
import {ProfileSetup} from './ProfileSetup';
const profile:Profile={name:'123456',avatar:'cloud',ageBand:'16-17'};
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
function Form({state=emptyPreview(),onSave=()=>{},initial=profile}:{state?:PreviewState;onSave?:()=>void;initial?:Profile}){const [draft,setDraft]=useState(initial);return <ProfileSetup profile={draft} state={state} onChange={setDraft} editing={false} busy={false} error="" onAvatar={()=>{}} onSave={onSave}/>;}
it('requires both an available username and explicit 13+ confirmation, with an animated pending check',async()=>{
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});const save=vi.fn();render(<Form onSave={save}/>);const next=screen.getByRole('button',{name:'Next'});expect(next.hasAttribute('disabled')).toBe(true);fireEvent.change(screen.getByRole('textbox',{name:'Username'}),{target:{value:'AVA_roams'}});expect(screen.getByText('Checking username…')).toBeTruthy();expect(document.querySelector('.username-checking')).toBeTruthy();await act(()=>vi.advanceTimersByTime(650));expect(screen.getByText('@ava_roams is available')).toBeTruthy();expect(next.hasAttribute('disabled')).toBe(true);fireEvent.click(screen.getByRole('checkbox',{name:'I’m 13 or older.'}));expect(next.hasAttribute('disabled')).toBe(false);fireEvent.click(next);expect(save).toHaveBeenCalledOnce();expect(screen.queryByText(/Your ID|assigned nickname/)).toBeNull();
});
it('rejects taken and invalid usernames and never applies a stale availability result',async()=>{
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});render(<Form state={{...emptyPreview(),usernameClaims:{taken_name:'654321'}}}/>);const field=screen.getByRole('textbox',{name:'Username'});fireEvent.change(field,{target:{value:'free_name'}});await act(()=>vi.advanceTimersByTime(400));fireEvent.change(field,{target:{value:'TAKEN_NAME'}});await act(()=>vi.advanceTimersByTime(650));expect(screen.getByText('That username is taken. Try another.')).toBeTruthy();expect(screen.queryByText('@free_name is available')).toBeNull();fireEvent.click(screen.getByRole('checkbox',{name:'I’m 13 or older.'}));expect(screen.getByRole('button',{name:'Next'}).hasAttribute('disabled')).toBe(true);fireEvent.change(field,{target:{value:'1bad'}});expect(screen.getByText('Start with a letter. Use 3–20 letters, numbers or underscores.')).toBeTruthy();
});
it('previews a single selected public photo instead of a second identity image',()=>{
 const avatarPhoto=makeProfilePhoto(VISITED_JPEGS[0],profile.ageBand);render(<Form initial={{...profile,username:'ava_roams',age13Confirmed:true,avatarPhoto}}/>);expect(screen.getByRole('img',{name:'Your profile photo'})).toBeTruthy();expect(screen.queryByRole('img',{name:'Cloud avatar'})).toBeNull();expect(screen.getByRole('button',{name:'Change photo'})).toBeTruthy();expect(screen.getByLabelText('Upload profile photo')).toBeTruthy();
});
it('keeps a known under-13 profile from entering the public setup flow',()=>{render(<Form initial={{...profile,ageBand:'10-12'}}/>);expect(screen.getByRole('checkbox',{name:'I’m 13 or older.'}).hasAttribute('disabled')).toBe(true);expect(screen.getByText('You must be 13 or older to create a public profile.')).toBeTruthy();expect(screen.getByRole('button',{name:'Upload photo'}).hasAttribute('disabled')).toBe(true);expect(screen.getByRole('button',{name:'Next'}).hasAttribute('disabled')).toBe(true);});
