import {chooseTravelAnswer} from './test-choice-helpers';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,travelQuestionBank,type PreviewState} from '@rymzi/core';
import {LegacyPreview as App} from './App';
const NOW=new Date('2026-11-19T05:00:00Z'),KEY='rymzi.preview.v1';
function seed(unlocked=true){const base={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud' as const,ageBand:'16-17' as const,city:'Chennai',country:'India'},launch:emptyLaunch(NOW)},s=unlocked?seedGlobalPals(simulatePalUnlock(base,NOW),NOW):base;localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'','/#/home');return s;}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('the historical topic flow still opens all six topics and the selected topic completes the global Roamie flow',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Find a Roamie'}));await confirmUnlock(u);expect(screen.getByRole('heading',{name:'Choose a topic.'})).toBeTruthy();for(const name of ['Little stops','Outside days','Wander freely','Slow moments','City stories','Afterglow'])expect(screen.getByRole('button',{name:`Choose ${name}`}).querySelector('img')).toBeTruthy();expect(saved().daily.active).toBeNull();expect(saved().daily.playsToday).toBe(0);
 await u.click(screen.getByRole('button',{name:'Choose Afterglow'}));expect(screen.getByRole('radiogroup',{name:'Your answer'})).toBeTruthy();expect(saved().daily.active!.categoryId).toBe('future-you');const ids=new Set(travelQuestionBank.filter(q=>q.topicId==='future-you').map(q=>q.id));expect(saved().daily.active!.ids.every(id=>ids.has(id))).toBe(true);expect(saved().daily.playsToday).toBe(0);
 for(let i=0;i<3;i++){await chooseTravelAnswer(u,`Anything ${i}`);await u.click(screen.getByRole('button',{name:i===2?'Find a Roamie':'Next'}));}expect(screen.getByRole('heading',{name:'You found a Roamie.'})).toBeTruthy();expect(saved().daily.playsToday).toBe(1);expect(saved().social.proofs).toHaveLength(4);
});
it('an untouched question can restart at topics without spending a play, including after reload',async()=>{
 seed();const u=userEvent.setup(),view=render(<App/>);await u.click(screen.getByRole('button',{name:'Find a Roamie'}));await confirmUnlock(u);await u.click(screen.getByRole('button',{name:'Choose Little stops'}));view.unmount();render(<App/>);expect(screen.getByRole('radiogroup',{name:'Your answer'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Close game'}));await u.click(screen.getByRole('button',{name:'Find a Roamie'}));await confirmUnlock(u);expect(screen.getByRole('heading',{name:'Choose a topic.'})).toBeTruthy();expect(saved().daily.playsToday).toBe(0);await u.click(screen.getByRole('button',{name:'Choose Outside days'}));expect(saved().daily.active!.categoryId).toBe('animals');expect(saved().daily.playsToday).toBe(0);
});
it('an answered draft resumes its topic and next question instead of restarting or charging twice',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Find a Roamie'}));await confirmUnlock(u);await u.click(screen.getByRole('button',{name:'Choose Little stops'}));const selected=await chooseTravelAnswer(u);await u.click(screen.getByRole('button',{name:'Next'}));expect(saved().daily.playsToday).toBe(1);await u.click(screen.getByRole('button',{name:'Close game'}));await u.click(screen.getByRole('button',{name:'Find a Roamie'}));await confirmUnlock(u);expect(screen.getByLabelText('Question 2 of 3')).toBeTruthy();expect(screen.queryByRole('heading',{name:'Choose a topic.'})).toBeNull();expect(saved().daily.active!.categoryId).toBe('food');expect(Object.values(saved().daily.active!.answers)).toContain(selected);expect(saved().daily.playsToday).toBe(1);
});
it('opening the topic URL cannot bypass the five-friend unlock',()=>{
 seed(false);window.history.replaceState(null,'','/#/categories');render(<App/>);expect(screen.getByRole('heading',{name:/Invite your.*friends/})).toBeTruthy();expect(screen.queryByRole('heading',{name:'Choose a topic.'})).toBeNull();expect(saved().daily.playsToday).toBe(0);
});

async function confirmUnlock(user:ReturnType<typeof userEvent.setup>){const start=screen.queryByRole('button',{name:/^(Let’s play|Continue my answers)$/});if(start)await user.click(start);}
