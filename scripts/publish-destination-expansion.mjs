import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {firestoreValue} from './cloud-firestore-import.mjs';
import {validateDestinationExpansion} from './destination-expansion-lib.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url)),PROJECT='kymzi-f1e9d',PREFIX=`projects/${PROJECT}/databases/(default)/documents`,DIR=path.join(ROOT,'artifacts/destination-expansion-v2');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8')),sha=value=>createHash('sha256').update(value).digest('hex');
const input=fs.readFileSync(path.join(ROOT,'content/world-catalogue/expansion-v2.json')),expansion=JSON.parse(input),baseBytes=fs.readFileSync(path.join(ROOT,'content/world-catalogue/catalogue.json')),base=JSON.parse(baseBytes),report=read(path.join(ROOT,'content/world-catalogue/expansion-v2-report.json'));
if(expansion.baseCatalogueSha256!==sha(baseBytes))throw Error('The frozen original catalogue changed.');
const validated=validateDestinationExpansion(base,expansion,report,input);
const args=process.argv.slice(2);if(args.some(a=>!['--apply','--verify'].includes(a)))throw Error('Usage: node scripts/publish-destination-expansion.mjs [--apply|--verify]');
let token='';function credentials(refresh=false){if(refresh||!token)token=execFileSync('gcloud',['auth','print-access-token','--account=admin@nexilence.co'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();return token;}
async function api(suffix,body){for(let attempt=0;attempt<3;attempt++){const response=await fetch(`https://firestore.googleapis.com/v1/${PREFIX}${suffix}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credentials(attempt>0),'x-goog-user-project':PROJECT,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const data=await response.json();if(response.status===401&&attempt<2)continue;if(!response.ok)throw Error(`Kymzi Firestore ${response.status}: ${data.error?.status??'failed'}`);return data;}}
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',JSON.stringify(value)+'\n');fs.renameSync(file+'.part',file);}
async function counts(){const out={};for(const [key,id,all] of [['cities','cities',false],['attractions','attractions',true]]){const data=await api(':runAggregationQuery',{structuredAggregationQuery:{structuredQuery:{from:[{collectionId:id,allDescendants:all}]},aggregations:[{alias:'count',count:{}}]}});out[key]=Number(data.find(d=>d.result)?.result.aggregateFields.count.integerValue??0);}return out;}
async function verify(){const result=await counts();if(result.cities!==2526||result.attractions!==26520)throw Error('Cloud catalogue counts differ: '+JSON.stringify(result));console.log(JSON.stringify({projectId:PROJECT,verified:result,...validated}));}
if(args.includes('--verify')){await verify();process.exit(0);}
const children=[],parents=[],popularity=[];
for(const city of expansion.cities){
 const {places,...metadata}=city;
 parents.push({path:`cities/${city.id}`,data:{schemaVersion:1,...metadata,placeIds:places.map(p=>p.id),attractionCount:4,expansionId:expansion.expansionId}});
 for(const place of places)children.push({path:`cities/${city.id}/attractions/${place.id}`,data:{schemaVersion:1,...place,cityId:city.id,city:city.city,country:city.country,continent:city.continent,expansionId:expansion.expansionId}});
}
for(const [id,data] of Object.entries(expansion.existingPopularity))popularity.push({path:`cities/${id}`,data:{popularity:data},merge:true});
// Children first: a new city only becomes discoverable once all four attractions exist.
const documents=[...children,...parents,...popularity].map(doc=>({...doc,hash:sha(JSON.stringify(doc.data))}));
console.log(JSON.stringify({projectId:PROJECT,mode:args.includes('--apply')?'apply':'dry-run',...validated,writes:documents.length}));
if(!args.includes('--apply'))process.exit(0);
const lock=path.join(DIR,'publish.lock');try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('Expansion publisher is already active.');}catch(e){if(e.code!=='ESRCH')throw e;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
try{
 const file=path.join(DIR,'publish-state.json'),journal=fs.existsSync(file)?read(file):{projectId:PROJECT,datasetSha256:report.datasetSha256,applied:{}};
 if(journal.projectId!==PROJECT||journal.datasetSha256!==report.datasetSha256)throw Error('Expansion publish journal belongs to another snapshot.');
 const pending=documents.filter(doc=>journal.applied[doc.path]!==doc.hash);
 for(let offset=0;offset<pending.length;offset+=250){
  const batch=pending.slice(offset,offset+250),writes=batch.map(doc=>({update:{name:`${PREFIX}/${doc.path}`,fields:firestoreValue({...doc.data,...(!doc.merge?{catalogueContentHash:doc.hash}:{})}).mapValue.fields},...(doc.merge?{updateMask:{fieldPaths:['popularity']},currentDocument:{exists:true}}:{currentDocument:{exists:false}})}));
  const result=await api(':batchWrite',{writes});if(result.status?.length!==batch.length)throw Error('Unexpected expansion write response.');
  const errors=[];for(let i=0;i<batch.length;i++){const doc=batch[i],status=result.status[i];if(!status.code){journal.applied[doc.path]=doc.hash;continue;}if(status.code===6&&!doc.merge){const existing=await api('/'+doc.path);if(existing.fields?.expansionId?.stringValue===expansion.expansionId&&existing.fields?.catalogueContentHash?.stringValue===doc.hash){journal.applied[doc.path]=doc.hash;continue;}}errors.push({path:doc.path,code:status.code});}
  journal.updatedAt=new Date().toISOString();save(file,journal);console.log(JSON.stringify({applied:Object.keys(journal.applied).length,total:documents.length}));if(errors.length){save(path.join(DIR,'publish-errors.json'),errors);throw Error('Some expansion writes failed; successful writes are checkpointed.');}
 }
 await verify();journal.completedAt=new Date().toISOString();save(file,journal);
}finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
