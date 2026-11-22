import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,publishMapsPlace,placeCheckInFeed,readPreview} from '@rymzi/core';
import {VISITED_JPEGS as images} from '../../../packages/core/src/visited-photo-fixture';
import {MapsPlaceShare} from './MapShares';
import {FeedPlaceCard} from './FeedPlaceCard';
vi.mock('./gemPhoto',()=>({prepareGemPhoto:vi.fn(async(file:File)=>{if(file.name==='bad.jpg')throw Error('Couldn’t open this photo.');return file.name==='two.jpg'?images[1]:images[0];})}));
const now=new Date(),seed=()=>({...emptyPreview(now),profile:{name:'123456',avatar:'cloud' as const,ageBand:'25-30' as const},launch:emptyLaunch(now)});
afterEach(()=>vi.restoreAllMocks());
it('searches places, shows the address and location, and requires replacing the sample before sharing',async()=>{
 const confirm=vi.fn(),u=userEvent.setup();render(<MapsPlaceShare state={seed()} onConfirm={confirm} onHome={()=>{}}/>);
 await u.type(screen.getByRole('textbox',{name:'Search places'}),'hawa');await u.click(screen.getByRole('button',{name:'Select Hawa Mahal, Jaipur'}));
 expect(screen.getByRole('heading',{name:'Hawa Mahal'})).toBeTruthy();expect(screen.getByText('Hawa Mahal Road, Badi Choupad, Jaipur 302002')).toBeTruthy();expect(screen.getByText('Jaipur')).toBeTruthy();expect(screen.getByText('Sample image')).toBeTruthy();expect(screen.queryByRole('button',{name:'Share this gem'})).toBeNull();expect(confirm).not.toHaveBeenCalled();
 await u.upload(screen.getByLabelText('Photos of this place'),[new File(['a'],'one.jpg',{type:'image/jpeg'}),new File(['b'],'two.jpg',{type:'image/jpeg'})]);
 expect(await screen.findByText('Your photo')).toBeTruthy();expect(screen.queryByText('Sample image')).toBeNull();await u.type(screen.getByRole('textbox',{name:'Your local tip'}),'Go before the crowds.');expect(confirm).not.toHaveBeenCalled();await u.click(screen.getByRole('button',{name:'Share this gem'}));
 expect(confirm).toHaveBeenCalledOnce();const draft=confirm.mock.calls[0][0];expect(draft.photos.map((p:{image:string})=>p.image)).toEqual(images.slice(0,2));expect(draft.location.placePin?.latitude).toBe(26.9239);expect(draft.location.address).toContain('Badi Choupad');expect(draft.tip).toBe('Go before the crowds.');expect(draft.sampleId).toBeUndefined();expect(screen.getByRole('heading',{name:'Good find.'})).toBeTruthy();
});
it('lets you choose the cover and remove photos, and never publishes a failed or empty album',async()=>{
 const confirm=vi.fn(),u=userEvent.setup();render(<MapsPlaceShare state={seed()} onConfirm={confirm} onHome={()=>{}}/>);await u.click(screen.getByRole('button',{name:'Select Cubbon Park, Bengaluru'}));
 await u.upload(screen.getByLabelText('Photos of this place'),new File(['x'],'bad.jpg',{type:'image/jpeg'}));expect(await screen.findByRole('alert')).toBeTruthy();expect(confirm).not.toHaveBeenCalled();
 await u.upload(screen.getByLabelText('Photos of this place'),[new File(['a'],'one.jpg',{type:'image/jpeg'}),new File(['b'],'two.jpg',{type:'image/jpeg'})]);await screen.findByText('Your photo');await u.click(screen.getByRole('button',{name:'Make photo 2 the cover'}));
 expect(screen.getByRole('img',{name:'Your cover photo of Cubbon Park'}).querySelector('img')?.src).toBe(images[1]);await u.click(screen.getByRole('button',{name:'Remove photo 2'}));await u.click(screen.getByRole('button',{name:'Remove photo 1'}));expect(screen.queryByRole('button',{name:'Share this gem'})).toBeNull();expect(screen.getByText('Sample image')).toBeTruthy();expect(confirm).not.toHaveBeenCalled();
});
it('restores multiple photos in the feed and opens them in the full-screen photo viewer',async()=>{
 const confirm=vi.fn(),u=userEvent.setup(),view=render(<MapsPlaceShare state={seed()} onConfirm={confirm} onHome={()=>{}}/>);await u.click(screen.getByRole('button',{name:'Select Cubbon Park, Bengaluru'}));await u.upload(screen.getByLabelText('Photos of this place'),[new File(['a'],'one.jpg',{type:'image/jpeg'}),new File(['b'],'two.jpg',{type:'image/jpeg'})]);await screen.findByText('Your photo');await u.click(screen.getByRole('button',{name:'Share this gem'}));
 const state=readPreview(JSON.parse(JSON.stringify(publishMapsPlace(seed(),confirm.mock.calls[0][0],now))),now),place=placeCheckInFeed(state,undefined,now)[0];view.unmount();render(<FeedPlaceCard place={place} state={state} art={<span/>} onFavorite={()=>{}} onOpen={()=>{}}/>);
 expect(screen.getByLabelText('Photo 1 of 2')).toBeTruthy();await u.click(screen.getByRole('button',{name:'View Cubbon Park photo 1'}));const gallery=screen.getByRole('dialog',{name:'Cubbon Park photos'});expect(within(gallery).getByLabelText('Photo 1 of 2')).toBeTruthy();await u.click(within(gallery).getByRole('button',{name:'Next photo'}));expect(within(gallery).getByLabelText('Photo 2 of 2')).toBeTruthy();
});
