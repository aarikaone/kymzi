import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,comingHomeVisit,palVisitLabels,palSummaries,type PreviewState} from '@rymzi/core';
import App from './App';
const NOW=new Date('2026-11-19T05:00:00Z'),KEY='rymzi.preview.v1';
function stored(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
function seed(){const s=simulatePalUnlock({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'16-17',city:'Chennai',country:'India'},launch:emptyLaunch(NOW)},NOW);localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'','/#/home');return s;}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('shows three pals on Home, identifies exactly one visiting avatar and opens its arrival date and time',async()=>{
 const original=seed(),u=userEvent.setup();render(<App/>);const rail=screen.getByLabelText('Connected pals');expect(within(rail).getAllByRole('button')).toHaveLength(3);expect(within(rail).getAllByLabelText('Coming to your city')).toHaveLength(1);expect(screen.getByText('Coming to you')).toBeTruthy();
 const s=stored(),visit=comingHomeVisit(s,NOW)!,labels=palVisitLabels(visit);expect(palSummaries(s)).toHaveLength(3);expect(s.daily).toEqual(original.daily);expect(s.launch!.friendCredits).toHaveLength(0);expect(screen.getByRole('button',{name:new RegExp(`is coming to Chennai.*View visit`)}).textContent).toContain(labels.time);
 await u.click(within(rail).getByRole('button',{name:/Coming to Chennai/}));const detail=screen.getByRole('group',{name:'Upcoming visit to your city'});expect(detail.textContent).toContain(labels.date);expect(detail.textContent).toContain(labels.time);expect(detail.textContent).toContain('Planned visit');expect(screen.getByText('Their moments')).toBeTruthy();
});
it('keeps the same three pals and schedule on reload and shows them in Profile',async()=>{
 seed();const u=userEvent.setup(),view=render(<App/>);const before=stored(),visit=comingHomeVisit(before,NOW)!;view.unmount();vi.setSystemTime(new Date(NOW.getTime()+2*3600000));render(<App/>);const after=stored();expect(after.social.proofs).toEqual(before.social.proofs);expect(after.launch!.globalPals).toEqual(before.launch!.globalPals);expect(after.daily.playsToday).toBe(0);await u.click(screen.getByRole('button',{name:'Profile'}));expect(screen.getByRole('heading',{name:'Your pals'})).toBeTruthy();expect(within(screen.getByLabelText('Connected pals')).getAllByRole('button')).toHaveLength(3);expect(screen.getByRole('button',{name:/is coming to Chennai.*View visit/})).toBeTruthy();expect(comingHomeVisit(stored(),NOW)!.arrivesAt).toBe(visit.arrivesAt);
});
it('routes the coming-to-my-city notification to that pal and retains the badge after the notification is read',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Notifications'}));const notice=screen.getByRole('button',{name:/Pal 01 is coming to Chennai/});expect(notice.textContent).toContain(palVisitLabels(comingHomeVisit(stored(),NOW)!).time);await u.click(notice);expect(screen.getByRole('group',{name:'Upcoming visit to your city'})).toBeTruthy();expect(stored().palInbox.readIds.some(id=>id.startsWith('home-pal-visit:'))).toBe(true);await u.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByText('Coming to you')).toBeTruthy();
});

it('returns a connected global save to pals and city images instead of the passport introduction, even if its activation flag is missing',async()=>{
 const base=seed(),s=seedGlobalPals(base,NOW);s.social={...s.social,proofs:s.social.proofs.slice(0,1)};delete s.launch!.globalPlay;localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'','/#/passport');const u=userEvent.setup(),view=render(<App/>);
 expect(screen.queryByRole('heading',{name:'Your passport.'})).toBeNull();expect(screen.getByRole('heading',{name:'Cities.'})).toBeTruthy();expect(screen.getByRole('button',{name:'Explore Tokyo, Japan'}).querySelector('img,[role=img]')).toBeTruthy();expect(within(screen.getByLabelText('Connected pals')).getAllByRole('button')).toHaveLength(1);expect(stored().launch!.globalPlay).toBeTruthy();
 await u.click(within(screen.getByLabelText('Connected pals')).getAllByRole('button')[0]);expect(screen.getByRole('heading',{name:'Their moments'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByRole('heading',{name:'Explore.'})).toBeTruthy();expect(screen.queryByText('Your passport.')).toBeNull();await u.click(screen.getByRole('button',{name:'Cities'}));await u.click(screen.getByRole('button',{name:/Check in to a city/}));await u.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByRole('button',{name:'Explore Tokyo, Japan'})).toBeTruthy();expect(screen.queryByText('Your passport.')).toBeNull();
 view.unmount();window.history.replaceState(null,'','/#/launch');render(<App/>);expect(screen.getByRole('heading',{name:'Explore.'})).toBeTruthy();expect(screen.queryByText('Your passport.')).toBeNull();expect(stored().daily.playsToday).toBe(s.daily.playsToday);
});
