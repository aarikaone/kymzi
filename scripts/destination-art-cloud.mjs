import {execFileSync} from 'node:child_process';
import {firestoreValue} from './cloud-firestore-import.mjs';
import {IMAGE_DELIVERY,isDeliveryImageUrl} from './image-delivery-config.mjs';
const PROJECT='kymzi-f1e9d',PREFIX=`projects/${PROJECT}/databases/(default)/documents`;
let token='',tokenAt=0;
function credentials(refresh=false){if(refresh||Date.now()>=tokenAt){token=execFileSync('gcloud',['auth','print-access-token','--account=admin@nexilence.co'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();tokenAt=Date.now()+30*60*1000;}return token;}
async function api(suffix,body){
 for(let attempt=0;attempt<3;attempt++){
  const response=await fetch(`https://firestore.googleapis.com/v1/${PREFIX}${suffix}`,{method:'POST',headers:{Authorization:'Bearer '+credentials(attempt>0),'x-goog-user-project':PROJECT,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
  const data=await response.json();if(response.status===401&&attempt<2)continue;if(!response.ok)throw Error(`Kymzi artwork Firestore ${response.status}: ${data.error?.status??'failed'}`);return data;
 }
}
export function destinationImageFields(entry,image){
 if(!/^cities\/city:\d+(?:\/attractions\/Q\d+)?$/.test(entry.documentPath)||entry.documentPath!==(entry.kind==='city'?`cities/${entry.cityId}`:`cities/${entry.cityId}/attractions/${entry.id.split('/')[1]}`))throw Error('Artwork document mapping changed.');
 if(!/^[a-f0-9]{64}$/.test(image.sha256)||!image.path.startsWith('images/destinations-v2/')||image.url!==`${IMAGE_DELIVERY.cdnOrigin}/${image.path}`||!isDeliveryImageUrl(image.url)||image.width!==768||image.height!==512)throw Error('Invalid immutable CDN image metadata.');
 return {image,cdnImageUrl:image.url,imageStatus:'available'};
}
export async function inspectDestinationImages(entries){
 const found=new Map();
 for(let start=0;start<entries.length;start+=250){
  const batch=entries.slice(start,start+250),expected=new Map(batch.map(e=>[`${PREFIX}/${e.documentPath}`,e]));
  const rows=await api(':batchGet',{documents:[...expected.keys()],mask:{fieldPaths:['image','cdnImageUrl','imageUrl','imageStatus','cityId','geonameId','sourceUrl','citySourceUrl']}});
  if(!Array.isArray(rows))throw Error('Unexpected artwork metadata response.');
  for(const row of rows){
   if(!row.found||!expected.has(row.found.name))throw Error('A destination or attraction document is missing.');
   const entry=expected.get(row.found.name),fields=row.found.fields??{};
   if(entry.kind==='city'?Number(fields.geonameId?.integerValue)!==entry.geonameId:fields.cityId?.stringValue!==entry.cityId||fields.sourceUrl?.stringValue!==entry.sourceUrl)throw Error('Live destination identity differs from the image plan: '+entry.id);
   const raw=fields.image?.mapValue?.fields,url=fields.cdnImageUrl?.stringValue??fields.imageUrl?.stringValue;
   if(url&&!isDeliveryImageUrl(url))throw Error('Unexpected image origin for '+entry.id);
   found.set(entry.id,{entry,updateTime:row.found.updateTime,ready:!!url&&!!raw?.sha256?.stringValue&&raw?.appReady?.booleanValue!==false,url:url??null,sha256:raw?.sha256?.stringValue??null});
  }
  if(batch.some(e=>!found.has(e.id)))throw Error('Incomplete artwork metadata preflight.');
 }
 return found;
}
export async function applyDestinationImages(entries){
 const live=await inspectDestinationImages(entries.map(e=>e.entry)),writes=[];
 for(const {entry,image} of entries){
  const current=live.get(entry.id);if(current.ready){if(current.sha256!==image.sha256||current.url!==image.url)throw Error('Refusing to replace an existing image: '+entry.id);continue;}
  writes.push({update:{name:`${PREFIX}/${entry.documentPath}`,fields:firestoreValue(destinationImageFields(entry,image)).mapValue.fields},updateMask:{fieldPaths:['image','cdnImageUrl','imageStatus']},currentDocument:{updateTime:current.updateTime}});
 }
 if(writes.length){const result=await api(':batchWrite',{writes});if(result.status?.length!==writes.length||result.status.some(s=>s.code))throw Error('Artwork update raced another write; retry from the checkpoint.');}
 return writes.length;
}
