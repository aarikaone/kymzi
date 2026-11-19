import {AVATARS} from './index.ts';
import {PAL_PHOTO_MATCHES} from './profile-photo.ts';
import type {Profile} from './types.ts';

/** A local display nickname, not an account ID or a globally unique identifier. */
export function createSetupProfile(previous?:Profile|null,random:()=>number=Math.random):Profile{
 const name=previous?.name&&/^[1-9]\d{5}$/.test(previous.name)?previous.name:String(100000+Math.floor(random()*900000));
 const avatar=previous?.avatar??AVATARS[Math.floor(random()*AVATARS.length)].id;
 return {...previous,name,avatar,ageBand:previous?.ageBand??'16-17'};
}

/** Optional coarse location; legacy profiles need no migration or placeholder city. */
export function readProfileLocation(value:unknown):Pick<Profile,'city'|'country'>{
 if(!value||typeof value!=='object')return {};
 const profile=value as Partial<Profile>;
 const clean=(place:unknown)=>typeof place==='string'?place.normalize('NFKC').trim().replace(/\s+/g,' ').slice(0,60):'';
 const city=clean(profile.city),country=clean(profile.country);
 return {...(city?{city}:{}),...(country?{country}:{})};
}

export const PROFILE_SETUP_COPY={
 title:'Your two sides.',
 revealTitle:`Photo unlocks after ${PAL_PHOTO_MATCHES} full matches.`,
 revealDetail:'Same pal. All 3 answers, each time.',
} as const;
