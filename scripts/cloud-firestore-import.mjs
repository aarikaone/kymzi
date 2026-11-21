#!/usr/bin/env node
// Administrator-only import using an existing gcloud login. No keys are embedded or logged.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {isDeliveryImageUrl} from './image-delivery-config.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const PROJECT='kymzi-f1e9d',ACCOUNT='admin@nexilence.co';
const PREFIX=`projects/${PROJECT}/databases/(default)/documents`;
const sha=value=>createHash('sha256').update(value).digest('hex');
export function firestoreValue(value){
 if(value===null)return {nullValue:null};
 if(typeof value==='string')return {stringValue:value};
 if(typeof value==='boolean')return {booleanValue:value};
 if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Non-finite Firestore number');return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};}
 if(Array.isArray(value))return {arrayValue:{values:value.map(firestoreValue)}};
 if(value&&typeof value==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,v])=>[key,firestoreValue(v)]))}};
 throw Error('Unsupported Firestore value');
}
export function validatePlan(plan){
 if(plan.projectId!==PROJECT)throw Error('Import is restricted to the Kymzi project.');
 if(!Array.isArray(plan.documents)||!plan.documents.length)throw Error('Import plan has no documents.');
 const seen=new Set();
 for(const doc of plan.documents){
  if(!/^(?:cities\/[^/]+(?:\/attractions\/[^/]+)?|appConfig\/public)$/.test(doc.path)||seen.has(doc.path))throw Error('Invalid or duplicate catalogue document path.');seen.add(doc.path);
  const {catalogueContentHash,...data}=doc.data;
  if(doc.contentHash!==catalogueContentHash||sha(JSON.stringify(data))!==doc.contentHash)throw Error('Catalogue document content changed: '+doc.path);
  for(const url of [data.imageUrl,data.cdnImageUrl,...Object.values(data.publicImages??{}),...Object.values(data.publicCdnImages??{})])if(url&&!isDeliveryImageUrl(url))throw Error('Unexpected CDN image origin.');
  firestoreValue(doc.data);
 }
 return plan.documents;
}
export function documentWrite(doc){return {update:{name:`${PREFIX}/${doc.path}`,fields:firestoreValue(doc.data).mapValue.fields},updateMask:{fieldPaths:Object.keys(doc.data)}};}
let token='',refreshAt=0;
function credentials(){if(Date.now()>=refreshAt){token=execFileSync('gcloud',['auth','print-access-token',`--account=${ACCOUNT}`],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();refreshAt=Date.now()+45*60*1000;}return token;}
async function api(suffix,{method='GET',body}={}){
 const response=await fetch(`https://firestore.googleapis.com/v1/${PREFIX}${suffix}`,{method,headers:{Authorization:'Bearer '+credentials(),'x-goog-user-project':PROJECT,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
 const result=await response.json();if(!response.ok)throw Error(`Firestore ${response.status}: ${result.error?.status??'request failed'} ${result.error?.message??''}`);return result;
}
function save(file,data){const temp=file+'.part';fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{mode:0o600});fs.renameSync(temp,file);}
async function verify(){
 const counts={};
 for(const [name,collectionId,allDescendants] of [['cities','cities',false],['attractions','attractions',true]]){
  const result=await api(':runAggregationQuery',{method:'POST',body:{structuredAggregationQuery:{structuredQuery:{from:[{collectionId,allDescendants}]},aggregations:[{alias:'count',count:{}}]}}});
  counts[name]=Number(result.find(row=>row.result)?.result.aggregateFields.count.integerValue??0);
 }
 console.log(JSON.stringify({projectId:PROJECT,verifiedCounts:counts}));return counts;
}
async function main(){
 const args=process.argv.slice(2),apply=args.includes('--apply'),verifyOnly=args.includes('--verify');
 if(args.some(arg=>!['--apply','--verify'].includes(arg)&&!/^--max-writes=\d+$/.test(arg)))throw Error('Usage: node scripts/cloud-firestore-import.mjs [--apply] [--max-writes=N] [--verify]');
 if(verifyOnly){await verify();return;}
 const folder=path.join(ROOT,'artifacts/cloud-cdn'),input=path.join(folder,'firestore-documents.json'),plan=JSON.parse(fs.readFileSync(input,'utf8'));
 const docs=validatePlan(plan),ledgerFile=path.join(folder,'firestore-import-state.json');
 const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{projectId:PROJECT,applied:{}};
 if(ledger.projectId!==PROJECT)throw Error('Existing import journal belongs to another project.');
 const pending=docs.filter(doc=>ledger.applied[doc.path]!==doc.contentHash).sort((a,b)=>priority(a)-priority(b));
 function priority(doc){return doc.path.split('/').length===2?0:doc.data.imageUrl?1:2;}
 console.log(JSON.stringify({projectId:PROJECT,planned:docs.length,alreadyImported:docs.length-pending.length,pending:pending.length,mode:apply?'apply':'dry-run'}));
 if(!apply)return;
 const billing=JSON.parse(execFileSync('gcloud',['billing','projects','describe',PROJECT,`--project=${PROJECT}`,`--billing-project=${PROJECT}`,`--account=${ACCOUNT}`,'--quiet','--format=json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 const requested=args.find(arg=>arg.startsWith('--max-writes=')),limit=requested?Number(requested.split('=')[1]):billing.billingEnabled?pending.length:19500;
 if(!Number.isSafeInteger(limit)||limit<0||(!billing.billingEnabled&&limit>19500))throw Error('Billing is disabled; keep this run below 19,500 writes or enable billing first.');
 const selected=pending.slice(0,limit);let accepted=0;
 for(let start=0;start<selected.length;start+=300){
  const batch=selected.slice(start,start+300),result=await api(':batchWrite',{method:'POST',body:{writes:batch.map(documentWrite)}});
  if(result.status?.length!==batch.length)throw Error('Unexpected batch-write response; check the cloud before retrying.');
  const failures=[];
  result.status.forEach((status,i)=>{if(!status.code){ledger.applied[batch[i].path]=batch[i].contentHash;accepted++;}else failures.push({path:batch[i].path,code:status.code,message:status.message});});
  ledger.updatedAt=new Date().toISOString();save(ledgerFile,ledger);
  console.log(JSON.stringify({acceptedThisRun:accepted,imported:Object.keys(ledger.applied).length,total:docs.length}));
  if(failures.length){save(path.join(folder,'firestore-import-errors.json'),failures);throw Error(`${failures.length} writes failed; successful writes are saved in the resume journal.`);}
 }
 const remaining=docs.filter(doc=>ledger.applied[doc.path]!==doc.contentHash).length;
 console.log(JSON.stringify({projectId:PROJECT,imported:Object.keys(ledger.applied).length,remaining,billingEnabled:!!billing.billingEnabled}));
 await verify();
 if(remaining)process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi import: '+error.message.replace(/ya29\.[\w.-]+/g,'[REDACTED]'));process.exitCode=1;});
