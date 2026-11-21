import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect,it} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {worldArtAsset,searchTravelCities} from '@rymzi/core';
import {TravelCityArt} from './TravelArt';
import {AttractionImage} from './AttractionImage';

it('accounts for every city and place without marking missing bitmaps as generated',()=>{
 const root=resolve(process.cwd(),'../..'),manifest=JSON.parse(readFileSync(resolve(root,'content/world-art/manifest.json'),'utf8'));
 expect(manifest.totalSlots).toBe(21546);expect(manifest.cities).toBe(1026);expect(manifest.places).toBe(20520);
 expect(manifest.existing+manifest.generated+manifest.missing).toBe(manifest.totalSlots);
 expect(new Set(manifest.entries.map((e:{key:string})=>e.key)).size).toBe(manifest.totalSlots);
 const groups=new Map<string,{city:number;place:number}>();
 for(const entry of manifest.entries){
  const group=groups.get(entry.cityId)??{city:0,place:0};group[entry.kind as 'city'|'place']++;groups.set(entry.cityId,group);
  expect(entry.name).toBeTruthy();expect(entry.sourceUrl).toMatch(/^https:\/\//);expect(entry.relativePath).toMatch(/^(cities|places)\/[A-Za-z0-9_-]+\.jpg$/);
 }
 expect(groups.size).toBe(1026);for(const group of groups.values())expect(group).toEqual({city:1,place:20});
 expect(manifest.entries.filter((e:{status:string})=>e.status==='missing')).toHaveLength(manifest.missing);
});

it('shows the database city image with a loader and reveals it when loaded',()=>{
 const city=searchTravelCities('Bengaluru')[0],art=worldArtAsset('city',city.id)!;
 const {container}=render(<TravelCityArt cityId={city.id}/>),frame=screen.getByRole('img',{name:'Bengaluru guide illustration'});
 expect(frame.getAttribute('aria-busy')).toBe('true');
 const bitmap=container.querySelector('img')!;expect(bitmap.getAttribute('src')).toBe(art.cdnUrl);expect(art.cdnUrl).toMatch(/^https:\/\/images\.endpoints\.kymzi-f1e9d\.cloud\.goog\/images\/cities\/1277333-[a-f0-9]{16}\.jpg$/);
 fireEvent.load(bitmap);expect(frame.getAttribute('aria-busy')).toBe('false');
});
it('retries the same remote city image without falling back to a local bitmap',()=>{
 const city=searchTravelCities('Bengaluru')[0],{container}=render(<TravelCityArt cityId={city.id}/>),url=container.querySelector('img')!.getAttribute('src');
 fireEvent.error(container.querySelector('img')!);expect(container.querySelector('img')).toBeNull();
 expect(screen.getByRole('img',{name:'Bengaluru guide illustration'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Retry image: Bengaluru guide illustration'}));expect(container.querySelector('img')!.getAttribute('src')).toBe(url);
});
it('loads the original city guide artwork from its standalone CDN file',()=>{
 expect(worldArtAsset('city','JP')!.reviewStatus).toBe('existing-guide-art');const {container}=render(<TravelCityArt cityId="JP"/>);
 expect(screen.getByRole('img',{name:'Tokyo guide illustration'})).toBeTruthy();expect(container.querySelector('img')!.getAttribute('src')).toContain('/images/places/jp-1-');
});
it('loads and retries an individual attraction without requesting a local atlas',()=>{
 const {container}=render(<AttractionImage id="br-3" showLoader/>),frame=container.querySelector('.attraction-image')!,picture=container.querySelector('img')!,url=picture.getAttribute('src');
 expect(url).toMatch(/^https:\/\/images\.endpoints\.kymzi-f1e9d\.cloud\.goog\/images\/places\/br-3-[a-f0-9]{16}\.jpg$/);
 fireEvent.error(picture);expect(container.querySelector('img')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Retry image: Illustration of Copacabana'}));
 expect(container.querySelector('img')!.getAttribute('src')).toBe(url);
 fireEvent.load(container.querySelector('img')!);expect(frame.getAttribute('aria-busy')).toBe('false');
});
