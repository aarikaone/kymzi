import fs from 'node:fs';
export const IMAGE_DELIVERY=JSON.parse(fs.readFileSync(new URL('../content/cloud-images/config.json',import.meta.url),'utf8'));
if(IMAGE_DELIVERY.projectId!=='kymzi-f1e9d'||IMAGE_DELIVERY.bucket!=='kymzi-f1e9d-images')throw Error('Image delivery is restricted to Kymzi.');
export function isDeliveryImageUrl(value){if(typeof value!=='string')return false;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&[IMAGE_DELIVERY.cdnOrigin,IMAGE_DELIVERY.legacyOrigin].includes(url.origin)&&url.pathname.startsWith('/images/');}catch{return false;}}
