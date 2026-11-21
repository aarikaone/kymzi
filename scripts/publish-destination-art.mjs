// Publish only new expansion artwork. Existing city data, details and images are preserved.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {imageSize} from 'image-size';
import {IMAGE_DELIVERY} from './image-delivery-config.mjs';
import {destinationArtSource} from './destination-art-plan.mjs';
import {applyDestinationImages} from './destination-art-cloud.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url)),DIR=path.join(ROOT,'artifacts/world-art/destinations-v2'),STATE=path.join(DIR,'cloud-publish'),PUBLIC=path.join(ROOT,'artifacts/cloud-cdn/public'),RUN_ID='kymzi-destination-art-v2';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8')),sha=value=>createHash('sha256').update(value).digest('hex');
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',JSON.stringify(value)+'\n');fs.renameSync(file+'.part',file);}
async function command(script,args){await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(ROOT,'scripts',script),...args],{cwd:ROOT,env:{...process.env,OPENAI_API_KEY:'',PATH:path.dirname(process.execPath)+':/opt/homebrew/bin:/Users/aarika/.local/bin:'+process.env.PATH},stdio:['ignore','inherit','inherit']});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(script+' exited '+code)));});}
export function destinationAssetPath(output,digest){if(!/^(cities|places)\/[A-Za-z0-9_-]+\.jpg$/.test(output)||!/^[a-f0-9]{64}$/.test(digest))throw Error('Unsafe destination asset path.');return 'images/destinations-v2/'+output.replace(/\.jpg$/,`-${digest.slice(0,16)}.jpg`);}
function optimize(item){
 if(item.file!==`output/imagegen/destinations-v2/${item.output}`)throw Error('Unexpected generated source path.');
 const source=path.join(ROOT,item.file),bytes=fs.readFileSync(source),dimensions=imageSize(bytes);
 if(sha(bytes)!==item.sha256||dimensions.type!=='jpg'||dimensions.width!==1536||dimensions.height!==1024)throw Error('Generated source checksum or dimensions changed.');
 const optimized=path.join(DIR,'optimized',item.output),stamp=optimized+'.source-sha256';fs.mkdirSync(path.dirname(optimized),{recursive:true});
 if(!fs.existsSync(optimized)||!fs.existsSync(stamp)||fs.readFileSync(stamp,'utf8')!==item.sha256){execFileSync('sips',['-Z','768','-s','format','jpeg','-s','formatOptions','72',source,'--out',optimized],{stdio:'pipe'});fs.writeFileSync(stamp,item.sha256);}
 const optimizedBytes=fs.readFileSync(optimized),size=imageSize(optimizedBytes),digest=sha(optimizedBytes);if(size.width!==768||size.height!==512)throw Error('Unexpected optimized artwork dimensions.');
 const assetPath=destinationAssetPath(item.output,digest),target=path.join(PUBLIC,assetPath);fs.mkdirSync(path.dirname(target),{recursive:true});
 if(fs.existsSync(target)){if(sha(fs.readFileSync(target))!==digest)throw Error('Immutable image collision.');}else fs.copyFileSync(optimized,target);
 const image={path:assetPath,sha256:digest,width:768,height:512,url:`${IMAGE_DELIVERY.cdnOrigin}/${assetPath}`,appReady:true,reviewStatus:'generated-guide-illustration',provider:'OpenAI Batch API',model:'gpt-image-2.5-flare',batchId:item.batchId,runId:RUN_ID,landmarkVerified:false};
 return {image,file:{path:assetPath,sha256:digest,width:768,height:512,bytes:optimizedBytes.length}};
}
async function main(){
 const args=process.argv.slice(2);if(args.length!==1||args[0]!=='--apply')throw Error('Usage: node scripts/publish-destination-art.mjs --apply');
 const {catalogueSha256,jobs}=destinationArtSource(),known=new Map(jobs.map(job=>[job.id,job])),run=read(path.join(DIR,'run.json'));
 if(run.runId!==RUN_ID||run.projectId!==IMAGE_DELIVERY.projectId||run.catalogueSha256!==catalogueSha256)throw Error('Destination artwork provenance changed.');
 const pending=run.shards.filter(s=>s.collectedAt&&!s.publishedAt);if(!pending.length)return;
 const lock=path.join(DIR,'publish.lock');try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('Destination publisher is already running.');}catch(e){if(e.code!=='ESRCH')throw e;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
 try{
  const registryFile=path.join(DIR,'cdn-images.json'),registry=fs.existsSync(registryFile)?read(registryFile):{projectId:IMAGE_DELIVERY.projectId,runId:RUN_ID,catalogueSha256,images:{}};
  if(registry.runId!==RUN_ID||registry.catalogueSha256!==catalogueSha256)throw Error('CDN registry provenance changed.');
  const entries=[],files=[],seen=new Set(),hashes=new Map(Object.entries(registry.images).map(([id,record])=>[record.sha256,id]));
  for(const shard of pending){
   const results=read(path.join(DIR,'shards',shard.id,'results.json'));
   if(results.runId!==RUN_ID||results.batchId!==shard.batchId||results.images.length!==shard.downloaded)throw Error('Collected batch provenance changed.');
   for(const item of results.images){
    const entry=known.get(item.id);if(!entry||seen.has(item.id)||entry.output!==item.output||entry.documentPath!==item.documentPath||!shard.entries.some(e=>e.id===item.id&&e.custom_id===item.custom_id))throw Error('Unknown or duplicated destination image.');seen.add(item.id);
    const optimized=optimize({...item,batchId:shard.batchId});
    if(hashes.has(optimized.image.sha256)&&hashes.get(optimized.image.sha256)!==item.id)throw Error('Identical image returned for two different places; review required.');hashes.set(optimized.image.sha256,item.id);
    entries.push({entry,image:optimized.image});files.push(optimized.file);
   }
  }
  if(!entries.length){console.log(JSON.stringify({projectId:IMAGE_DELIVERY.projectId,runId:RUN_ID,publishedImages:0,failedImages:pending.reduce((n,s)=>n+(s.failed??0),0)}));return;}
  const manifest=path.join(STATE,'manifest.json');save(manifest,{projectId:IMAGE_DELIVERY.projectId,runId:RUN_ID,files});
  const options=[`--manifest=${path.relative(ROOT,manifest)}`,`--state-dir=${path.relative(ROOT,STATE)}`];
  await command('publish-storage-images.mjs',['--apply',...options]);
  await command('verify-image-cdn.mjs',['--incremental',...options]);
  for(let start=0;start<entries.length;start+=200){const group=entries.slice(start,start+200);await applyDestinationImages(group);for(const {entry,image} of group)registry.images[entry.id]={...image,documentPath:entry.documentPath,publishedAt:new Date().toISOString()};save(registryFile,registry);}
  console.log(JSON.stringify({projectId:IMAGE_DELIVERY.projectId,runId:RUN_ID,publishedImages:entries.length,totalPublished:Object.keys(registry.images).length,examples:entries.slice(0,5).map(e=>({name:e.entry.name,city:e.entry.city,url:e.image.url}))}));
 }finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main().catch(error=>{console.error('Kymzi destination images: '+error.message.replace(/ya29\.[\w.-]+/g,'[REDACTED]'));process.exitCode=1;});
