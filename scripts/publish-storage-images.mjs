// Admin-only, resumable immutable-image upload. No credentials are persisted.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ROOT=fileURLToPath(new URL('..',import.meta.url)),PROJECT='kymzi-f1e9d',BUCKET='kymzi-f1e9d-images';
const cacheControl='public, max-age=31536000, s-maxage=31536000, immutable';
const digest=(bytes,algorithm='sha256',encoding='hex')=>createHash(algorithm).update(bytes).digest(encoding);
export function validateImageManifest(manifest,root=ROOT){
 if(manifest.projectId!==PROJECT||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('A Kymzi image manifest is required.');
 const seen=new Set();return manifest.files.map(image=>{
  if(!/^images\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|svg|ico)$/.test(image.path)||image.path.split('/').includes('..')||seen.has(image.path))throw Error('Invalid or duplicate public image path.');seen.add(image.path);
  const file=path.join(root,'artifacts/cloud-cdn/public',image.path),bytes=fs.readFileSync(file);
  if(digest(bytes)!==image.sha256||bytes.length!==image.bytes)throw Error('Image source has changed: '+image.path);
  return {...image,file,md5Hash:digest(bytes,'md5','base64')};
 });
}
let accessToken='',refreshAt=0;
function credentials(){if(Date.now()>refreshAt){accessToken=execFileSync('gcloud',['auth','print-access-token','--account=admin@nexilence.co'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();refreshAt=Date.now()+40*60*1000;}return accessToken;}
async function api(url,options={}){
 for(let attempt=0;attempt<2;attempt++){
  const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+credentials(),'x-goog-user-project':PROJECT,...options.headers},signal:AbortSignal.timeout(60000)});
  const result=await response.json();if(response.status===401&&attempt===0){refreshAt=0;continue;}if(!response.ok)throw Error(`Storage ${response.status}: ${result.error?.message??'request failed'}`);return result;
 }
}

function contentType(file){const ext=path.extname(file).toLowerCase();return {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'}[ext];}
async function main(){
 const args=process.argv.slice(2),option=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('='),manifestFile=path.resolve(ROOT,option('manifest')??'artifacts/cloud-cdn/manifest.json'),stateDir=path.resolve(ROOT,option('state-dir')??'artifacts/cloud-storage');
 if(!manifestFile.startsWith(path.join(ROOT,'artifacts')+path.sep)||!stateDir.startsWith(path.join(ROOT,'artifacts')+path.sep))throw Error('Image manifests and journals must stay in project artifacts.');
 const apply=args.includes('--apply'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),files=validateImageManifest(manifest);
 const existing=new Map();let page='';do{const result=await api(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?prefix=images%2F&fields=items(name,size,md5Hash,cacheControl,metadata),nextPageToken${page?'&pageToken='+encodeURIComponent(page):''}`);for(const image of result.items??[])existing.set(image.name,image);page=result.nextPageToken??'';}while(page);
 const pending=[];
 for(const image of files){const remote=existing.get(image.path);if(remote){if(remote.md5Hash!==image.md5Hash||Number(remote.size)!==image.bytes)throw Error('Refusing to overwrite immutable Storage image: '+image.path);if(remote.cacheControl!==cacheControl)throw Error('Existing image cache metadata differs: '+image.path);}else pending.push(image);}
 console.log(JSON.stringify({projectId:PROJECT,bucket:BUCKET,images:files.length,alreadyUploaded:files.length-pending.length,pending:pending.length,mode:apply?'apply':'dry-run'}));if(!apply)return;
 let next=0,uploaded=0;
 await Promise.all(Array.from({length:6},async()=>{while(next<pending.length){const image=pending[next++],boundary='kymzi-image-upload-boundary',metadata={name:image.path,contentType:contentType(image.path),cacheControl,md5Hash:image.md5Hash,metadata:{sha256:image.sha256,managedBy:'kymzi-image-publisher'}};
  const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${metadata.contentType}\r\n\r\n`),fs.readFileSync(image.file),Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const result=await api(`https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=multipart&ifGenerationMatch=0`,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
  if(result.md5Hash!==image.md5Hash||result.metadata?.sha256!==image.sha256)throw Error('Uploaded image checksum mismatch: '+image.path);uploaded++;
 }}));
 const receipt={projectId:PROJECT,bucket:BUCKET,images:files.length,uploadedThisRun:uploaded,bytes:files.reduce((total,image)=>total+image.bytes,0),cacheControl,verifiedAt:new Date().toISOString()};
 fs.mkdirSync(stateDir,{recursive:true});fs.writeFileSync(path.join(stateDir,'upload-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi images: '+error.message.replace(/ya29\.[\w.-]+/g,'[REDACTED]'));process.exitCode=1;});
