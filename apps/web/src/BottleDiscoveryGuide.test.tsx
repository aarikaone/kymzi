import {afterEach,it,expect,vi} from 'vitest';
import {act,fireEvent,render,screen,within} from '@testing-library/react';
import {BottleDiscoveryGuide} from './BottleDiscoveryGuide';
function motion(reduced:boolean){Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:reduced,addEventListener:()=>{},removeEventListener:()=>{}})});}
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('automatically explains drift, play and connection once, then supports replay and cleans up its timer',()=>{
 vi.useFakeTimers();motion(false);const view=render(<BottleDiscoveryGuide avatar="cloud"/>),guide=screen.getByRole('region',{name:'How bottles work'});
 expect(within(guide).getByRole('heading',{name:'A postcard arrived.'})).toBeTruthy();act(()=>vi.advanceTimersByTime(3000));expect(within(guide).getByRole('heading',{name:'Answer 3 questions.'})).toBeTruthy();expect(within(guide).getByText('Choose 3 answers. Match any 2.')).toBeTruthy();act(()=>vi.advanceTimersByTime(3300));expect(within(guide).getByRole('heading',{name:'You found a Roamie.'})).toBeTruthy();act(()=>vi.advanceTimersByTime(20000));expect(within(guide).getByRole('button',{name:'Bottle guide: Connect'}).getAttribute('aria-pressed')).toBe('true');fireEvent.click(within(guide).getByRole('button',{name:'Replay bottle guide'}));expect(within(guide).getByRole('heading',{name:'A postcard arrived.'})).toBeTruthy();view.unmount();expect(vi.getTimerCount()).toBe(0);
});
it('keeps reduced-motion scenes still and lets the user choose every explanation step',()=>{
 vi.useFakeTimers();motion(true);render(<BottleDiscoveryGuide avatar="sprout"/>);act(()=>vi.advanceTimersByTime(20000));expect(screen.getByRole('heading',{name:'A postcard arrived.'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Bottle guide: Answer'}));expect(screen.getByRole('heading',{name:'Answer 3 questions.'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Bottle guide: Connect'}));expect(screen.getByRole('heading',{name:'You found a Roamie.'})).toBeTruthy();expect(screen.getByRole('region',{name:'How bottles work'}).getAttribute('data-reduced')).toBe('true');fireEvent.click(screen.getByRole('button',{name:'Replay bottle guide'}));expect(screen.getByRole('heading',{name:'A postcard arrived.'})).toBeTruthy();
});
