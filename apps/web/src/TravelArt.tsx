import {cityGuideSVG,travelCityById,type TravelCityId,type TravelPlace} from '@rymzi/core';
import {useCatalogueImage} from '@rymzi/cloud';
import {RemoteImage} from './RemoteImage';
import './world-art.css';
function RemoteGuide({kind,id,label,eager=false}:{kind:'city'|'place';id:string;label:string;eager?:boolean}){
 const {image,loading,error,retry}=useCatalogueImage(kind,id);
 return <RemoteImage url={image?.url} label={label} className="world-generated-art" lazy={!eager} loading={loading} error={error} onRetry={retry} placeholder={<span className="world-guide-art" aria-hidden="true" dangerouslySetInnerHTML={{__html:cityGuideSVG(`${kind}:${id}`)}}/>}/>;
}
export function TravelCityArt({cityId,eager=false}:{cityId:TravelCityId;eager?:boolean}){const city=travelCityById(cityId);return city?<span className="travel-city-art"><RemoteGuide key={cityId} kind="city" id={cityId} eager={eager} label={`${city.city} guide illustration`}/></span>:null;}
export function GuidePlaceArt({place,eager=false}:{place:TravelPlace;eager?:boolean}){return <RemoteGuide key={place.id} kind="place" id={place.id} eager={eager} label={`Guide illustration for ${place.name}`}/>;}
