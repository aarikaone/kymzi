import {attractionById} from '@rymzi/core';
import {useCatalogueImage} from '@rymzi/cloud';
import {RemoteImage} from './RemoteImage';
type Props={id:string;className?:string;showLoader?:boolean};
export function AttractionImage({id,className='',showLoader=false}:Props){
 const {image,loading,error,retry}=useCatalogueImage('place',id),place=attractionById(id);if(!place)return null;
 return <RemoteImage url={image?.url} className={`attraction-image ${className}`} label={`Illustration of ${place.name}`} unavailableLabel={`Illustration unavailable: ${place.name}`} loading={loading} error={error} onRetry={retry} showLoader={showLoader}/>;
}
