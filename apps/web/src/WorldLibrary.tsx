import {useState} from 'react';
import {TRAVEL_CITIES,WORLD_CATALOGUE,searchTravelCities,type TravelCityId,type TravelCitySort,type WorldRegion} from '@rymzi/core';
import {CitySheet} from './TravelSetup';
import {TravelCityArt} from './TravelArt';
import {Icon} from './icons';
import './world-library.css';
const regions:{id:WorldRegion|'';label:string}[]=[{id:'',label:'Worldwide'},{id:'AS',label:'Asia'},{id:'EU',label:'Europe'},{id:'NA',label:'North America'},{id:'SA',label:'South America'},{id:'AF',label:'Africa'},{id:'OC',label:'Oceania'}];
export function WorldLibrary(){
 const [query,setQuery]=useState(''),[limit,setLimit]=useState(36),[city,setCity]=useState<TravelCityId|null>(null),[region,setRegion]=useState<WorldRegion|''>(''),[sort,setSort]=useState<TravelCitySort>('popular');
 const matches=searchTravelCities(query,TRAVEL_CITIES.length,region||undefined,sort),visible=matches.slice(0,limit);
 return <div className="world-library">
  <div className="world-library-summary"><span><strong>{WORLD_CATALOGUE.cities.toLocaleString('en')}</strong>cities</span><span><strong>{WORLD_CATALOGUE.places.toLocaleString('en')}</strong>places</span></div>
  <label className="travel-search"><Icon name="search" size={18}/><input aria-label="Search world cities" placeholder="A city, region or country" value={query} onChange={e=>{setQuery(e.target.value);setLimit(36);}}/></label>
  <div className="world-discovery-controls"><select aria-label="Explore region" value={region} onChange={e=>{setRegion(e.target.value as WorldRegion|'');setLimit(36);}}>{regions.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select><div role="group" aria-label="Sort destinations"><button aria-pressed={sort==='popular'} aria-describedby="world-popularity-method" onClick={()=>{setSort('popular');setLimit(36);}}>Popular</button><button aria-pressed={sort==='name'} onClick={()=>{setSort('name');setLimit(36);}}>A–Z</button></div></div>
  <span id="world-popularity-method" className="visually-hidden">Travel interest based on Wikidata and travel-guide coverage, rather than visitor counts or user ratings.</span>
  <div className="world-library-grid">{visible.map(c=><button key={c.id} aria-label={`Explore ${c.city}, ${c.name} guide`} onClick={()=>setCity(c.id)}><TravelCityArt cityId={c.id}/><span><strong>{c.city}</strong><small>{c.flag} {c.name}</small><small>{c.region}</small></span><i>{c.placeIds.length} places</i></button>)}</div>
  {matches.length>visible.length&&<button className="world-more-cities" onClick={()=>setLimit(n=>n+36)}>More cities<Icon name="plus" size={18}/></button>}{!matches.length&&<p className="world-city-empty">Try another city or region.</p>}
  <p className="world-data-credit">City data: <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Places: <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata CC0</a></p><CitySheet cityId={city} onClose={()=>setCity(null)}/>
 </div>;
}
export function CityGuideDoor({cityId}:{cityId:TravelCityId}){const [open,setOpen]=useState(false),city=TRAVEL_CITIES.find(c=>c.id===cityId);if(!city)return null;return <><button className="world-guide-door" aria-label={`Explore all ${city.placeIds.length} places in ${city.city}`} onClick={()=>setOpen(true)}><Icon name="compass" size={21}/><span>Explore all {city.placeIds.length} places</span><Icon name="arrow" size={19}/></button><CitySheet cityId={open?cityId:null} onClose={()=>setOpen(false)}/></>;}
