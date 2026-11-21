import {useState} from 'react';
import {act,fireEvent,render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import {loadTravelCityPlaces,searchTravelCities,type TravelPlace} from '@rymzi/core';
import {CitySheet} from './TravelSetup';
import {CityAttractionReel} from './CityAttractionReel';

it('opens Hawa Mahal as a large viewer without selecting it, then returns to the city grid',async()=>{
 const city=searchTravelCities('Jaipur')[0],toggle=vi.fn(),close=vi.fn(),u=userEvent.setup();
 render(<CitySheet cityId={city.id} onToggle={toggle} onClose={close}/>);
 const opener=await screen.findByRole('button',{name:'Explore Hawa Mahal'});await u.click(opener);
 const dialog=screen.getByRole('dialog',{name:'Jaipur place viewer'}),feed=within(dialog).getByRole('feed',{name:'Jaipur attractions feed'});
 expect(within(feed).getByRole('heading',{name:'Hawa Mahal'})).toBeTruthy();expect(toggle).not.toHaveBeenCalled();
 expect(within(dialog).queryByRole('link',{name:/Maps|Source/})).toBeNull();
 expect(feed.querySelectorAll('.world-generated-art').length).toBeLessThanOrEqual(3);
 await u.click(within(dialog).getByRole('button',{name:'Select Hawa Mahal'}));expect(toggle).toHaveBeenCalledExactlyOnceWith('Q836531');
 await u.click(within(dialog).getByRole('button',{name:'Back to Jaipur places'}));expect(screen.getByRole('dialog',{name:'Jaipur attractions'})).toBeTruthy();expect(document.activeElement).toBe(opener);expect(close).not.toHaveBeenCalled();
});

it('scrolls only through Jaipur, updates the counter and supports keyboard navigation',async()=>{
 const city=searchTravelCities('Jaipur')[0],places=await loadTravelCityPlaces(city.id),u=userEvent.setup();
 render(<CityAttractionReel city={city} places={places} initialId="Q836531" origin={null} selected={[]} onBack={()=>{}}/>);
 const feed=screen.getByRole('feed'),start=places.findIndex(p=>p.id==='Q836531');Object.defineProperty(feed,'clientHeight',{configurable:true,value:800});
 fireEvent.scroll(feed,{target:{scrollTop:(start+1)*800}});expect(screen.getByRole('heading',{name:places[start+1].name})).toBeTruthy();expect(screen.getByLabelText(`Place ${start+2} of 20`)).toBeTruthy();
 Object.defineProperty(feed,'clientHeight',{configurable:true,value:0});await u.keyboard('{End}');expect(screen.getByRole('heading',{name:places[19].name})).toBeTruthy();expect((screen.getByRole('button',{name:'Next attraction'}) as HTMLButtonElement).disabled).toBe(true);await u.keyboard('{Home}');expect(screen.getByRole('heading',{name:places[0].name})).toBeTruthy();
 expect(feed.querySelectorAll('article')).toHaveLength(20);expect(places.every(p=>p.cityId===city.id)).toBe(true);
});

it('reads the full description and facts in the app, without Maps or Source actions',async()=>{
 const city=searchTravelCities('Jaipur')[0],base=(await loadTravelCityPlaces(city.id))[0];
 const place:TravelPlace={...base,details:{description:'A sourced introduction to this palace.\n\nA second paragraph stays inside Kymzi.',facts:[{label:'Opened',value:'1799'},{label:'Architecture',value:'Rajput architecture'}],credits:[{title:'Hawa Mahal',url:'https://en.wikipedia.org/wiki/Hawa_Mahal',license:'CC BY-SA 4.0',attribution:'Wikipedia contributors'}],updatedAt:'today',status:'complete'}};
 const u=userEvent.setup();render(<CityAttractionReel city={city} places={[place]} initialId={place.id} origin={null} selected={[]} onBack={()=>{}}/>);await u.click(screen.getByRole('button',{name:`About ${place.name}`}));
 const details=screen.getByRole('dialog',{name:`About ${place.name}`});expect(within(details).getByText('1799')).toBeTruthy();expect(within(details).getByText('A second paragraph stays inside Kymzi.')).toBeTruthy();expect(within(details).queryByRole('link')).toBeNull();
 fireEvent(details,new Event('cancel',{bubbles:true,cancelable:true}));await waitFor(()=>expect(screen.queryByRole('dialog',{name:`About ${place.name}`})).toBeNull());expect(screen.getByRole('heading',{name:place.name})).toBeTruthy();
});

it('keeps selected styling in the dark caption area and preserves it after closing the viewer',async()=>{
 const city=searchTravelCities('Jaipur')[0],u=userEvent.setup();function Harness(){const [selected,set]=useState<string[]>([]);return <CitySheet cityId={city.id} selected={selected} onToggle={id=>set(s=>s.includes(id)?s.filter(v=>v!==id):[...s,id])} onClose={()=>{}}/>;}
 render(<Harness/>);await u.click(await screen.findByRole('button',{name:'Explore Hawa Mahal'}));await u.click(screen.getByRole('button',{name:'Select Hawa Mahal'}));expect(screen.getByRole('button',{name:'Select Hawa Mahal'}).getAttribute('aria-pressed')).toBe('true');await u.click(screen.getByRole('button',{name:'Back to Jaipur places'}));const picked=screen.getByRole('button',{name:'Select Hawa Mahal'});expect(picked.getAttribute('aria-pressed')).toBe('true');expect(picked.className).toContain('world-place-select');
});
