import {render,screen,fireEvent,act} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
import {AttractionImage} from './AttractionImage';
import {PerfectDayCard} from './PerfectDay';
afterEach(()=>vi.useRealTimers());
it('shows loaders on all three Perfect Day images and clears each when its own image loads',()=>{
 render(<PerfectDayCard picks={[]}/>);const images=document.querySelectorAll<HTMLElement>('.perfect-card-stops [role="img"]');expect(images).toHaveLength(3);
 for(const image of images)expect(image.getAttribute('aria-busy')).toBe('true');
 fireEvent.load(images[0].querySelector('img')!);expect(images[0].getAttribute('aria-busy')).toBe('false');expect(images[0].querySelector('.artwork-loading-cover')).toBeNull();expect(images[1].getAttribute('aria-busy')).toBe('true');
 fireEvent.load(images[1].querySelector('img')!);fireEvent.load(images[2].querySelector('img')!);expect(document.querySelectorAll('.artwork-loading-cover')).toHaveLength(0);
});
it('stops failed or stalled artwork loaders and retries only the CDN source',async()=>{
 vi.useFakeTimers();render(<AttractionImage id="jp-1" showLoader/>);const url=document.querySelector('img')!.getAttribute('src');
 fireEvent.error(document.querySelector('img')!);expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('false');expect(document.querySelector('img')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Retry image: Illustration of Sensō-ji'}));expect(document.querySelector('img')!.getAttribute('src')).toBe(url);
 render(<AttractionImage id="fr-1" showLoader/>);await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
});
