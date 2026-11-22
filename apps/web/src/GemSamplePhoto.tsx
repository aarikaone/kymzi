import {useCatalogueImage} from '@rymzi/cloud';
import type {GemSearchPlace} from '@rymzi/core';
import {RemoteImage} from './RemoteImage';
export function GemSamplePhoto({place}:{place:GemSearchPlace}){
 const {image,loading,error,retry}=useCatalogueImage(place.sampleKind,place.sampleId);
 return <RemoteImage url={image?.url} label={`Sample image of ${place.name}`} lazy={false} allowRetry={false} loading={loading} error={error} onRetry={retry}/>;
}
