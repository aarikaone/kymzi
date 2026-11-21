import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {IMAGE_DELIVERY} from './image-delivery-config.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),origin=IMAGE_DELIVERY.cdnOrigin;
const args=process.argv.slice(2),option=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('='),manifestFile=path.resolve(root,option('manifest')??'artifacts/cloud-cdn/manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(manifest.projectId!==IMAGE_DELIVERY.projectId)throw Error('Unexpected project in image manifest.');
const folder=path.resolve(root,option('state-dir')??'artifacts/cloud-storage');
if(!manifestFile.startsWith(path.join(root,'artifacts')+path.sep)||!folder.startsWith(path.join(root,'artifacts')+path.sep))throw Error('Image journals must stay in project artifacts.');
const ledgerFile=path.join(folder,'verified-cdn-images.json');
const incremental=process.argv.includes('--incremental');
let ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{origin,images:{}};
if(ledger.origin!==origin)ledger={origin,images:{}};
const images=manifest.files.filter(image=>!incremental||ledger.images[image.path]!==image.sha256);
const sample=manifest.files.find(file=>file.path.includes('/avatars/'))??manifest.files[0];
const wait=process.argv.includes('--wait'),deadline=Date.now()+(wait?90*60*1000:0);
for(;;){
 try{const response=await fetch(origin+'/'+sample.path,{method:'HEAD',signal:AbortSignal.timeout(10000)});if(response.status!==200)throw Error('HTTP '+response.status);break;}
 catch(error){if(!wait||Date.now()>=deadline)throw error;console.log(JSON.stringify({httpsReady:false,retryInSeconds:30,error:error.cause?.code??error.message,at:new Date().toISOString()}));await new Promise(resolve=>setTimeout(resolve,30000));}
}
const failures=[];let next=0,verified=0;
async function verify(image){
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(origin+'/'+image.path,{signal:AbortSignal.timeout(30000)}),bytes=Buffer.from(await response.arrayBuffer()),hash=createHash('sha256').update(bytes).digest('hex'),cache=response.headers.get('cache-control')??'';
   if(response.status!==200||hash!==image.sha256||!cache.includes('max-age=31536000')||!cache.includes('immutable')||response.headers.get('access-control-allow-origin')!=='*')throw Error(`Image verification failed: HTTP ${response.status}, checksum ${hash===image.sha256}, cache ${cache}`);
   verified++;ledger.images[image.path]=image.sha256;return;
  }catch(error){if(attempt===2){failures.push({path:image.path,error:error.message});return;}await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
 }
}
await Promise.all(Array.from({length:6},async()=>{while(next<images.length)await verify(images[next++]);}));
const cached=await fetch(origin+'/'+sample.path),cacheState=cached.headers.get('x-kymzi-cache'),age=cached.headers.get('age');await cached.body?.cancel();
const missing=await fetch(origin+'/images/kymzi-verification-missing.jpg',{method:'HEAD',signal:AbortSignal.timeout(15000)});
const result={projectId:IMAGE_DELIVERY.projectId,bucket:IMAGE_DELIVERY.bucket,cdnOrigin:origin,verifiedAt:new Date().toISOString(),total:manifest.files.length,verified,previouslyVerified:manifest.files.length-images.length,failures,cacheState,age,missingImageStatus:missing.status};
fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(ledgerFile+'.part',JSON.stringify(ledger)+'\n');fs.renameSync(ledgerFile+'.part',ledgerFile);fs.writeFileSync(path.join(folder,'cdn-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,failures:failures.slice(0,20)}));
if(failures.length||missing.status!==404||!cacheState?.toLowerCase().includes('hit'))process.exitCode=1;
