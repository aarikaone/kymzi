import {cityPhotoFeed,isCityPhotoSaved,toggleCityPhotoSaved} from './photos.ts';
import {countryById} from './countries.ts';
import type {PreviewState} from './preview.ts';
export type FavoritePhoto={id:string;city:string;country:string;alias:string;you:boolean;image?:string;artworkId?:string};
function homeKey(state:PreviewState,id:string){return `home-fav:${state.profile?.ageBand}:${id}`;}
/** Only currently eligible city moments and the owner's own camera photos can be collected. */
export function favoritePhotoCandidates(state:PreviewState,now=new Date()):FavoritePhoto[]{
 if(!state.profile)return [];
 const city=cityPhotoFeed(state,undefined,now).map(photo=>({id:photo.id,city:countryById(photo.countryId)!.city,country:countryById(photo.countryId)!.name,alias:photo.alias,you:photo.you,...(photo.image?{image:photo.image}:{}),...(photo.artworkId?{artworkId:photo.artworkId}:{})}));
 const home=(state.launch?.homePhotos??[]).filter(photo=>photo.ageBand===state.profile!.ageBand).map(photo=>({id:`home-photo:${photo.captureId}`,city:photo.city,country:photo.country,alias:'You',you:true,image:photo.image}));
 return [...home,...city];
}
export function isPhotoFavorite(state:PreviewState,id:string,now=new Date()):boolean{
 if(id.startsWith('home-photo:'))return (state.launch?.homePhotos??[]).some(photo=>photo.ageBand===state.profile?.ageBand&&`home-photo:${photo.captureId}`===id)&&state.photos.savedIds.includes(homeKey(state,id));
 const photo=cityPhotoFeed(state,undefined,now).find(photo=>photo.id===id);return !!photo&&isCityPhotoSaved(state,photo);
}
export function favoritePhotos(state:PreviewState,now=new Date()){const citySaved=new Set(cityPhotoFeed(state,undefined,now).filter(photo=>isCityPhotoSaved(state,photo)).map(photo=>photo.id));return favoritePhotoCandidates(state,now).filter(photo=>photo.id.startsWith('home-photo:')?state.photos.savedIds.includes(homeKey(state,photo.id)):citySaved.has(photo.id));}
export function cameraFavoriteId(state:PreviewState,captureId:string){return state.launch?.homePhotos.some(photo=>photo.captureId===captureId&&photo.ageBand===state.profile?.ageBand)?`home-photo:${captureId}`:state.photos.photos.find(photo=>photo.captureId===captureId&&photo.ageBand===state.profile?.ageBand)?.id??`home-photo:${captureId}`;}
export function togglePhotoFavorite(state:PreviewState,id:string,now=new Date()):PreviewState{
 if(!favoritePhotoCandidates(state,now).some(photo=>photo.id===id))throw new Error('This photo is unavailable.');
 if(!id.startsWith('home-photo:'))return {...state,photos:toggleCityPhotoSaved(state,id,now)};
 const key=homeKey(state,id),saved=state.photos.savedIds;return {...state,photos:{...state.photos,savedIds:saved.includes(key)?saved.filter(value=>value!==key):[...saved,key].slice(-300)}};
}
