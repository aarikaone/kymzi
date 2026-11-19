import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {act,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,galleryPhotoFeed,type PreviewState} from '@rymzi/core';
import App from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-19T05:00:00Z');
let observed:Element[],callback:IntersectionObserverCallback,options:IntersectionObserverInit|undefined;
beforeEach(()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);observed=[];
 vi.stubGlobal('IntersectionObserver',class {constructor(cb:IntersectionObserverCallback,opts?:IntersectionObserverInit){callback=cb;options=opts;}observe(element:Element){observed.push(element);}disconnect(){}unobserve(){}});
 const state=seedGlobalPals(simulatePalUnlock({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(NOW)},NOW),NOW,'Asia/Kolkata');localStorage.setItem(KEY,JSON.stringify(state));window.history.replaceState(null,'','/#/home');
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
function saved(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
it('keeps the pal rail, arrival invitation and all photo cards in one page and marks only photos entering that page viewport seen',()=>{
 render(<App/>);const feed=screen.getByRole('region',{name:'City photo feed'}),main=feed.closest('.app-main')!,cards=within(feed).getAllByRole('article'),items=galleryPhotoFeed(saved(),undefined,NOW);
 expect(cards).toHaveLength(items.length);expect(cards.every(card=>!card.hasAttribute('inert'))).toBe(true);expect(main.contains(screen.getByLabelText('Connected pals'))).toBe(true);expect(main.contains(screen.getByRole('group',{name:'Upcoming visit to your city'}))).toBe(true);expect(options?.root).toBe(main);expect(observed).toHaveLength(items.length);expect(saved().photos.seenIds).toHaveLength(0);expect(screen.queryByRole('button',{name:'Next photo'})).toBeNull();
 act(()=>callback([{target:cards[1],isIntersecting:true,intersectionRatio:.6}] as unknown as IntersectionObserverEntry[],{} as IntersectionObserver));expect(saved().photos.seenIds).toEqual([items[1].id]);
 act(()=>callback([{target:cards[2],isIntersecting:false,intersectionRatio:0}] as unknown as IntersectionObserverEntry[],{} as IntersectionObserver));expect(saved().photos.seenIds).toEqual([items[1].id]);
});
it('keeps photo saves and city filters usable in the continuous home feed',async()=>{
 const u=userEvent.setup();render(<App/>);const cards=screen.getAllByRole('article');await u.click(within(cards[1]).getByRole('button',{name:'Favorite photo'}));expect(saved().photos.savedIds).toHaveLength(1);await u.click(screen.getByRole('button',{name:'Favorite photos'}));expect(screen.getAllByRole('article')).toHaveLength(1);expect(screen.getByRole('button',{name:'Remove from favorites'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Remove from favorites'}));expect(screen.getByRole('heading',{name:'Keep a little of their world.'})).toBeTruthy();expect(screen.getByRole('group',{name:'Upcoming visit to your city'})).toBeTruthy();await u.click(screen.getByRole('button',{name:'Browse moments'}));expect(screen.getAllByRole('article').length).toBeGreaterThan(1);
});
