import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,citySpots,type PreviewState,type AgeBand} from '@rymzi/core';
import App from './App';
const NOW=new Date('2026-11-19T05:00:00Z'),KEY='rymzi.preview.v1',spots=citySpots('JP');
function seed(band:AgeBand='21-24'){const s:PreviewState={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:band,city:'Chennai',country:'India'},launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'','/#/guide/JP');return s;}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
async function checkIn(u:ReturnType<typeof userEvent.setup>){await u.click(screen.getByRole('button',{name:'I’m in Tokyo'}));await u.click(screen.getByRole('button',{name:'Choose a check-in spot'}));expect(screen.getByRole('button',{name:'Check in here'}).hasAttribute('disabled')).toBe(true);await u.click(screen.getByRole('button',{name:new RegExp(spots[0].name)}));await u.click(screen.getByRole('button',{name:'Check in here'}));}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('checks into a city, receives a request, pins another public spot and previews coming and arrival',async()=>{
 const original=seed(),u=userEvent.setup();render(<App/>);await checkIn(u);expect(screen.getByRole('heading',{name:'Meetup requests'})).toBeTruthy();expect(screen.getAllByText('Wants to meet in Tokyo')).toHaveLength(2);
 await u.click(screen.getByRole('button',{name:'Pick a spot with @boba_trails'}));await u.click(screen.getByRole('button',{name:`Pin ${spots[1].name}`}));await u.click(screen.getByRole('button',{name:'In 20 min'}));await u.click(screen.getByRole('button',{name:'Share meeting pin'}));expect(screen.getByText('Pin shared · Waiting for their reply')).toBeTruthy();expect(saved().cityMeetup!.meeting!.spotId).toBe(spots[1].id);
 await u.click(screen.getByRole('button',{name:'Preview them coming'}));expect(screen.getByText('Confirmed · Coming to your pin')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));await u.click(screen.getByRole('button',{name:'Notifications'}));expect(screen.getByText('@boba_trails is coming')).toBeTruthy();await u.click(screen.getByRole('button',{name:/@boba_trails is coming/}));expect(screen.getByText('Confirmed · Coming to your pin')).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Preview arrival'}));expect(screen.getByText('At the meeting pin')).toBeTruthy();expect(screen.getByRole('heading',{name:/They’re here.*Say hello/})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Finish & check out'}));expect(saved().cityMeetup!.checkIn).toBeNull();expect(saved().cityMeetup!.meeting).toBeNull();expect(saved().social).toEqual(original.social);expect(saved().daily).toEqual(original.daily);expect(saved().profile).toEqual(original.profile);
});
it('restores the pending meetup after reload and cancels without accepting another person automatically',async()=>{
 seed();const u=userEvent.setup(),view=render(<App/>);await checkIn(u);await u.click(screen.getByRole('button',{name:'Pick a spot with @boba_trails'}));await u.click(screen.getByRole('button',{name:'Share meeting pin'}));view.unmount();render(<App/>);expect(screen.getByText('Pin shared · Waiting for their reply')).toBeTruthy();expect(saved().cityMeetup!.meeting!.status).toBe('pinned');await u.click(screen.getByRole('button',{name:'Cancel meetup'}));expect(screen.queryByRole('button',{name:'Pick a spot with @boba_trails'})).toBeNull();expect(screen.getByRole('button',{name:'Pick a spot with @miso_wanders'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Check out'}));expect(screen.queryByText('Meetup requests')).toBeNull();
});
it('expires old presence, removes arrival controls and offers an explicit new check-in',async()=>{
 seed();const u=userEvent.setup(),view=render(<App/>);await checkIn(u);view.unmount();vi.setSystemTime(new Date(NOW.getTime()+61*60000));render(<App/>);expect(screen.getByRole('heading',{name:/Check-in.*Ended/})).toBeTruthy();expect(screen.queryByRole('button',{name:'Pick a spot with @boba_trails'})).toBeNull();await u.click(screen.getByRole('button',{name:'Check in again'}));expect(screen.getByRole('button',{name:'Check in here'})).toBeTruthy();
});
it('keeps teen walkthroughs explicitly fictional and younger children’s city presence private',async()=>{
 seed('16-17');const u=userEvent.setup(),view=render(<App/>);await checkIn(u);expect(screen.getByText('FICTIONAL ADULT WALKTHROUGH')).toBeTruthy();expect(saved().cityMeetup!.preview).toBe(true);expect(saved().profile!.ageBand).toBe('16-17');view.unmount();seed('10-12');window.history.replaceState(null,'','/#/city-check-in');render(<App/>);expect(screen.queryByText('Meetup requests')).toBeNull();expect(screen.queryByRole('button',{name:/Check in to a city/})).toBeNull();expect(saved().cityMeetup).toBeUndefined();
});
it('opens the check-in flow from a city guide without requiring a global Roamie',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'I’m in Tokyo'}));expect(screen.getByRole('button',{name:'Choose a check-in spot'})).toBeTruthy();expect(saved().social.proofs).toHaveLength(0);
});
