#!/usr/bin/env node
// Download an existing image batch. This utility only performs GET requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {imageSize} from 'image-size';

const ROOT=fileURLToPath(new URL('..',import.meta.url));
const PILOT=path.join(ROOT,'artifacts/world-art/pilot-100-v1');
const OUTPUT=path.join(ROOT,'output/imagegen/pilot-100-v1');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const terminal=new Set(['completed','failed','expired','cancelled']);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function saveJson(file,value){
 const temporary=file+'.part';
 await fs.writeFile(temporary,JSON.stringify(value,null,2)+'\n');
 await fs.rename(temporary,file);
}
export function validatePilot(manifest,requests){
 if(!/^batch_[a-zA-Z0-9]+$/.test(manifest.batchId??''))throw Error('Missing or invalid saved batch ID.');
 if(manifest.count!==100||manifest.entries?.length!==100)throw Error('This collector is restricted to the existing 100-image pilot.');
 if(hash(requests)!==manifest.requestsSha256)throw Error('Pilot requests have changed since submission.');
 const known=new Map();
 for(const entry of manifest.entries){
  const folder=entry.kind==='city'?'cities':entry.kind==='place'?'places':null;
  if(!folder||!new RegExp(`^${folder}/[a-zA-Z0-9_-]+\\.jpg$`).test(entry.output)||!entry.custom_id||known.has(entry.custom_id))throw Error('Invalid or duplicate pilot mapping.');
  known.set(entry.custom_id,entry);
 }
 const rows=requests.toString('utf8').trim().split('\n').map(line=>JSON.parse(line));
 if(rows.length!==100||new Set(rows.map(row=>row.custom_id)).size!==100||rows.some(row=>!known.has(row.custom_id)))throw Error('Submitted requests do not match the pilot manifest.');
 return known;
}
export function decodeResult(row,known,seen){
 const entry=known.get(row.custom_id);
 if(!entry||seen.has(row.custom_id))throw Error('Unknown or duplicate batch result: '+row.custom_id);
 seen.add(row.custom_id);
 const body=row.response?.body;
 if(row.error||row.response?.status_code!==200||body?.error)return {entry,error:{code:row.error?.code??body?.error?.code??'request_failed',status:row.response?.status_code??null}};
 if(body?.data?.length!==1)throw Error('Expected one image for '+row.custom_id);
 const encoded=body.data[0].b64_json;
 if(typeof encoded!=='string'||!encoded.length||encoded.length%4!==0||!/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded))throw Error('Invalid image encoding for '+row.custom_id);
 const bytes=Buffer.from(encoded,'base64'),size=imageSize(bytes);
 if(size.type!=='jpg'||size.width!==1536||size.height!==1024)throw Error('Unexpected image format or dimensions for '+row.custom_id);
 return {entry,bytes,width:size.width,height:size.height,usage:body.usage??null,requestId:row.response?.request_id??null};
}
async function request(url,key){
 const response=await fetch('https://api.openai.com/v1/'+url,{method:'GET',headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(90000)});
 if(!response.ok){
  let code='unknown';try{code=(await response.json()).error?.code??'unknown';}catch{}
  throw Error(`OpenAI GET failed: HTTP ${response.status}, code ${code}`);
 }
 return response;
}
async function download(fileId,target,key){
 if(!/^file-[a-zA-Z0-9]+$/.test(fileId))throw Error('Invalid output file ID.');
 try{await fs.access(target);return;}catch{}
 const response=await request('files/'+fileId+'/content',key);
 const temporary=target+'.part';
 await pipeline(Readable.fromWeb(response.body),createWriteStream(temporary,{mode:0o600}));
 await fs.rename(temporary,target);
}
async function collect(status,manifest,known,key){
 for(const [id,name] of [[status.output_file_id,'output.jsonl'],[status.error_file_id,'errors.jsonl']])if(id)await download(id,path.join(PILOT,name),key);
 const seen=new Set(),images=[],errors=[];
 for(const filename of ['output.jsonl','errors.jsonl']){
  const file=path.join(PILOT,filename);try{await fs.access(file);}catch{continue;}
  for await(const line of createInterface({input:createReadStream(file),crlfDelay:Infinity})){
   if(!line.trim())continue;
   const result=decodeResult(JSON.parse(line),known,seen);
   if(result.error){errors.push({custom_id:result.entry.custom_id,...result.error});continue;}
   const target=path.join(OUTPUT,result.entry.output),sha256=hash(result.bytes);
   await fs.mkdir(path.dirname(target),{recursive:true});
   try{await fs.writeFile(target,result.bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||hash(await fs.readFile(target))!==sha256)throw error;}
   images.push({...result.entry,file:path.relative(ROOT,target),width:result.width,height:result.height,sha256,requestId:result.requestId,usage:result.usage,reviewed:false});
  }
 }
 const missing=manifest.entries.filter(entry=>!seen.has(entry.custom_id)).map(entry=>entry.custom_id);
 const usages=images.map(image=>image.usage).filter(Boolean);
 const tokens=usages.reduce((sum,usage)=>{
  const image=usage.input_tokens_details?.image_tokens??0;
  return {text:sum.text+(usage.input_tokens_details?.text_tokens??Math.max(0,(usage.input_tokens??0)-image)),image:sum.image+image,output:sum.output+(usage.output_tokens??0)};
 },{text:0,image:0,output:0});
 const report={batchId:status.id,status:status.status,downloadedAt:new Date().toISOString(),requested:manifest.count,downloaded:images.length,failed:errors.length,missing,reportedUsage:tokens,usageReportedFor:usages.length,estimatedUSDFromReportedTokens:(tokens.text*2.5+tokens.image*4+tokens.output*15)/1000000,pricingNote:'OpenAI Batch API GPT-Image-2.5 pricing; estimate from returned usage, not a billing statement.',images,errors};
 await saveJson(path.join(PILOT,'results.json'),report);
 console.log(JSON.stringify({downloaded:images.length,failed:errors.length,missing:missing.length,estimatedUSDFromReportedTokens:report.estimatedUSDFromReportedTokens,report:path.relative(ROOT,path.join(PILOT,'results.json'))}));
 return report;
}
async function main(){
 if(process.argv.slice(2).some(arg=>arg!=='--watch'))throw Error('Usage: node --env-file=.env.imagegen.local scripts/collect-world-art-batch.mjs [--watch]');
 const key=process.env.OPENAI_API_KEY;if(!key)throw Error('OPENAI_API_KEY is not configured. Use the private local env file.');
 const manifest=JSON.parse(await fs.readFile(path.join(PILOT,'manifest.json'),'utf8'));
 const known=validatePilot(manifest,await fs.readFile(path.join(PILOT,'requests.jsonl')));
 const watch=process.argv.includes('--watch'),deadline=Date.now()+26*60*60*1000;
 let failures=0;
 do{
  let status;
  try{status=await(await request('batches/'+manifest.batchId,key)).json();failures=0;}
  catch(error){if(!watch||++failures>=5)throw error;console.error(error.message);await pause(60000);continue;}
  if(status.id!==manifest.batchId||status.metadata?.pilot_id!==manifest.pilotId)throw Error('The API returned a different batch.');
  await saveJson(path.join(PILOT,'status.json'),status);
  Object.assign(manifest,{status:status.status,lastCheckedAt:new Date().toISOString(),requestCounts:status.request_counts});
  await saveJson(path.join(PILOT,'manifest.json'),manifest);
  console.log(JSON.stringify({at:manifest.lastCheckedAt,batchId:status.id,status:status.status,...status.request_counts}));
  if(terminal.has(status.status)){
   const report=await collect(status,manifest,known,key);
   if(status.status!=='completed'||report.downloaded!==100||report.failed||report.missing.length)process.exitCode=1;
   return;
  }
  if(!watch)return;
  await pause(60000);
 }while(Date.now()<deadline);
 throw Error('Stopped watching after 26 hours; the existing batch can be checked again with the same command.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi batch collector: '+error.message);process.exitCode=1;});
