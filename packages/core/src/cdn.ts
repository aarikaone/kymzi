export const CATALOGUE_CDN_ORIGIN='https://images.endpoints.kymzi-f1e9d.cloud.goog';
export const LEGACY_CDN_ORIGIN='https://kymzi-f1e9d.web.app';
const deliveryOrigins=new Set([CATALOGUE_CDN_ORIGIN,LEGACY_CDN_ORIGIN]);
/** The public settings document is writable only by project administrators. */
export function configureCdnOrigin(value:unknown){
 if(typeof value!=='string')return;
 try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash)deliveryOrigins.add(url.origin);}catch{}
}
export function isCatalogueImageUrl(value:unknown):value is string{
 if(typeof value!=='string')return false;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&deliveryOrigins.has(url.origin)&&url.pathname.startsWith('/images/');}catch{return false;}
}

export type CatalogueImage={url:string;path:string;width:number|null;height:number|null;appReady?:boolean;reviewStatus?:string;sha256?:string;provider?:string;reusedFrom?:string};
const images=new Map<string,CatalogueImage|null>();
let publicImages:Record<string,string>={};
let revision=0;
const listeners=new Set<()=>void>();
function changed(){revision++;listeners.forEach(listener=>listener());}
export function subscribeCatalogueImages(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function catalogueImageRevision(){return revision;}
/** Database records are the only runtime source of image URLs. */
export function registerCatalogueImages(entries:readonly [string,CatalogueImage|null][]){for(const [key,image] of entries)images.set(key,image);changed();}
export function configurePublicImages(entries:Record<string,string>){publicImages={...entries};changed();}
export function catalogueCdnImage(kind:'city'|'place',id:string){const image=images.get(`${kind}/${id}`);return image?.appReady===false?undefined:image??undefined;}
export function catalogueImageKnown(kind:'city'|'place',id:string){return images.has(`${kind}/${id}`);}
/** No local-file fallback: missing server assets resolve to an empty source. */
export function publicCdnImage(path:string){return publicImages[path.split('?')[0]]??'';}
