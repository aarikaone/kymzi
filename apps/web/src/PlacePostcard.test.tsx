import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {webcrypto} from 'node:crypto';
import {emptyPreview,emptyLaunch,palFindingProgress,questionById,type PreviewState} from '@rymzi/core';
import App from './App';
import {packPostcard} from './test-postcard-editor';
import {postcardQuestions} from '@rymzi/core';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-22T08:00:00Z');
function seed(){const state:PreviewState={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(NOW)};localStorage.setItem(KEY,JSON.stringify(state));window.history.replaceState(null,'','/#/world/city/JP/place/jp-3');return state;}
const saved=()=>JSON.parse(localStorage.getItem(KEY)!) as PreviewState;
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
async function openComposer(){await act(async()=>{window.location.hash='/world/city/JP/postcard/jp-3';});}
async function make(u:ReturnType<typeof userEvent.setup>){await openComposer();expect(await screen.findByRole('heading',{name:'Leave a little hello.'})).toBeTruthy();expect(screen.getByRole('article',{name:'Sealed postcard for Tokyo from #123456'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Make my postcard'}));await packPostcard(u);expect(screen.getByRole('region',{name:'Your postcard picks'})).toBeTruthy();}
it('the sender composer saves a place-bound waiting postcard after explicit confirmation',async()=>{
 const before=seed(),u=userEvent.setup();let view=render(<App/>);expect(await screen.findByRole('button',{name:'Find a Roamie'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Select Tokyo Tower'})).toBeNull();expect(screen.queryByRole('region',{name:'Available play cards'})).toBeNull();await make(u);
 expect(saved().launch!.placePostcards).toBeUndefined();await u.click(screen.getByRole('button',{name:'Bottle & release'}));expect(await screen.findByText('Drifting · Waiting to be opened')).toBeTruthy();expect(screen.getByRole('button',{name:'Receiver'})).toBeTruthy();expect(saved().launch!.placePostcards).toHaveLength(1);expect(saved().launch!.placePostcards![0]).toMatchObject({cityId:'JP',placeId:'jp-3'});expect(saved().launch!.places).toEqual([]);expect(saved().daily).toEqual(before.daily);expect(saved().social).toEqual(before.social);expect(palFindingProgress(saved()).canPlay).toBe(false);
 view.unmount();view=render(<App/>);expect(await screen.findByText('Drifting · Waiting to be opened')).toBeTruthy();expect(screen.queryByRole('button',{name:'Bottle & release'})).toBeNull();expect(saved().launch!.placePostcards).toHaveLength(1);
});
it('backs out of making a postcard without saving any picks or spending plays',async()=>{
 const before=seed(),u=userEvent.setup();render(<App/>);await openComposer();await u.click(await screen.findByRole('button',{name:'Make my postcard'}));await u.click(screen.getByRole('button',{name:'Choose question 1'}));await u.click(screen.getByRole('button',{name:postcardQuestions('','25-30')[0].prompt}));await u.click(screen.getAllByRole('radio')[0]);await u.click(screen.getByRole('button',{name:'Go back'}));expect(screen.getByLabelText('Edit your postcard')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));expect(await screen.findByRole('button',{name:'Find a Roamie'})).toBeTruthy();expect(saved().launch!.placePostcards).toBeUndefined();expect(saved().launch!.tickets).toEqual([]);expect(saved().daily).toEqual(before.daily);
});
it('keeps the postcard ready after storage failure and retries without duplicate placement or invitations',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await make(u);const failure=vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(()=>{throw new Error('Storage full');});await u.click(screen.getByRole('button',{name:'Bottle & release'}));expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Couldn’t save.'));expect(saved().launch!.placePostcards).toBeUndefined();failure.mockRestore();await u.click(screen.getByRole('button',{name:'Bottle & release'}));expect(await screen.findByText('Drifting · Waiting to be opened')).toBeTruthy();expect(saved().launch!.placePostcards).toHaveLength(1);expect(saved().launch!.invites).toHaveLength(1);expect(saved().launch!.tickets).toHaveLength(1);
});
it('receiver preview shows the selected place and returns to an opened postcard after a matching reply',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await make(u);await u.click(screen.getByRole('button',{name:'Bottle & release'}));await u.click(await screen.findByRole('button',{name:'Receiver'}));expect(await screen.findByText('Tokyo Tower · Tokyo')).toBeTruthy();await u.click(screen.getByRole('button',{name:'Answer to open'}));const ticket=saved().launch!.tickets.at(-1)!;for(let i=0;i<3;i++){const label=questionById(ticket.ids[i])!.choices!.find(c=>c.label===ticket.answers[i])!.label;await u.click(screen.getByRole('radio',{name:label}));await u.click(screen.getByRole('button',{name:i===2?'Reveal our match':'Next'}));}await u.click(await screen.findByRole('button',{name:'Back to postcard'}));expect(await screen.findByText('Your postcard is drifting.')).toBeTruthy();expect(palFindingProgress(saved()).count).toBe(1);expect(saved().daily.playsToday).toBe(0);expect(saved().launch!.places).toEqual([]);
});

it('returns to the attraction currently being viewed when returning from daily bottles after scrolling',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(await screen.findByRole('button',{name:'Next attraction'}));expect(screen.getByRole('heading',{name:'Ueno Park'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Find a Roamie'}));expect(await screen.findByRole('region',{name:'Today’s bottles'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Go back'}));expect(await screen.findByRole('heading',{name:'Ueno Park'})).toBeTruthy();expect(saved().launch!.placePostcards).toBeUndefined();
});
