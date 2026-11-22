import {useContext,useState} from 'react';
import {travelCityForPlace,type TravelCity} from '@rymzi/core';
import {CityPlayContext} from './CityPlayCards';
import {GuidePlaceArt} from './TravelArt';
import {CitySheet} from './TravelSetup';
import {useCityPlaces} from './useCityPlaces';

function SavedCity({city,ids,onOpen}:{city:TravelCity;ids:string[];onOpen:(id:string)=>void}){
 const guide=useCityPlaces(city.id);
 return <section className="saved-guide-city" aria-label={`Saved places in ${city.city}`}><h3 className="page-heading">{city.city}<span>{ids.length}</span></h3>{guide.loading&&<p role="status">Loading saved places…</p>}{guide.error&&<button onClick={guide.retry}>Retry places</button>}<div>{guide.places.filter(p=>ids.includes(p.id)).map(place=><article key={place.id}><GuidePlaceArt place={place}/><span><strong>{place.name}</strong><small>{place.kind}</small></span><button aria-label={`Open saved ${place.name}`} onClick={()=>onOpen(place.id)}/></article>)}</div></section>;
}
export function SavedGuidePlaces(){
 const play=useContext(CityPlayContext),[opened,setOpened]=useState<string|null>(null),[limit,setLimit]=useState(12),groups=new Map<string,{city:TravelCity;ids:string[]}>();
 for(const id of play?.savedPlaces??[]){const city=travelCityForPlace(id);if(!city)continue;const entry=groups.get(city.id)??{city,ids:[]};entry.ids.push(id);groups.set(city.id,entry);}
 if(!groups.size)return null;
 return <div className="saved-guide-places">{[...groups.values()].slice(0,limit).map(({city,ids})=><SavedCity key={city.id} city={city} ids={ids} onOpen={setOpened}/>)}{groups.size>limit&&<button className="travel-quiet" onClick={()=>setLimit(n=>n+12)}>More saved cities</button>}<CitySheet cityId={opened?travelCityForPlace(opened)?.id??null:null} initialPlaceId={opened??undefined} onClose={()=>setOpened(null)}/></div>;
}
