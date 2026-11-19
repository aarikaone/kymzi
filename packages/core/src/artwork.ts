import {COUNTRIES} from './countries.ts';
import {attractionById} from './attractions.ts';
export const ATTRACTION_ATLASES=Array.from({length:13},(_,i)=>`atlas-${String(i+1).padStart(2,'0')}`);
export function attractionArtwork(id:string){const a=attractionById(id);if(!a)return null;const country=COUNTRIES.findIndex(c=>c.id===a.countryId),slot=Number(id.split('-').at(-1))-1;return {file:ATTRACTION_ATLASES[Math.floor(country/2)],column:slot%2,row:(country%2)*2+Math.floor(slot/2),columns:2,rows:4};}
