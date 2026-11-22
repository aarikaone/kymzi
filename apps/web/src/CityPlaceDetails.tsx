import {useEffect,useRef} from 'react';
import type {TravelCity,TravelPlace} from '@rymzi/core';
import {SubpageBar} from './AppBar';

export function CityPlaceDetails({place,city,onClose}:{place:TravelPlace;city:TravelCity;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 const facts=place.details?.facts??[{label:'Place',value:place.kind},{label:'City',value:city.city},{label:'Country',value:city.name}];
 return <dialog ref={dialog} className="city-reel-details" aria-label={`About ${place.name}`} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}} onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();if(e.target===e.currentTarget&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))onClose();}}>
  <div className="city-reel-details-handle"/><SubpageBar title="About this place" backLabel="Close place details" onBack={onClose} safeArea={false}/>
  <div className="city-reel-details-scroll"><h2 className="page-heading">{place.name}</h2><p className="city-reel-details-location">{city.city} · {city.name}</p>
   <div className="city-reel-facts">{facts.map(fact=><div key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}</div>
   <div className="city-reel-description">{(place.details?.description||place.fact).split(/\n+/).filter(Boolean).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>
   {!!place.details?.credits?.length&&<details className="city-reel-credits"><summary>Text credits</summary>{place.details.credits.map(credit=><p key={credit.url}>{credit.attribution} · {credit.license}<br/><span>{credit.url}</span></p>)}</details>}
  </div>
 </dialog>;
}
