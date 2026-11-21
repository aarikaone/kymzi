#!/usr/bin/env node
// Durable administrator workflow for the already-authorized OpenAI REST Batch API.
// No credentials are written to journals, Storage, Firestore, or subprocess logs.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawn} from 'node:child_process';
import {decodeResult} from './collect-world-art-batch.mjs';

export const MODEL='gpt-image-2.5-flare';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const PROFILE=process.env.KYMZI_WORLD_ART_PROFILE??'remaining-v1';
if(!['remaining-v1','destinations-v2'].includes(PROFILE))throw Error('Unknown artwork profile.');
const DESTINATIONS=PROFILE==='destinations-v2';
const RUN_ID=DESTINATIONS?'kymzi-destination-art-v2':'kymzi-remaining-world-art-v1';
const DIR=path.join(ROOT,'artifacts/world-art',PROFILE);
const CATALOGUE=path.join(ROOT,DESTINATIONS?'content/world-catalogue/expansion-v2.json':'content/world-catalogue/catalogue.json');
const RUN=path.join(DIR,'run.json');
const sha=v=>createHash('sha256').update(v).digest('hex');
const terminal=new Set(['completed','failed','expired','cancelled']);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(file+'.part',file);}
function log(value){console.log(JSON.stringify({at:new Date().toISOString(),...value}));}
export function usageCost(usage){
 if(!usage||!Number.isFinite(usage.input_tokens)||!Number.isFinite(usage.output_tokens))throw Error('Missing usage; stop new spending until reconciled.');
 const image=usage.input_tokens_details?.image_tokens??0;
 const text=usage.input_tokens_details?.text_tokens??usage.input_tokens-image;
 if(Math.min(text,image,usage.output_tokens)<0)throw Error('Invalid usage.');
 return (text*2.5+image*4+usage.output_tokens*15)/1e6;
}
export function buildPlan(jobs,existing,blocked,{size=500,budgetUSD=110,prioritizeCityCovers=true}={}){
 const done=new Set(existing),excluded=[],seen=new Set(),outputs=new Set(),entries=[];
 for(const job of jobs){
  if(seen.has(job.id)||outputs.has(job.output))throw Error('Duplicate image slot or output.');seen.add(job.id);outputs.add(job.output);
  if(done.has(job.id))continue;
  const folder=job.kind==='city'?'cities':job.kind==='place'?'places':null;
  if(!folder||!new RegExp(`^${folder}/[a-zA-Z0-9_-]+\\.jpg$`).test(job.output)||!job.id.startsWith(job.kind+'/'))throw Error('Unsafe image mapping.');
  if(blocked.has(job.id)){excluded.push({...job,reason:'Previously blocked by image moderation; no automatic retry.'});continue;}
  // Grounding comes from the catalogue. Never invent typography or turn a person into the subject.
  const prompt=job.prompt.replace('Landscape 4:3 composition','Landscape 3:2 composition with a central 4:3 crop-safe area')+'\nGrounding: depict only this destination and the supplied place type. Preserve known historical architecture. Do not add readable signs or inscriptions. If specific details are uncertain, favor landscape, material and environmental detail over invented landmark facades. No portraits, celebrities, branded characters or app interface.';
  const estimatedUSD=(Math.ceil(Buffer.byteLength(prompt)/4)*2.5+158*15)/1e6;
  const reserveUSD=(Math.ceil(Buffer.byteLength(prompt)/3)*2.5+200*15)/1e6;
  entries.push({...job,prompt,custom_id:job.id.replace(/[^a-zA-Z0-9_-]/g,'_'),estimatedUSD,reserveUSD});
 }
 if(prioritizeCityCovers)entries.sort((a,b)=>(a.kind==='city'?0:1)-(b.kind==='city'?0:1));
 const shards=[];
 for(let i=0;i<entries.length;i+=size){const part=entries.slice(i,i+size);shards.push({id:String(shards.length+1).padStart(3,'0'),count:part.length,entries:part,status:'prepared',reserveUSD:part.reduce((n,e)=>n+e.reserveUSD,0)});}
 const reserveUSD=entries.reduce((n,e)=>n+e.reserveUSD,0),estimatedUSD=entries.reduce((n,e)=>n+e.estimatedUSD,0);
 if(reserveUSD>budgetUSD)throw Error(`Prepared reserve $${reserveUSD.toFixed(2)} exceeds spending guard $${budgetUSD}.`);
 return {version:1,runId:RUN_ID,projectId:'kymzi-f1e9d',model:MODEL,quality:'low',size:'1536x1024',budgetUSD,count:entries.length,excluded,estimatedUSD,reserveUSD,pricing:{textInputPerMillion:2.5,imageInputPerMillion:4,imageOutputPerMillion:15,source:'https://developers.openai.com/api/docs/pricing?multimodal-image-pricing=batch#image-generation',checkedAt:'2026-11-21'},shards};
}
function requestBytes(shard){return Buffer.from(shard.entries.map(e=>JSON.stringify({custom_id:e.custom_id,method:'POST',url:'/v1/images/generations',body:{model:MODEL,n:1,size:'1536x1024',quality:'low',output_format:'jpeg',output_compression:80,prompt:e.prompt}})).join('\n')+'\n');}
export function validateShard(shard,bytes){
 if(sha(bytes)!==shard.requestsSha256)throw Error('Batch input changed after preparation.');
 const known=new Map(),outputs=new Set();
 for(const entry of shard.entries){
  const folder=entry.kind==='city'?'cities':entry.kind==='place'?'places':null;
  if(!folder||!new RegExp(`^${folder}/[a-zA-Z0-9_-]+\\.jpg$`).test(entry.output)||known.has(entry.custom_id)||outputs.has(entry.output))throw Error('Unsafe or duplicate batch mapping.');
  known.set(entry.custom_id,entry);outputs.add(entry.output);
 }
 const rows=bytes.toString('utf8').trim().split('\n').map(JSON.parse);
 if(rows.length!==shard.count||known.size!==shard.count||new Set(rows.map(r=>r.custom_id)).size!==shard.count||rows.some(r=>!known.has(r.custom_id)||r.body?.model!==MODEL||r.body?.quality!=='low'||r.body?.n!==1||r.body?.size!=='1536x1024'||r.url!=='/v1/images/generations'))throw Error('Invalid request settings or mapping.');
 return known;
}
export function quotaRejected(status){
 const errors=status.errors?.data??[];
 return status.status==='failed'&&(status.request_counts?.completed??0)===0&&errors.length>0&&errors.every(error=>/token_limit|enqueued|rate_limit|batch_limit/i.test(error.code??''));
}
export function queuedInputReserve(shard){return shard.entries.reduce((n,e)=>n+Math.ceil(Buffer.byteLength(e.prompt)/3),0);}
export function canEnqueue(run,shard){
 const active=run.shards.filter(s=>s.batchId&&!terminal.has(s.status));
 return active.length<run.maxActiveBatches&&active.reduce((n,s)=>n+queuedInputReserve(s),0)+queuedInputReserve(shard)<=(run.maxQueuedInputTokens??900000);
}
export function canReserve(run,shard){
 const spent=run.shards.reduce((n,s)=>n+(s.actualUSD??0),0);
 const outstanding=run.shards.filter(s=>s.batchId&&!s.collectedAt).reduce((n,s)=>n+s.reserveUSD,0);
 return spent+outstanding+shard.reserveUSD<=run.budgetUSD;
}
function ensureVolume(){
 if(!fs.existsSync('/Volumes/ExtremeSSD/Kymzi-world-art/.kymzi-volume'))throw Error('ExtremeSSD is unavailable; no new API requests will be submitted.');
 if(!fs.realpathSync(DIR).startsWith('/Volumes/ExtremeSSD/Kymzi-world-art/'))throw Error('Bulk artifacts must remain on ExtremeSSD.');
 const stat=fs.statfsSync(DIR);if(stat.bavail*stat.bsize<15*1024**3)throw Error('Keep at least 15 GB free on ExtremeSSD.');
}
async function prepare(){
 ensureVolume();if(fs.existsSync(RUN)){log({existingRun:true,...summary(read(RUN))});return;}
 let run;
 if(DESTINATIONS){
  const {destinationArtSource}=await import('./destination-art-plan.mjs'),{inspectDestinationImages}=await import('./destination-art-cloud.mjs');
  const {jobs,catalogueSha256}=destinationArtSource(),live=await inspectDestinationImages(jobs);
  const existing=[...live.values()].filter(v=>v.ready).map(v=>v.entry.id);
  if([...live.values()].some(v=>!v.ready&&(v.url||v.sha256)))throw Error('An existing image needs review; refusing duplicate generation.');
  run=buildPlan(jobs,existing,new Set(),{size:500,budgetUSD:35,prioritizeCityCovers:false});
  run.existingImageIds=existing;run.expectedSlots=jobs.length;run.catalogueSha256=catalogueSha256;
  save(path.join(DIR,'preflight.json'),{projectId:run.projectId,runId:RUN_ID,checkedAt:new Date().toISOString(),expectedSlots:jobs.length,alreadyReady:existing.length,missing:run.count,catalogueSha256});
  fs.writeFileSync(path.join(DIR,'prompts.jsonl'),jobs.map(job=>JSON.stringify(job)).join('\n')+'\n',{mode:0o600});
 }else{
  const jobs=fs.readFileSync(path.join(ROOT,'artifacts/world-art/pending-prompts.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const pilot=read(path.join(ROOT,'artifacts/world-art/pilot-100-v1/results.json'));
  const approved=read(path.join(ROOT,'content/world-art/approved.json'));
  const pilotManifest=read(path.join(ROOT,'artifacts/world-art/pilot-100-v1/manifest.json'));
  const blocked=new Set(pilot.errors.filter(e=>/moderation/.test(e.code)).map(e=>pilotManifest.entries.find(x=>x.custom_id===e.custom_id)?.id).filter(Boolean));
  run=buildPlan(jobs,[...Object.keys(approved),...pilot.images.map(x=>x.id)],blocked);
 }
 run.createdAt=new Date().toISOString();run.status='prepared';run.catalogueSha256=sha(fs.readFileSync(CATALOGUE));run.maxActiveBatches=DESTINATIONS?4:43;run.maxQueuedInputTokens=900000;
 for(const s of run.shards){const bytes=requestBytes(s);s.requestsSha256=sha(bytes);const folder=path.join(DIR,'shards',s.id);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'requests.jsonl'),bytes,{flag:'wx',mode:0o600});validateShard(s,bytes);}
 save(RUN,run);log({prepared:true,...summary(run)});
}
async function openai(endpoint,{method='GET',body,headers={},timeoutMs=120000}={}){
 const response=await fetch('https://api.openai.com/v1/'+endpoint,{method,headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,...headers},body,signal:AbortSignal.timeout(timeoutMs)});
 if(!response.ok){let data;try{data=await response.json();}catch{}const err=Error(`OpenAI HTTP ${response.status}: ${data?.error?.code??data?.error?.type??'request_failed'}`);err.status=response.status;err.apiCode=data?.error?.code??data?.error?.type;throw err;}
 return response;
}
async function listBatches(){const all=[];let after='';do{const data=await(await openai('batches?limit=100'+(after?'&after='+encodeURIComponent(after):''))).json();all.push(...data.data);after=data.has_more?data.last_id:'';}while(after);return all;}
async function submit(run,shard){
 const folder=path.join(DIR,'shards',shard.id),bytes=fs.readFileSync(path.join(folder,'requests.jsonl'));validateShard(shard,bytes);
 if(!canReserve(run,shard))throw Error('Spending guard reached; no more jobs submitted.');
 if(shard.submissionIntent){
  const matches=(await listBatches()).filter(b=>b.metadata?.run_id===RUN_ID&&b.metadata?.shard===shard.id&&b.input_file_id===shard.inputFileId&&b.metadata?.submission_nonce===shard.submissionIntent.nonce);
  if(matches.length!==1)throw Error('Ambiguous earlier submission; refusing a possible duplicate charge for '+shard.id);
  shard.batchId=matches[0].id;shard.status=matches[0].status;save(RUN,run);return;
 }
 if(!shard.inputFileId){
  const form=new FormData();form.set('purpose','batch');form.set('file',new Blob([bytes],{type:'application/jsonl'}),`${RUN_ID}-${shard.id}.jsonl`);
  const file=await(await openai('files',{method:'POST',body:form})).json();if(!/^file-[a-zA-Z0-9]+$/.test(file.id))throw Error('Invalid uploaded input file ID.');
  shard.inputFileId=file.id;save(RUN,run);
 }
 shard.submissionIntent={at:new Date().toISOString(),nonce:randomUUID()};save(RUN,run);
 try{
  const batch=await(await openai('batches',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':RUN_ID+'-'+shard.id+'-'+shard.submissionIntent.nonce},body:JSON.stringify({input_file_id:shard.inputFileId,endpoint:'/v1/images/generations',completion_window:'24h',metadata:{project:'kymzi',run_id:RUN_ID,shard:shard.id,request_sha256:shard.requestsSha256,image_count:String(shard.count),submission_nonce:shard.submissionIntent.nonce}})})).json();
  if(!/^batch_[a-zA-Z0-9]+$/.test(batch.id))throw Error('Missing API batch ID; submission must be reconciled.');
  shard.batchId=batch.id;shard.status=batch.status;shard.submittedAt=new Date().toISOString();save(RUN,run);log({submitted:shard.id,batchId:batch.id,images:shard.count,status:batch.status});
 }catch(error){
  // An explicit client rejection did not create a batch. Transport/server errors remain ambiguous.
  if(error.status>=400&&error.status<500){delete shard.submissionIntent;shard.lastSubmissionError={status:error.status,code:error.apiCode,at:new Date().toISOString()};save(RUN,run);}
  throw error;
 }
}
async function download(id,target){
 if(!/^file-[a-zA-Z0-9]+$/.test(id))throw Error('Invalid batch output file ID.');if(fs.existsSync(target))return;
 const response=await openai('files/'+id+'/content',{timeoutMs:20*60*1000});await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(target+'.part',{mode:0o600}));await fsp.rename(target+'.part',target);
}
async function collect(run,shard,status){
 const folder=path.join(DIR,'shards',shard.id),known=validateShard(shard,fs.readFileSync(path.join(folder,'requests.jsonl'))),seen=new Set(),images=[],errors=[];
 for(const [fileId,filename] of [[status.output_file_id,'output.jsonl'],[status.error_file_id,'errors.jsonl']]){
  if(!fileId)continue;const file=path.join(folder,filename);await download(fileId,file);
  for await(const line of createInterface({input:fs.createReadStream(file),crlfDelay:Infinity})){
   if(!line.trim())continue;const result=decodeResult(JSON.parse(line),known,seen);
   if(result.error){errors.push({id:result.entry.id,custom_id:result.entry.custom_id,...result.error});continue;}
   const target=path.join(ROOT,'output/imagegen',PROFILE,result.entry.output),hash=sha(result.bytes);fs.mkdirSync(path.dirname(target),{recursive:true});
   try{fs.writeFileSync(target,result.bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||sha(fs.readFileSync(target))!==hash)throw error;}
   const costUSD=usageCost(result.usage);
   images.push({...result.entry,file:path.relative(ROOT,target),width:result.width,height:result.height,sha256:hash,requestId:result.requestId,usage:result.usage,costUSD,reviewed:false,landmarkVerified:false,reviewStatus:'generated-guide-illustration'});
  }
 }
 const missing=shard.entries.filter(e=>!seen.has(e.custom_id)).map(e=>e.id);
 const report={runId:RUN_ID,shard:shard.id,batchId:shard.batchId,status:status.status,downloadedAt:new Date().toISOString(),requested:shard.count,downloaded:images.length,failed:errors.length,missing,estimatedUSDFromReportedTokens:images.reduce((n,i)=>n+i.costUSD,0),images,errors};
 save(path.join(folder,'results.json'),report);shard.collectedAt=report.downloadedAt;shard.actualUSD=report.estimatedUSDFromReportedTokens;shard.downloaded=images.length;shard.failed=errors.length;shard.missing=missing.length;save(RUN,run);log({collected:shard.id,downloaded:images.length,failed:errors.length,missing:missing.length,estimatedUSD:shard.actualUSD});
}
async function command(script,args=[]){
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(ROOT,'scripts',script),...args],{cwd:ROOT,env:{...process.env,OPENAI_API_KEY:'',PATH:path.dirname(process.execPath)+':/opt/homebrew/bin:/Users/aarika/.local/bin:'+process.env.PATH},stdio:['ignore','inherit','inherit']});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${script} exited ${code}`)));});
}
async function publish(run){
 const pending=run.shards.filter(s=>s.collectedAt&&!s.publishedAt);if(!pending.length)return;
 ensureVolume();
 if(DESTINATIONS){await command('publish-destination-art.mjs',['--apply']);for(const shard of pending)shard.publishedAt=new Date().toISOString();save(RUN,run);log({publishedShards:pending.map(s=>s.id),...summary(run)});return;}
 // Storage checksums and CDN availability are verified before any Firestore URL is changed.
 await command('prepare-cloud-catalogue.mjs');
 await command('publish-storage-images.mjs',['--apply']);
 await command('verify-image-cdn.mjs',['--incremental']);
 await command('cloud-firestore-import.mjs',['--apply']);
 for(const shard of pending)shard.publishedAt=new Date().toISOString();save(RUN,run);log({publishedShards:pending.map(s=>s.id),...summary(run)});
}
export function summary(run){return {runId:run.runId,status:run.status??null,finishedAt:run.finishedAt??null,total:run.count,excluded:run.excluded.length,shards:run.shards.length,submitted:run.shards.filter(s=>s.batchId).reduce((n,s)=>n+s.count,0),generated:run.shards.reduce((n,s)=>n+(s.downloaded??0),0),published:run.shards.filter(s=>s.publishedAt).reduce((n,s)=>n+(s.downloaded??0),0),failed:run.shards.reduce((n,s)=>n+(s.failed??0)+(s.missing??0),0),activeBatches:run.shards.filter(s=>s.batchId&&!terminal.has(s.status)).length,queuedImages:run.shards.filter(s=>!s.batchId).reduce((n,s)=>n+s.count,0),generatedByAPI:run.shards.reduce((n,s)=>n+(s.collectedAt?(s.downloaded??0):(s.requestCounts?.completed??0)),0),estimatedUSD:run.estimatedUSD,reserveUSD:run.reserveUSD,estimatedSpentUSD:run.shards.reduce((n,s)=>n+(s.actualUSD??0),0),budgetUSD:run.budgetUSD,completedAt:run.completedAt??null};}
async function runWorker(once=false){
 ensureVolume();if(!process.env.OPENAI_API_KEY)throw Error('Use the private local API environment file.');
 const lock=path.join(DIR,'worker.lock');
 try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('The existing image worker is still running.');}catch(err){if(err.code!=='ESRCH')throw err;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
 try{
  let consecutiveFailures=0;
  do{
   const run=read(RUN);ensureVolume();
   try{
    if(run.runId!==RUN_ID||run.projectId!=='kymzi-f1e9d'||run.catalogueSha256!==sha(fs.readFileSync(CATALOGUE)))throw Error('Artwork source provenance changed.');
    run.status='running';
    await publish(run);
    const ready=[];
    for(const shard of run.shards.filter(s=>s.batchId&&!s.collectedAt)){
     const status=await(await openai('batches/'+shard.batchId)).json();
     if(status.id!==shard.batchId||status.metadata?.run_id!==RUN_ID||status.metadata?.shard!==shard.id||status.metadata?.request_sha256!==shard.requestsSha256)throw Error('Returned batch provenance mismatch.');
     shard.status=status.status;shard.requestCounts=status.request_counts;save(path.join(DIR,'shards',shard.id,'status.json'),status);save(RUN,run);
     if(quotaRejected(status)){
      shard.rejectedAttempts??=[];shard.rejectedAttempts.push({batchId:shard.batchId,at:new Date().toISOString(),errors:status.errors.data});
      save(path.join(DIR,'shards',shard.id,shard.batchId+'-rejected.json'),status);
      delete shard.batchId;delete shard.submissionIntent;shard.status='prepared';shard.retryAfter=Date.now()+5*60*1000;
      run.maxActiveBatches=Math.min(run.maxActiveBatches,4);run.maxQueuedInputTokens??=900000;save(RUN,run);log({quotaDeferred:shard.id,maxActiveBatches:run.maxActiveBatches});
     }else if(terminal.has(status.status))ready.push([shard,status]);
    }
    // Refill remote capacity before large output downloads and CDN verification.
    for(const shard of run.shards.filter(s=>!s.batchId&&(!s.retryAfter||s.retryAfter<=Date.now()))){
     if(!canEnqueue(run,shard))break;
     await submit(run,shard);
    }
    for(const [shard,status] of ready)await collect(run,shard,status);
    await publish(run);
    run.lastCheckedAt=new Date().toISOString();consecutiveFailures=0;
    if(run.shards.every(s=>s.publishedAt)){
     run.finishedAt=new Date().toISOString();
     const unresolved=run.excluded.map(e=>({id:e.id,name:e.name,city:e.city,country:e.country,reason:e.reason}));
     for(const shard of run.shards){
      const result=read(path.join(DIR,'shards',shard.id,'results.json'));
      for(const error of [...result.errors,...result.missing.map(id=>({id,code:'missing_result'}))]){
       const entry=shard.entries.find(e=>e.id===error.id);unresolved.push({name:entry?.name,city:entry?.city,country:entry?.country,...error});
      }
     }
     run.status=unresolved.length?'finished-with-gaps':'completed';if(!unresolved.length)run.completedAt=run.finishedAt;
     save(path.join(DIR,'unresolved-images.json'),{runId:RUN_ID,count:unresolved.length,images:unresolved});save(RUN,run);log({finished:true,status:run.status,...summary(run)});return;
    }
    save(RUN,run);log(summary(run));
   }catch(error){
    run.lastError={message:error.message,at:new Date().toISOString()};save(RUN,run);log({error:error.message,consecutiveFailures:++consecutiveFailures});
    if(once||consecutiveFailures>=12||/ambiguous|duplicate charge|Spending guard|usage|provenance|changed|insufficient_quota|billing|HTTP 401|HTTP 403/i.test(error.message))throw error;
   }
   if(once)return;await pause(60000);
  }while(true);
 }finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
}
async function main(){const args=process.argv.slice(2);if(args.length!==1||!['--prepare','--run','--once','--status'].includes(args[0]))throw Error('Usage: node --env-file=.env.imagegen.local scripts/world-art-run.mjs --prepare|--run|--once|--status');if(args[0]==='--prepare')await prepare();else if(args[0]==='--status')log(summary(read(RUN)));else await runWorker(args[0]==='--once');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi world art: '+error.message);process.exitCode=1;});
