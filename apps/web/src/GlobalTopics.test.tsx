import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,categoryQuestions,type PreviewState} from '@rymzi/core';
import App from './App';
const NOW=new Date('2026-11-19T05:00:00Z'),KEY='rymzi.preview.v1';
function seed(unlocked=true){const base={...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud' as const,ageBand:'16-17' as const,city:'Chennai',country:'India'},launch:emptyLaunch(NOW)},s=unlocked?simulatePalUnlock(base,NOW):base;localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'','/#/home');return s;}
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('Home Play opens all six topics and the selected topic completes the global pal flow',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Find my pal'}));expect(screen.getByRole('heading',{name:'Pick a topic.'})).toBeTruthy();for(const name of ['Food mood','Wild things','What if?','Your world','Play mode','Future you'])expect(screen.getByRole('button',{name:`Choose ${name}`}).querySelector('img')).toBeTruthy();expect(saved().daily.active).toBeNull();expect(saved().daily.playsToday).toBe(0);
 await u.click(screen.getByRole('button',{name:'Choose Future you'}));expect(screen.getByRole('textbox',{name:'Your answer'})).toBeTruthy();expect(saved().daily.active!.categoryId).toBe('future-you');const ids=new Set(categoryQuestions('future-you','16-17').map(q=>q.id));expect(saved().daily.active!.ids.every(id=>ids.has(id))).toBe(true);expect(saved().daily.playsToday).toBe(0);
 for(let i=0;i<3;i++){await u.type(screen.getByRole('textbox',{name:'Your answer'}),`Anything ${i}`);await u.click(screen.getByRole('button',{name:i===2?'Find my pal':'Next'}));}expect(screen.getByRole('heading',{name:'You found a pal.'})).toBeTruthy();expect(saved().daily.playsToday).toBe(1);expect(saved().social.proofs).toHaveLength(4);
});
it('an untouched question can restart at topics without spending a play, including after reload',async()=>{
 seed();const u=userEvent.setup(),view=render(<App/>);await u.click(screen.getByRole('button',{name:'Find my pal'}));await u.click(screen.getByRole('button',{name:'Choose Food mood'}));view.unmount();render(<App/>);expect(screen.getByRole('textbox',{name:'Your answer'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Close game'}));await u.click(screen.getByRole('button',{name:'Find my pal'}));expect(screen.getByRole('heading',{name:'Pick a topic.'})).toBeTruthy();expect(saved().daily.playsToday).toBe(0);await u.click(screen.getByRole('button',{name:'Choose Wild things'}));expect(saved().daily.active!.categoryId).toBe('animals');expect(saved().daily.playsToday).toBe(0);
});
it('an answered draft resumes its topic and next question instead of restarting or charging twice',async()=>{
 seed();const u=userEvent.setup();render(<App/>);await u.click(screen.getByRole('button',{name:'Find my pal'}));await u.click(screen.getByRole('button',{name:'Choose Food mood'}));await u.type(screen.getByRole('textbox',{name:'Your answer'}),'Mango');await u.click(screen.getByRole('button',{name:'Next'}));expect(saved().daily.playsToday).toBe(1);await u.click(screen.getByRole('button',{name:'Close game'}));await u.click(screen.getByRole('button',{name:'Find my pal'}));expect(screen.getByLabelText('Question 2 of 3')).toBeTruthy();expect(screen.queryByRole('heading',{name:'Pick a topic.'})).toBeNull();expect(saved().daily.active!.categoryId).toBe('food');expect(Object.values(saved().daily.active!.answers)).toContain('Mango');expect(saved().daily.playsToday).toBe(1);
});
it('opening the topic URL cannot bypass the five-friend unlock',()=>{
 seed(false);window.history.replaceState(null,'','/#/categories');render(<App/>);expect(screen.getByRole('heading',{name:/Bring your.*five/})).toBeTruthy();expect(screen.queryByRole('heading',{name:'Pick a topic.'})).toBeNull();expect(saved().daily.playsToday).toBe(0);
});
