import {palSummaries} from './pal-loop.ts';
import {countryById} from './countries.ts';
import {normalizedPlaceText} from './map-links.ts';
import type {PlaceDraft} from './place-checkins.ts';
import type {PreviewState} from './preview.ts';

type PlaceRegion=Pick<PlaceDraft,'location'>&{peerId?:string};
/** Connected pals associated with this city, without inferring live proximity. */
export function palsForPlace(state:PreviewState,place:PlaceRegion) {
  const city=normalizedPlaceText(place.location.city),country=normalizedPlaceText(place.location.country),code=place.location.countryCode?.toUpperCase();
  return palSummaries(state).filter(pal=>{
    const home=countryById(pal.countryId);
    return normalizedPlaceText(pal.city)===city&&!!home&&
      (normalizedPlaceText(home.name)===country||home.id.toLowerCase()===country||home.id===code);
  }).sort((a,b)=>Number(b.id===place.peerId)-Number(a.id===place.peerId)||a.alias.localeCompare(b.alias));
}
