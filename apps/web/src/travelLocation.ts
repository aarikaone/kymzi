import type {CityEvidence} from '@rymzi/core';
export async function requestTravelLocation():Promise<CityEvidence>{
 if(!navigator.geolocation)throw new Error('Location is unavailable on this device.');
 const p=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,maximumAge:0,timeout:20000}));
 return {source:'device',latitude:p.coords.latitude,longitude:p.coords.longitude,observedAt:p.timestamp,accuracy:p.coords.accuracy};
}
