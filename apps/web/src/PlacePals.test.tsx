import {expect,it,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,placeCheckInFeed,palSummaries,publishMapsPlace,parseMapsPlaceLink} from '@rymzi/core';
import {PlaceDetail} from './PlaceExperience';
const now=new Date();
const seed=()=>seedGlobalPals(simulatePalUnlock({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(now)},now),now);
const draft=(city='Osaka')=>({id:'own',name:'Little Garden',categoryId:'park' as const,location:{city,country:'Japan',source:'maps' as const},maps:parseMapsPlaceLink(`https://maps.apple.com/?q=Garden,+${city},+Japan`)});
it('opens connected city roamies from the compact place and keeps the two place actions',async()=>{
 const state=seed(),place=placeCheckInFeed(state,undefined,now).find(p=>p.countryId==='JP')!,pal=palSummaries(state).find(p=>p.id===place.peerId)!,open=vi.fn(),share=vi.fn(),u=userEvent.setup();
 render(<PlaceDetail state={state} now={now} id={place.id} onFavorite={()=>{}} onCheckIn={share} onPal={open}/>);
 expect(screen.getByRole('heading',{name:place.name})).toBeTruthy();const pals=screen.getByRole('region',{name:'Roamies in Tokyo'});expect(within(pals).getAllByRole('button')).toHaveLength(1);
 await u.click(within(pals).getByRole('button',{name:`Open ${pal.alias} in Tokyo`}));expect(open).toHaveBeenCalledWith(pal.id);
 const actions=screen.getByRole('group',{name:'Place actions'});expect(within(actions).getAllByRole('button')).toHaveLength(2);await u.click(within(actions).getByRole('button',{name:'Share a place'}));expect(share).toHaveBeenCalledOnce();
});
it('shows an honest empty city row instead of unrelated roamies',()=>{
 const state=publishMapsPlace(seed(),draft(),now);render(<PlaceDetail state={state} now={now} id="own" onFavorite={()=>{}} onCheckIn={()=>{}} onPal={()=>{}}/>);
 const pals=screen.getByRole('region',{name:'Roamies in Osaka'});expect(within(pals).queryAllByRole('button')).toHaveLength(0);expect(within(pals).getByText('No roamies here yet.')).toBeTruthy();
});
it('keeps the city-roamies section private for younger children',()=>{
 const state=publishMapsPlace({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'10-12',city:'Tokyo',country:'Japan'}},draft('Tokyo'),now);
 render(<PlaceDetail state={state} now={now} id="own" onFavorite={()=>{}} onCheckIn={()=>{}} onPal={()=>{}}/>);expect(screen.queryByRole('region',{name:/Roamies in/})).toBeNull();expect(screen.getByRole('heading',{name:'Little Garden'})).toBeTruthy();
});
