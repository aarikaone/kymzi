import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const sdk=vi.hoisted(()=>({getDoc:vi.fn(),getDocs:vi.fn(),initializeApp:vi.fn(()=>({name:'kymzi'}))}));
vi.mock('firebase/app',()=>({getApps:()=>[],initializeApp:sdk.initializeApp}));
vi.mock('firebase/firestore/lite',()=>({
 getFirestore:()=>({}),doc:(_db:unknown,...path:string[])=>({path:path.join('/')}),collection:(_db:unknown,...path:string[])=>({path:path.join('/')}),
 getDoc:sdk.getDoc,getDocs:sdk.getDocs,documentId:()=> '__name__',orderBy:(key:string)=>({orderBy:key}),limit:(count:number)=>({limit:count}),startAfter:(cursor:unknown)=>({startAfter:cursor}),query:(ref:unknown,...constraints:unknown[])=>({...ref as object,constraints})
}));
const origin='https://kymzi-f1e9d.web.app',imageUrl=origin+'/images/places/test-1234567890abcdef.jpg';
const snapshot=(id:string,data:Record<string,unknown>)=>({id,data:()=>data});
const city=snapshot('JP',{city:'Tokyo',country:'Japan',countryCode:'JP',continent:'AS',region:'Tokyo',geonameId:1850147,latitude:35.68,longitude:139.74,timeZone:'Asia/Tokyo',population:9733276,placeIds:['jp-1','jp-2'],aliases:['Edo'],citySourceUrl:'https://www.geonames.org/1850147',image:{path:'images/places/test-1234567890abcdef.jpg',appReady:true,width:512,height:384},imageUrl});
beforeEach(()=>{
 vi.resetModules();sdk.getDoc.mockReset();sdk.getDocs.mockReset();
 sdk.getDoc.mockResolvedValue({exists:()=>true,data:()=>({publicImages:{'/avatars/cloud.webp':origin+'/images/avatars/cloud-1234567890abcdef.webp','/bad.webp':'http://localhost/private.png'}})});
 sdk.getDocs.mockImplementation(async(ref:{path:string})=>{
  const docs=ref.path==='cities'?[city]:[
   snapshot('jp-1',{name:'Sensō-ji',kind:'Culture',description:'A temple in Asakusa.',source:'Kymzi curated guide',question:'What should I see?',sourceUrl:'https://example.com/temple',mapsUrl:'https://maps.google.com/',countryCode:'JP',image:city.data().image,imageUrl}),
   snapshot('jp-2',{name:'Garden',kind:'Nature',description:'A garden.',source:'Wikidata',sourceUrl:'https://www.wikidata.org/wiki/Q123',image:null,imageUrl:null})
  ];return {docs,size:docs.length};
 });
});
it('bootstraps from the configured project, then lazily loads and deduplicates city attractions',async()=>{
 const cloud=await import('@rymzi/cloud'),core=await import('@rymzi/core');await cloud.connectKymzi();
 expect(sdk.initializeApp).toHaveBeenCalledWith(expect.objectContaining({projectId:'kymzi-f1e9d'}),'kymzi');
 expect(sdk.getDoc).toHaveBeenCalledWith({path:'appConfig/public'});expect(sdk.getDocs).toHaveBeenCalledTimes(1);
 expect(core.searchTravelCities('Edo')[0].city).toBe('Tokyo');expect(core.catalogueCdnImage('city','JP')?.url).toBe(imageUrl);
 const first=core.loadTravelCityPlaces('JP'),second=core.loadTravelCityPlaces('JP');expect(first).toBe(second);
 const places=await first;expect(places.map(place=>place.name)).toEqual(['Sensō-ji','Garden']);expect(places[0].categoryId).toBe('temple');
 expect(sdk.getDocs).toHaveBeenLastCalledWith({path:'cities/JP/attractions'});expect(sdk.getDocs).toHaveBeenCalledTimes(2);
 expect(core.catalogueCdnImage('place','jp-1')?.url).toBe(imageUrl);expect(core.catalogueImageKnown('place','jp-2')).toBe(true);expect(core.catalogueCdnImage('place','jp-2')).toBeUndefined();
 expect(core.publicCdnImage('/avatars/cloud.webp')).toContain('/images/avatars/');expect(core.publicCdnImage('/bad.webp')).toBe('');expect(core.publicCdnImage('/unavailable.webp')).toBe('');
});
it('retries a failed connection without silently loading the bundled catalogue',async()=>{
 const cloud=await import('@rymzi/cloud');sdk.getDocs.mockRejectedValueOnce(new Error('offline'));
 await expect(cloud.connectKymzi()).rejects.toThrow('offline');await expect(cloud.connectKymzi()).resolves.toBeUndefined();expect(sdk.getDocs).toHaveBeenCalledTimes(2);
});
it('retries failed attraction metadata and preserves the review status of unapproved artwork',async()=>{
 const cloud=await import('@rymzi/cloud'),core=await import('@rymzi/core');await cloud.connectKymzi();
 sdk.getDocs.mockRejectedValueOnce(new Error('offline'));await expect(core.loadTravelCityPlaces('JP')).rejects.toThrow('offline');
 const place=snapshot('jp-1',{name:'Sensō-ji',kind:'Culture',source:'Kymzi curated guide',image:{...city.data().image as object,appReady:false,reviewStatus:'needs-landmark-review'},imageUrl});
 sdk.getDocs.mockResolvedValueOnce({docs:[place],size:1});expect(await core.loadTravelCityPlaces('JP')).toHaveLength(1);expect(core.catalogueCdnImage('place','jp-1')).toBeUndefined();
});

