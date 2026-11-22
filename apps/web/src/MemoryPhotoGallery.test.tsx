import {it,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,travelPreview,addVisitedPhoto,type PreviewState} from '@rymzi/core';
import {VISITED_JPEGS} from '../../../packages/core/src/visited-photo-fixture';
import {VisitedPhotoFeed,VisitedPhotoEditor} from './VisitedPhotos';
function seed(count=3){let travel=travelPreview(['GB'],['JP','FR','IT']);for(const image of VISITED_JPEGS.slice(0,count))travel=addVisitedPhoto(travel,'GB',image,'gb-1');return {...emptyPreview(),profile:{name:'123456',avatar:'nori',ageBand:'25-30',travel}} as PreviewState;}
it('opens a tapped memory at the correct photo and preserves the chosen photo when returning to the feed',async()=>{
 const u=userEvent.setup(),state=seed(),before=JSON.stringify(state);render(<VisitedPhotoFeed state={state}/>);
 await u.click(await screen.findByRole('button',{name:'Open Tower Bridge memory photo 2'}));
 let gallery=screen.getByRole('dialog',{name:'Tower Bridge photos'});expect(gallery.classList.contains('is-fullscreen')).toBe(true);expect(within(gallery).getByText('YOUR MEMORIES')).toBeTruthy();expect(within(gallery).queryByText('WISH FULFILLED')).toBeNull();expect(within(gallery).getByRole('status',{name:'Photo 2 of 3'})).toBeTruthy();
 await u.click(within(gallery).getByRole('button',{name:'Next photo'}));await u.click(within(gallery).getByRole('button',{name:'Close photo gallery'}));expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByText('3 / 3')).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Open Tower Bridge memory photo 3'}));gallery=screen.getByRole('dialog',{name:'Tower Bridge photos'});expect(within(gallery).getByRole('status',{name:'Photo 3 of 3'})).toBeTruthy();expect(JSON.stringify(state)).toBe(before);
});
it('lets an uploaded thumbnail open its album without saving or removing the draft',async()=>{
 const u=userEvent.setup(),onChange=vi.fn(),travel=seed().profile!.travel!;render(<VisitedPhotoEditor travel={travel} cityId="GB" placeId="gb-1" label="Tower Bridge" onChange={onChange} onBusy={()=>{}}/>);
 await u.click(screen.getByRole('button',{name:'View Tower Bridge photo 2'}));const gallery=screen.getByRole('dialog',{name:'Tower Bridge photos'});expect(within(gallery).getByRole('status',{name:'Photo 2 of 3'})).toBeTruthy();await u.click(within(gallery).getByRole('button',{name:'Show photo 1'}));await u.click(within(gallery).getByRole('button',{name:'Close photo gallery'}));expect(onChange).not.toHaveBeenCalled();
 await u.click(screen.getByRole('button',{name:'Remove Tower Bridge photo 2'}));expect(onChange).toHaveBeenCalledOnce();expect(onChange.mock.calls[0][0].memories).toHaveLength(2);expect(screen.queryByRole('dialog')).toBeNull();
});
it('opens a single uploaded memory without unnecessary carousel controls',async()=>{
 const u=userEvent.setup();render(<VisitedPhotoFeed state={seed(1)}/>);await u.click(await screen.findByRole('button',{name:'Open Tower Bridge memory photo 1'}));const gallery=screen.getByRole('dialog',{name:'Tower Bridge photos'});expect(within(gallery).getByRole('img',{name:'Tower Bridge gallery photo 1'})).toBeTruthy();expect(within(gallery).queryByRole('button',{name:'Next photo'})).toBeNull();await u.click(within(gallery).getByRole('button',{name:'Close photo gallery'}));expect(screen.getByText('1 / 1')).toBeTruthy();
});
it('also previews filled wish-photo slots while leaving their remove actions separate',async()=>{
 const u=userEvent.setup(),onChange=vi.fn();render(<VisitedPhotoEditor travel={seed().profile!.travel!} cityId="GB" placeId="gb-1" label="Tower Bridge" goal={5} onChange={onChange} onBusy={()=>{}}/>);await u.click(screen.getByRole('button',{name:'View Tower Bridge photo 3'}));expect(within(screen.getByRole('dialog',{name:'Tower Bridge photos'})).getByRole('status',{name:'Photo 3 of 3'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Close photo gallery'}));expect(onChange).not.toHaveBeenCalled();await u.click(screen.getByRole('button',{name:'Remove Tower Bridge photo 3'}));expect(onChange).toHaveBeenCalledOnce();expect(screen.queryByRole('dialog')).toBeNull();
});
