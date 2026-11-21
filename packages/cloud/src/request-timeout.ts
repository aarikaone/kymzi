export const CATALOGUE_REQUEST_TIMEOUT_MS=15000;
/** Firestore Lite cannot cancel fetches; ignore late results after this deadline. */
export function withRequestTimeout<T>(request:Promise<T>):Promise<T>{
 return new Promise<T>((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Kymzi request timed out. Try again.')),CATALOGUE_REQUEST_TIMEOUT_MS);
  request.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
 });
}
