import {sharedMapPlaces,publishMapsPlace} from './place-contributions.ts';
import {placeCheckInFeed,isPlaceFavorite,type PlaceDraft} from './place-checkins.ts';
import {normalizedPlaceText} from './map-links.ts';
import {palFor} from './pal-loop.ts';
import type {PreviewState} from './preview.ts';
export function publishPlaceToPal(state:PreviewState,draft:PlaceDraft,palId:string,now=new Date()){
 if(!palFor(state,palId))throw new Error('This pal is unavailable.');
 if(!draft.maps)throw new Error('Add a place link from Maps.');
 const key=(p:PlaceDraft)=>[p.name,p.location.city,p.location.country].map(normalizedPlaceText).join('|');
 const existing=sharedMapPlaces(state).find(p=>p.maps?.identity===draft.maps?.identity||key(p)===key(draft));
 const next=existing?state:publishMapsPlace(state,draft,now),id=existing?.id??draft.id,journal=next.placeJournal!;
 return {...next,placeJournal:{...journal,entries:journal.entries.map(p=>p.id===id?{...p,sharedWith:[...new Set([...(p.sharedWith??[]),palId])]}:p)}};
}
export function palPlaceSwap(state:PreviewState,palId:string,now=new Date()){
 const pal=palFor(state,palId);if(!pal)return null;
 const incoming=placeCheckInFeed(state,pal.countryId,now).filter(p=>p.peerId===palId),outgoing=sharedMapPlaces(state).filter(p=>p.sharedWith?.includes(palId)),received=new Set((state.placeJournal?.receivedFavs??[]).filter(e=>e.active&&e.palId===palId).map(e=>e.placeId));
 const route=[...incoming.filter(p=>isPlaceFavorite(state,p.id)),...outgoing.filter(p=>received.has(p.id)&&normalizedPlaceText(p.location.city)===normalizedPlaceText(pal.city))].slice(0,3);
 return {pal,incoming,outgoing,route};
}
