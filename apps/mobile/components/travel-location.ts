import {requireOptionalNativeModule} from 'expo';
import type {CityEvidence} from '@rymzi/core';
export async function requestTravelLocation():Promise<CityEvidence>{
 if(!requireOptionalNativeModule('ExpoLocation'))throw new Error('Location needs an updated app build.');
 const L=await import('expo-location'),permission=await L.requestForegroundPermissionsAsync();
 if(!permission.granted)throw new Error('Allow location to check in when you arrive.');
 if(!await L.hasServicesEnabledAsync())throw new Error('Turn on Location Services to check in.');
 const timed=<T,>(promise:Promise<T>)=>new Promise<T>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Location took too long. Please try again.')),20000);promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
 const p=await timed(L.getCurrentPositionAsync({accuracy:L.Accuracy.High}));
 return {source:'device',latitude:p.coords.latitude,longitude:p.coords.longitude,observedAt:p.timestamp,accuracy:p.coords.accuracy??Infinity};
}