it('prefers Storage-backed CDN URLs and retains compatibility with older records',async()=>{
 const cloud=await import('@rymzi/cloud'),core=await import('@rymzi/core'),cdn='https://images.endpoints.kymzi-f1e9d.cloud.goog';
 sdk.getDoc.mockResolvedValueOnce({exists:()=>true,data:()=>({cdnOrigin:cdn,publicImages:{'/avatars/cloud.webp':origin+'/images/avatars/legacy.webp'},publicCdnImages:{'/avatars/cloud.webp':cdn+'/images/avatars/cloud.webp'}})});
 sdk.getDocs.mockResolvedValueOnce({docs:[snapshot('JP',{...city.data(),cdnImageUrl:cdn+'/images/places/temple.jpg'})],size:1});
 await cloud.connectKymzi();expect(core.publicCdnImage('/avatars/cloud.webp')).toBe(cdn+'/images/avatars/cloud.webp');expect(core.catalogueCdnImage('city','JP')?.url).toBe(cdn+'/images/places/temple.jpg');
 expect(core.isCatalogueImageUrl(origin+'/images/legacy.webp')).toBe(true);expect(core.isCatalogueImageUrl('https://evil.example/images/cloud.webp')).toBe(false);expect(core.isCatalogueImageUrl(cdn+'.evil.example/images/cloud.webp')).toBe(false);
});

afterEach(()=>vi.useRealTimers());
it('times out stalled attraction metadata, ignores its late result and allows a new request',async()=>{
 const cloud=await import('@rymzi/cloud'),core=await import('@rymzi/core');await cloud.connectKymzi();vi.useFakeTimers();
 let finishOld:((value:unknown)=>void)|undefined;sdk.getDocs.mockImplementationOnce(()=>new Promise(resolve=>{finishOld=resolve;}));
 const pending=core.loadTravelCityPlaces('JP'),failure=expect(pending).rejects.toThrow('timed out');await vi.advanceTimersByTimeAsync(15000);await failure;
 expect(core.catalogueImageKnown('place','jp-1')).toBe(false);await core.loadTravelCityPlaces('JP');const fresh=core.catalogueCdnImage('place','jp-1')?.url;expect(fresh).toBe(imageUrl);
 finishOld!({docs:[snapshot('jp-1',{name:'Old image',image:city.data().image,imageUrl:origin+'/images/old.jpg'})],size:1});await Promise.resolve();await Promise.resolve();expect(core.catalogueCdnImage('place','jp-1')?.url).toBe(fresh);
});
