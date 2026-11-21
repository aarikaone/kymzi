import {it,expect,vi,afterEach} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {emptyPreview,confirmPlaceCheckIn,checkInMonthProgress,togglePlaceFavorite,type PreviewState} from '@rymzi/core';
import {PlaceCheckIn,PlaceFeed} from './PlaceExperience';
const now=new Date(2026,10,20,12);
const seed=():PreviewState=>({...emptyPreview(now),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'}});
afterEach(()=>vi.unstubAllGlobals());
it('names a place, selects one of twenty categories, reviews it, then confirms once',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));const confirmed=vi.fn(),home=vi.fn(),s=seed(),user=userEvent.setup();
 render(<PlaceCheckIn state={s} onConfirm={confirmed} onHome={home}/>);
 await user.click(screen.getByRole('button',{name:'Add city instead'}));await user.click(screen.getByRole('button',{name:'Use this city'}));
 await user.type(screen.getByRole('textbox',{name:'What is this place called?'}),'Cubbon Park');
 expect(document.querySelectorAll('.place-categories button')).toHaveLength(20);
 await user.click(screen.getByRole('button',{name:'Park'}));await user.click(screen.getByRole('button',{name:'Preview my place'}));
 expect(await screen.findByRole('heading',{name:'This is the place?'})).toBeTruthy();expect(confirmed).not.toHaveBeenCalled();
 expect(checkInMonthProgress(s,now).count).toBe(0);expect(screen.getByText('Bengaluru, India')).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Confirm check-in'}));expect(confirmed).toHaveBeenCalledTimes(1);
 expect(confirmed.mock.calls[0][0]).toMatchObject({name:'Cubbon Park',categoryId:'park',location:{city:'Bengaluru',country:'India',source:'manual'}});
 expect(screen.getByRole('heading',{name:'You were here.'})).toBeTruthy();await user.click(screen.getByRole('button',{name:/See it on Home/}));expect(home).toHaveBeenCalledOnce();
});
it('favourites collect places and never expose a photo upload control',async()=>{
 const initial=confirmPlaceCheckIn(seed(),{id:'park-1',name:'Cubbon Park',categoryId:'park',location:{city:'Bengaluru',country:'India',source:'manual'}},now);
 function Harness(){const [s,set]=useState(initial);return <><PlaceFeed state={s} now={now} onFavorite={id=>set(s=>togglePlaceFavorite(s,id,now))} onOpen={()=>{}} onCheckIn={()=>{}}/><PlaceFeed favorites state={s} now={now} onFavorite={id=>set(s=>togglePlaceFavorite(s,id,now))} onOpen={()=>{}} onCheckIn={()=>{}}/></>;}
 const user=userEvent.setup();render(<Harness/>);expect(screen.getAllByRole('heading',{name:'Cubbon Park'})).toHaveLength(1);
 await user.click(screen.getByRole('button',{name:'Favorite Cubbon Park'}));expect(screen.getAllByRole('heading',{name:'Cubbon Park'})).toHaveLength(2);
 expect(document.querySelector('input[type=file]')).toBeNull();expect(screen.queryByRole('button',{name:/camera|upload photo/i})).toBeNull();
});
it('location denial keeps check-in available through explicit manual city entry',async()=>{
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_success:unknown,reject:(error:Error)=>void)=>reject(new Error('Location permission denied.'))}});
 const user=userEvent.setup();render(<PlaceCheckIn state={seed()} onConfirm={()=>{}} onHome={()=>{}}/>);await user.click(screen.getByRole('button',{name:/Use my location/}));
 expect(await screen.findByRole('alert')).toBeTruthy();expect(screen.getByRole('textbox',{name:'City'})).toBeTruthy();expect(screen.getByRole('button',{name:'Preview my place'}).hasAttribute('disabled')).toBe(true);
});
