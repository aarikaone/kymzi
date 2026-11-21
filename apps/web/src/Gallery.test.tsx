import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,beginDaily,answerDaily,completeDemoPlay,type PreviewState,type CountryId,type AgeBand} from '@rymzi/core';
import {useEffect,useState} from 'react';
import {PalsGallery} from './CityGallery';
import {readPreview,toggleCityPhotoSaved,markCityPhotoSeen,hideCityPhoto,removeCityPhoto} from '@rymzi/core';

const KEY='rymzi.preview.v1',NOW=new Date('2026-11-18T05:00:00Z');
function App(){
 const [state,setState]=useState(()=>readPreview(JSON.parse(localStorage.getItem(KEY)!),NOW));
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(state));},[state]);
 const noop=()=>{};
 return <PalsGallery state={state} now={NOW} onCity={noop} onPlan={noop} onCities={noop} onVisits={noop} onCapture={noop} onPlay={noop} onSave={id=>setState(s=>({...s,photos:toggleCityPhotoSaved(s,id,NOW)}))} onSeen={id=>setState(s=>({...s,photos:markCityPhotoSeen(s,id)}))} onHide={id=>setState(s=>({...s,photos:hideCityPhoto(s,id)}))} onRemove={id=>setState(s=>({...s,photos:removeCityPhoto(s,id)}))}/>;
}

function seed(ageBand:AgeBand='16-17',cities:CountryId[]=['JP','BR']){
  let s:PreviewState={...emptyPreview(),profile:{name:'SecretPlayerName',avatar:'cloud',ageBand}};
  for(const id of cities){
    let daily=beginDaily(s.daily,ageBand,NOW,'food',id);
    for(const q of daily.active!.ids)daily=answerDaily(daily,q,'A new idea',NOW);
    s=completeDemoPlay({...s,daily},NOW);
  }
  localStorage.setItem(KEY,JSON.stringify(s));
  window.history.replaceState(null,'','#/pals');
  return s;
}
function data(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});

it('browses full-screen city moments with arrow keys and marks only the visible moment seen',()=>{
  seed();render(<App/>);
  const feed=screen.getByRole('region',{name:'City photo feed'});
  expect(screen.getByRole('article').getAttribute('aria-label')).toContain('Tokyo');
  expect(data().photos.seenIds).toHaveLength(1);
  fireEvent.keyDown(feed,{key:'ArrowDown'});
  expect(screen.getByRole('article').getAttribute('aria-label')).toContain('Rio');
  expect(data().photos.seenIds).toHaveLength(2);
  expect(screen.getByText('2 / 6')).toBeTruthy();
  expect(screen.queryByText('SecretPlayerName')).toBeNull();
  expect(screen.queryByText(/Luna/)).toBeNull();
  expect(data().daily.playsToday).toBe(2);
  expect(data().photos.credits).toHaveLength(0);
});
it('updates the visible moment when the feed is scrolled',()=>{
  seed();render(<App/>);
  const feed=screen.getByRole('region',{name:'City photo feed'});
  Object.defineProperty(feed,'clientHeight',{configurable:true,value:500});
  fireEvent.scroll(feed,{target:{scrollTop:1000}});
  expect(screen.getByText('3 / 6')).toBeTruthy();
  expect(screen.getByRole('heading',{name:'Tokyo.'})).toBeTruthy();
});
it('opens a chosen thumbnail at the same photo in the swipe feed',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Show photo grid'}));
  expect(screen.getByRole('region',{name:'City photo gallery'})).toBeTruthy();
  expect(screen.getAllByRole('button',{name:/Open photo/})).toHaveLength(6);
  await user.click(screen.getByRole('button',{name:'Open photo 4 in Rio'}));
  expect(screen.getByText('4 / 6')).toBeTruthy();
  expect(screen.getByRole('article').getAttribute('aria-label')).toContain('Rio');
});
it('saves a moment, filters keepsakes and restores them after reopening',async()=>{
  seed();const user=userEvent.setup(),view=render(<App/>);
  await user.click(screen.getByRole('button',{name:'Next photo'}));
  await user.click(screen.getByRole('button',{name:'Favorite photo'}));
  expect(screen.getByRole('button',{name:'Remove from favorites'}).getAttribute('aria-pressed')).toBe('true');
  expect(data().photos.savedIds).toHaveLength(1);
  view.unmount();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Favorite photos'}));
  expect(screen.queryByText(/\d+ favorite moments?/)).toBeNull();
  expect(screen.getByRole('article').getAttribute('aria-label')).toContain('Rio');
  await user.click(screen.getByRole('button',{name:'Remove from favorites'}));
  expect(screen.queryByText(/\d+ favorite moments?/)).toBeNull();
  expect(screen.getByRole('heading',{name:'Keep a little of their world.'})).toBeTruthy();await user.click(screen.getByRole('button',{name:'Browse moments'}));expect(screen.getByRole('article')).toBeTruthy();
  expect(data().photos.savedIds).toHaveLength(0);
});
it('double-clicking a photo saves it once without toggling an existing save off',()=>{
  seed();const view=render(<App/>),cover=view.container.querySelector('.moment-cover')!;
  fireEvent.doubleClick(cover);fireEvent.doubleClick(cover);
  expect(data().photos.savedIds).toHaveLength(1);
  expect(screen.getByText('Added to Favs')).toBeTruthy();
});
it('filters to a city and gives the gallery a clear end without repeating cards',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'🇧🇷 Rio'}));
  expect(screen.getByText('1 / 3')).toBeTruthy();
  const feed=screen.getByRole('region',{name:'City photo feed'});
  fireEvent.keyDown(feed,{key:'End'});
  expect(screen.getByRole('heading',{name:/Another roamie. Another story/})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Next photo'}).hasAttribute('disabled')).toBe(true);
  expect(feed.querySelectorAll('article')).toHaveLength(3);
  await user.click(screen.getByRole('button',{name:'See the gallery'}));
  expect(screen.getAllByRole('button',{name:/Open photo \d in Rio/})).toHaveLength(3);
});
it('hides a moment, removes it from Saved and keeps identities and plays private',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Favorite photo'}));
  await user.click(screen.getByRole('button',{name:'Hide this photo'}));
  expect(screen.getByText('1 / 5')).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Favorite photos'}));
  expect(screen.queryByText(/\d+ favorite moments?/)).toBeNull();
  expect(data().daily.playsToday).toBe(2);
  expect(screen.queryByRole('textbox',{name:/message/i})).toBeNull();
});
it('migrates photo saves created before bookmarks without losing a play or crashing',async()=>{
  const s=seed();const old=JSON.parse(JSON.stringify(s));delete old.photos.savedIds;
  localStorage.setItem(KEY,JSON.stringify(old));render(<App/>);
  await waitFor(()=>expect(data().photos.savedIds).toEqual([]));
  expect(screen.getByRole('article')).toBeTruthy();
  expect(data().daily.playsToday).toBe(2);
});
