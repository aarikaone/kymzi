import {COUNTRIES} from './countries.ts';
import {ATTRACTIONS,attractionById} from './attractions.ts';
export const ATTRACTION_ATLASES=Array.from({length:13},(_,i)=>`atlas-${String(i+1).padStart(2,'0')}`);
export function attractionArtwork(id:string){const a=attractionById(id);if(!a)return null;const country=COUNTRIES.findIndex(c=>c.id===a.countryId),slot=Number(id.split('-').at(-1))-1;return {file:ATTRACTION_ATLASES[Math.floor(country/2)],column:slot%2,row:(country%2)*2+Math.floor(slot/2),columns:2,rows:4};}

/** Reuse the generated feed artwork until a check-in has its own OpenAI image. */
export function placeCoverArtwork(place:{name:string;categoryId:string;artworkId?:string;location?:{city:string;country?:string;countryCode?:string}}):string{
 if(place.artworkId&&attractionById(place.artworkId))return place.artworkId;
 const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const exact=ATTRACTIONS.find(a=>normalize(a.name)===normalize(place.name));
 if(exact)return exact.id;
 const kinds:Record<string,string[]>={park:['Nature','Conservation'],garden:['Nature'],trail:['Nature'],lake:['Nature','Coast'],beach:['Coast'],viewpoint:['Skyline','Nature'],museum:['Art','History','Science'],landmark:['Landmark','Skyline'],temple:['Culture','Heritage'],mall:['City life','Design'],market:['City life'],street:['City life'],cafe:['City life'],restaurant:['City life'],bookshop:['Art','Design'],cinema:['Art','City life'],arcade:['City life','Science'],sports:['Nature','City life'],station:['Architecture','City life']};
 const preferred=kinds[place.categoryId]??['Landmark','Culture'];
 const city=COUNTRIES.find(c=>normalize(c.city)===normalize(place.location?.city??''));
 const candidates=city?ATTRACTIONS.filter(a=>a.countryId===city.id):[];
 return (candidates.find(a=>preferred.includes(a.kind))??candidates[0]??ATTRACTIONS.find(a=>preferred.includes(a.kind))??ATTRACTIONS[0]).id;
}
