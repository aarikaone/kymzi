import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {RemoteImage} from './RemoteImage';
import {TravelSetup} from './TravelSetup';
const url='https://images.endpoints.kymzi-f1e9d.cloud.goog/images/cities/test.jpg';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});

it('ends a stalled download and lets retry load the image without opening its parent',async()=>{
 vi.useFakeTimers();const parent=vi.fn();render(<div onClick={parent}><RemoteImage url={url} label="City"/></div>);
 expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');
 await act(async()=>{await vi.advanceTimersByTimeAsync(15000);});
 expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');expect(document.querySelector('.artwork-loading-cover i')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Retry image: City'}));expect(parent).not.toHaveBeenCalled();
 expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');const image=document.querySelector('img')!;expect(image.getAttribute('src')).toBe(url);
 fireEvent.load(image);await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');expect(screen.queryByRole('button')).toBeNull();
});
it('recognizes a cached bitmap even when the browser does not send another load event',async()=>{
 vi.useFakeTimers();vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true);vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(640);
 const view=render(<RemoteImage url={url} label="City"/>);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');
 view.rerender(<RemoteImage url={url} label="City"/>);await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});expect(screen.queryByRole('button')).toBeNull();expect(document.querySelector('.artwork-loading-cover')).toBeNull();
});
it('does not start a lazy image or its timeout until the image enters the viewport',async()=>{
 vi.useFakeTimers();let intersect:IntersectionObserverCallback|undefined;
 vi.stubGlobal('IntersectionObserver',class{constructor(callback:IntersectionObserverCallback){intersect=callback;}observe(){}disconnect(){}});
 render(<RemoteImage url={url} label="City"/>);expect(document.querySelector('img')).toBeNull();
 await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});expect(screen.queryByRole('button')).toBeNull();expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');
 act(()=>intersect!([{isIntersecting:true} as IntersectionObserverEntry],{} as IntersectionObserver));expect(document.querySelector('img')).toBeTruthy();expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');
 fireEvent.load(document.querySelector('img')!);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');
});
it('starts fresh when the URL changes and ignores events from the previous bitmap',()=>{
 const view=render(<RemoteImage url={url} label="City"/>),old=document.querySelector('img')!;fireEvent.load(old);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');
 view.rerender(<RemoteImage url={url+'?version=2'} label="City"/>);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');fireEvent.error(old);expect(screen.queryByRole('button')).toBeNull();
 fireEvent.load(document.querySelector('img')!);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');
});

it('requests visited-city thumbnails even when the visibility observer never fires',()=>{
 vi.stubGlobal('IntersectionObserver',class{observe(){}disconnect(){}});
 render(<TravelSetup onOpenCities={()=>{}} onOpenCity={()=>{}} onSelectionDone={()=>{}} onComplete={vi.fn()} onBack={vi.fn()}/>);
 const frame=screen.getByRole('img',{name:'Tokyo guide illustration'}),image=frame.querySelector('img');expect(image).toBeTruthy();expect(image?.getAttribute('loading')).toBe('eager');expect(image?.getAttribute('src')).toContain('/images/places/jp-1-');fireEvent.load(image!);expect(frame.getAttribute('aria-busy')).toBe('false');
});
it('shows a completed decode without waiting for a missing load event',async()=>{
 const prototype=HTMLImageElement.prototype,original=Object.getOwnPropertyDescriptor(prototype,'decode');let resolveDecode:(()=>void)|undefined;
 Object.defineProperty(prototype,'decode',{configurable:true,value:()=>new Promise<void>(resolve=>{resolveDecode=resolve;})});
 try{render(<RemoteImage url={url} label="Decoded city" lazy={false}/>);const image=document.querySelector('img')!;Object.defineProperty(image,'naturalWidth',{configurable:true,value:640});expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');await act(async()=>{resolveDecode!();await Promise.resolve();});expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');expect(document.querySelector('.artwork-loading-cover')).toBeNull();}
 finally{if(original)Object.defineProperty(prototype,'decode',original);else Reflect.deleteProperty(prototype,'decode');}
});
