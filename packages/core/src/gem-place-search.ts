import {normalizedPlaceText,parseMapsPlaceLink} from './map-links.ts';
import {cleanPlaceDraft,type PlaceDraft,type PlacePhoto} from './place-checkins.ts';
import type {PlaceCategoryId} from './place-categories.ts';

export type GemSearchPlace={id:string;name:string;address:string;city:string;country:string;latitude?:number;longitude?:number;categoryId:PlaceCategoryId;sampleId:string;sampleKind:'city'|'place';mapsUrl:string};
type Row=[id:string,name:string,address:string,city:string,country:string,latitude:number,longitude:number,category:PlaceCategoryId,sampleId:string];
// A local Places-style search adapter. No Google request or billed lookup is made.
const rows:Row[]=[
 ['cubbon','Cubbon Park','Kasturba Road, Bengaluru, Karnataka 560001','Bengaluru','India',12.975,77.59333,'park','Q3633776'],
 ['lalbagh','Lalbagh Botanical Garden','Mavalli, Bengaluru, Karnataka 560004','Bengaluru','India',12.95,77.59,'garden','Q200711'],
 ['freedom','Freedom Park','Seshadri Road, Gandhi Nagar, Bengaluru 560009','Bengaluru','India',12.97727,77.58185,'park','Q5500576'],
 ['hawa','Hawa Mahal','Hawa Mahal Road, Badi Choupad, Jaipur 302002','Jaipur','India',26.9239,75.8267,'landmark','Q836531'],
 ['albert','Albert Hall Museum','Ram Niwas Garden, Ashok Nagar, Jaipur 302004','Jaipur','India',26.9117,75.8195,'museum','Q4710411'],
 ['ueno','Ueno Park','Uenokoen, Taito City, Tokyo 110-0007','Tokyo','Japan',35.7148,139.773,'park','jp-4'],
 ['senso','Sensō-ji','2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032','Tokyo','Japan',35.7148,139.7967,'temple','jp-1'],
 ['camden','Camden Market','Camden Lock Place, London NW1 8AF','London','United Kingdom',51.5415,-.1461,'market','gb-4'],
 ['hyde','Hyde Park','Hyde Park, London W2 2UH','London','United Kingdom',51.5073,-.1657,'park','gb-3'],
 ['montmartre','Montmartre','Place du Tertre, 75018 Paris','Paris','France',48.8865,2.3409,'street','fr-3'],
 ['luxembourg','Luxembourg Gardens','Rue de Médicis, 75006 Paris','Paris','France',48.8462,2.3372,'garden','fr-4'],
 ['botanic','Singapore Botanic Gardens','1 Cluny Road, Singapore 259569','Singapore','Singapore',1.3138,103.8159,'garden','sg-3'],
 ['alfama','Alfama','Largo das Portas do Sol, 1100-411 Lisboa','Lisbon','Portugal',38.711,-9.1305,'street','pt-3'],
 ['central','Central Park','Central Park, New York, NY 10022','New York','United States',40.7829,-73.9654,'park','us-1'],
];
export const GEM_SEARCH_PLACES:readonly GemSearchPlace[]=rows.map(([id,name,address,city,country,latitude,longitude,categoryId,sampleId])=>({id,name,address,city,country,latitude,longitude,categoryId,sampleId,sampleKind:'place',mapsUrl:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+', '+city+', '+country)}`}));
export function searchGemPlaces(query:string){
 const words=normalizedPlaceText(query).split(' ').filter(Boolean);
 return GEM_SEARCH_PLACES.filter(p=>words.every(w=>normalizedPlaceText([p.name,p.address,p.city,p.country,p.categoryId,p.city==='Bengaluru'?'Bangalore':''].join(' ')).includes(w))).slice(0,8);
}
export function gemPlaceFromMaps(text:string):GemSearchPlace{
 const maps=parseMapsPlaceLink(text),match=GEM_SEARCH_PLACES.find(p=>normalizedPlaceText(p.name)===normalizedPlaceText(maps.nameHint??''));
 if(match)return {...match,mapsUrl:maps.url};
 return {id:maps.identity,name:maps.nameHint??'',address:'',city:maps.cityHint??'',country:maps.countryHint??'',categoryId:'attraction',sampleId:'JP',sampleKind:'city',mapsUrl:maps.url};
}
export function makePhotoGemDraft(place:GemSearchPlace,photos:readonly PlacePhoto[],tip='',id=`gem-${Date.now()}-${Math.random().toString(36).slice(2,10)}`):PlaceDraft{
 if(!place.name.trim()||!place.city.trim()||!place.country.trim()||!place.address.trim())throw new Error('Add the place name, address, city and country.');
 if(!photos.length)throw new Error('Replace the sample with your own photo.');
 return cleanPlaceDraft({id,name:place.name,categoryId:place.categoryId,location:{city:place.city,country:place.country,address:place.address,source:'maps',...(place.latitude!==undefined&&place.longitude!==undefined?{placePin:{latitude:place.latitude,longitude:place.longitude}}:{})},maps:parseMapsPlaceLink(place.mapsUrl),photos:[...photos],...(tip.trim()?{tip:tip.trim()}:{})});
}
