import {cleanCityJpeg} from './photos.ts';
import {connections} from './social.ts';
import type {AgeBand,ProfilePhoto} from './types.ts';
import type {PreviewState} from './preview.ts';
export const PAL_PHOTO_MATCHES=3;
export const MAX_PROFILE_PHOTO_LENGTH=120_000;
/** Only compact, pixel-reencoded JPEGs belong in profile storage. Never a file URL or remote URL. */
export function makeProfilePhoto(image:string,ageBand:AgeBand,now=new Date()):ProfilePhoto{
 if(typeof image!=='string'||image.length>MAX_PROFILE_PHOTO_LENGTH)throw new Error('Choose a smaller profile photo.');
 try{return {image:cleanCityJpeg(image),ageBand,uploadedAt:now.toISOString()};}catch{throw new Error('This photo could not be read. Choose another image.');}
}
export function readProfilePhoto(value:unknown,band:AgeBand):ProfilePhoto|undefined{
 const p=value as Partial<ProfilePhoto>|null;
 if(!p||p.ageBand!==band||typeof p.image!=='string'||typeof p.uploadedAt!=='string'||!Number.isFinite(Date.parse(p.uploadedAt)))return;
 try{return makeProfilePhoto(p.image,band,new Date(p.uploadedAt));}catch{return;}
}
/** Outgoing photo eligibility is per pal, not a total across all connections.
 * The local prototype does not deliver this image to another device. */
export function profilePhotoForPal(state:PreviewState,peerId:string):ProfilePhoto|undefined{
 const profile=state.profile;if(!profile||profile.ageBand==='10-12')return;
 const c=connections(state.social,profile.ageBand,state.blocked).find(c=>c.peer.id===peerId);
 return c&&c.matches>=PAL_PHOTO_MATCHES?readProfilePhoto(profile.photo,profile.ageBand):undefined;
}
