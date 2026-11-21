#!/usr/bin/env node
// Public encyclopedia/Wikidata enrichment. No OpenAI calls or app credentials.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {firestoreValue} from './cloud-firestore-import.mjs';

const ROOT=fileURLToPath(new URL('..',import.meta.url)),DIR=path.resolve(ROOT,process.env.KYMZI_DETAILS_FOLDER??'artifacts/place-details-v1');
const PROJECT='kymzi-f1e9d',PREFIX=`projects/${PROJECT}/databases/(default)/documents`;
const UA='KymziCatalogue/1.0 (https://kymzi-f1e9d.web.app; cached travel guide enrichment)';
const hash=value=>createHash('sha256').update(value).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',JSON.stringify(value)+'\n');fs.renameSync(file+'.part',file);}
function log(value){console.log(JSON.stringify({at:new Date().toISOString(),...value}));}
function ensureVolume(){if(!fs.existsSync('/Volumes/ExtremeSSD/Kymzi-world-art/.kymzi-volume')||!fs.realpathSync(DIR).startsWith('/Volumes/ExtremeSSD/Kymzi-place-details/'))throw Error('Keep ExtremeSSD connected for the details job.');}
const PROPERTIES={P571:'Established',P1619:'Opened',P84:'Architect',P149:'Architecture',P2048:'Height',P2046:'Area',P186:'Material',P1435:'Heritage'};
export function factQuery(ids){
 if(!ids.length||ids.some(id=>!/^Q\d+$/.test(id))||ids.length>200)throw Error('Only up to 200 known Wikidata IDs are allowed.');
 const prefix=`PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX p: <http://www.wikidata.org/prop/> PREFIX ps: <http://www.wikidata.org/prop/statement/> PREFIX psv: <http://www.wikidata.org/prop/statement/value/> PREFIX wikibase: <http://wikiba.se/ontology#> PREFIX schema: <http://schema.org/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>`;
 const branches=Object.keys(PROPERTIES).map(pid=>`{BIND(wd:${pid} AS ?property) ?place p:${pid} ?statement. ?statement ps:${pid} ?value; wikibase:rank ?rank. FILTER(?rank != wikibase:DeprecatedRank) ${['P571','P1619'].includes(pid)?`OPTIONAL{?statement psv:${pid}/wikibase:timePrecision ?precision.}`:['P2048','P2046'].includes(pid)?`OPTIONAL{?statement psv:${pid}/wikibase:quantityUnit ?unit. OPTIONAL{?unit rdfs:label ?unitLabel. FILTER(LANG(?unitLabel)="en")}}`:''}}`).join(' UNION ');
 return `${prefix} SELECT ?place ?title ?property ?value ?label ?unit ?unitLabel ?precision ?rank WHERE { VALUES ?place {${ids.map(id=>'wd:'+id).join(' ')}} OPTIONAL{?article schema:about ?place;schema:isPartOf <https://en.wikipedia.org/>;schema:name ?title.} OPTIONAL{${branches} OPTIONAL{?value rdfs:label ?label. FILTER(LANG(?label)="en")}}}`;
}
export function yearLabel(value,precision){
 const match=/^([+-]?)(\d+)-/.exec(value??'');if(!match||!precision||precision<8)return null;
 const year=Number(match[2]);if(!year||year>9999)return null;const suffix=match[1]==='-'?' BCE':'';
 if(precision>=9)return year+suffix;
 if(precision===8)return Math.floor(year/10)*10+'s'+suffix;
 return null;
}
export function factsFromRows(rows){
 const indexed={};
 for(const row of rows){
  const id=row.place?.value?.split('/').at(-1);if(!/^Q\d+$/.test(id??''))continue;
  const entry=indexed[id]??={title:null,rows:[],facts:[]};if(row.title?.value)entry.title=row.title.value;
  entry.rows.push(row);
 }
 for(const entry of Object.values(indexed)){
  const facts=[];
  for(const [property,label] of Object.entries(PROPERTIES)){
   let values=entry.rows.filter(r=>r.property?.value?.endsWith('/'+property));
   if(values.some(r=>r.rank?.value?.endsWith('PreferredRank')))values=values.filter(r=>r.rank?.value?.endsWith('PreferredRank'));
   const formatted=[];
   for(const row of values){
    let value;
    if(property==='P571'||property==='P1619')value=yearLabel(row.value?.value,Number(row.precision?.value));
    else if(property==='P2048'||property==='P2046'){
     const amount=Number(row.value?.value),unit=row.unitLabel?.value;
     const units={'metre':'m','meter':'m','centimetre':'cm','centimeter':'cm','foot':'ft','square metre':'m²','square meter':'m²','hectare':'ha','acre':'acres','square kilometre':'km²','square kilometer':'km²'};
     if(Number.isFinite(amount)&&amount>0&&unit)value=new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(amount)+' '+(units[unit.toLowerCase()]??unit);
    }else value=row.label?.value;
    if(value&&!formatted.includes(value))formatted.push(value);
   }
   if(formatted.length&&(!['P571','P1619','P2048','P2046'].includes(property)||formatted.length===1))facts.push({label,value:formatted.slice(0,2).join(' · ')});
  }
  if(facts.some(f=>f.label==='Opened'))entry.facts=facts.filter(f=>f.label!=='Established');else entry.facts=facts;
  delete entry.rows;
 }
 return indexed;
}
const fold=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
export function makeDetails(place,city,info,page,updatedAt){
 const known=/^Q\d+$/.test(place.id),extract=page?.extract?.trim()??'';
 const legacyMatch=!known&&page?.pageprops?.wikibase_item&&fold(page.title)===fold(place.name)&&[city.city,...city.aliases].filter(name=>name.length>3).some(name=>fold(extract).includes(fold(name)));
 const valid=!!extract&&!page?.pageprops?.hasOwnProperty('disambiguation')&&(known?page?.pageprops?.wikibase_item===place.id:legacyMatch);
 const sourcedFacts=info?.facts??[];
 const fallback=[place.description?.replace(/\.?$/,'.'),...sourcedFacts.filter(f=>['Opened','Established','Architect','Architecture','Material','Heritage'].includes(f.label)).map(f=>({Opened:`It opened in ${f.value}.`,Established:`It was established in ${f.value}.`,Architect:`Architect: ${f.value}.`,Architecture:`Architecture: ${f.value}.`,Material:`Materials: ${f.value}.`,Heritage:`Heritage designation: ${f.value}.`})[f.label])].filter(Boolean).join('\n\n');
 const facts=sourcedFacts.length?[{label:'Type',value:place.kind},...sourcedFacts].slice(0,7):[{label:'Type',value:place.kind},{label:'City',value:city.city},{label:'Country',value:city.country}];
 const credits=[{title:'Wikidata',url:known?`https://www.wikidata.org/wiki/${place.id}`:place.sourceUrl,license:known?'CC0':'Curated factual guide',attribution:known?'Wikidata contributors':'Kymzi city guide'}];
 if(valid)credits.unshift({title:page.title,url:`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ','_'))}`,license:'CC BY-SA 4.0',attribution:`Wikipedia contributors · ${page.title}`});
 return {description:(valid?extract:fallback||place.description||'').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g,''),facts,credits,updatedAt,status:valid?'complete':'limited'};
}
export function detailWrite(documentPath,details){
 if(!/^cities\/[^/]+\/attractions\/(?:Q\d+|[a-z]{2}-\d+)$/.test(documentPath))throw Error('Unexpected attraction document path.');
 return {update:{name:PREFIX+'/'+documentPath,fields:firestoreValue({details,detailsStatus:details.status,detailsUpdatedAt:details.updatedAt}).mapValue.fields},updateMask:{fieldPaths:['details','detailsStatus','detailsUpdatedAt']},currentDocument:{exists:true}};
}
export async function source(url){
 for(let attempt=0;attempt<5;attempt++){
  const response=await fetch(url,{headers:{'User-Agent':UA,Accept:'application/json'},signal:AbortSignal.timeout(url.startsWith('https://qlever.dev/')?12000:60000)});
  let data;try{data=await response.json();}catch{if(attempt===4)throw Error('Invalid public source response: '+response.status);await sleep(5000);continue;}
  if(response.status===429||response.status===503||data.error?.code==='maxlag'||data.error?.code==='ratelimited'){if(attempt===4)throw Error('Public source is busy; resume later.');await sleep(Math.min(60000,Math.max(5000,Number(response.headers.get('retry-after')??5)*1000)*(attempt+1)));continue;}
  if(!response.ok||data.error||data.exception)throw Error('Public source request failed: '+(data.error?.code??data.exception??response.status));return data;
 }
}
let token='',tokenAt=0;
function credentials(){if(Date.now()>tokenAt){token=execFileSync('gcloud',['auth','print-access-token','--account=admin@nexilence.co'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();tokenAt=Date.now()+40*60*1000;}return token;}
export async function apply(writes){
 for(let attempt=0;attempt<2;attempt++){
  const r=await fetch('https://firestore.googleapis.com/v1/'+PREFIX+':batchWrite',{method:'POST',headers:{Authorization:'Bearer '+credentials(),'x-goog-user-project':PROJECT,'Content-Type':'application/json'},body:JSON.stringify({writes}),signal:AbortSignal.timeout(60000)});
  const data=await r.json();if(r.status===401&&attempt===0){tokenAt=0;continue;}if(!r.ok)throw Error('Firestore '+r.status+': '+(data.error?.status??'request_failed'));return data;
 }
}

export function summary(state){return {projectId:PROJECT,total:state.total,updated:Object.keys(state.applied).length,richDescriptions:state.complete,limitedDetails:state.limited,citiesUpdated:state.citiesDone.length,descriptionsFinishedAt:state.finishedAt??null,primaryFactsChecked:state.primaryFactsChecked??0,factsFinishedAt:state.factsFinishedAt??null,lastError:state.lastError??null};}
async function run(limit){
 ensureVolume();const lock=path.join(DIR,'worker.lock');
 try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('The place-details worker is already running.');}catch(err){if(err.code!=='ESRCH')throw err;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
 try{
  const input=fs.readFileSync(path.resolve(ROOT,process.env.KYMZI_DETAILS_CATALOGUE??'content/world-catalogue/catalogue.json')),catalogue=JSON.parse(input),fingerprint=hash(input),stateFile=path.join(DIR,'state.json');
  const cities=[...catalogue.cities].sort((a,b)=>(a.city==='Jaipur'?0:a.id.startsWith('city:')?2:1)-(b.city==='Jaipur'?0:b.id.startsWith('city:')?2:1));
  const state=fs.existsSync(stateFile)?read(stateFile):{version:1,projectId:PROJECT,catalogueSha256:fingerprint,total:cities.reduce((n,c)=>n+c.places.length,0),applied:{},complete:0,limited:0,citiesDone:[]};
  if(state.projectId!==PROJECT||state.catalogueSha256!==fingerprint)throw Error('Place-details source catalogue changed.');
  save(stateFile,state);let processed=0,failures=0;
  for(let start=0;start<cities.length;start+=10){
   ensureVolume();const group=cities.slice(start,start+10),pending=group.filter(c=>!state.citiesDone.includes(c.id));if(!pending.length)continue;
   const factCache=path.join(DIR,'facts',String(start).padStart(4,'0')+'.json');let snapshot;
   if(fs.existsSync(factCache))snapshot=read(factCache);else{
    const ids=[...new Set(group.flatMap(c=>c.places.map(p=>p.id)).filter(id=>/^Q\d+$/.test(id)))];
    let data={results:{bindings:[]}};
    if(ids.length&&!state.factsDeferred){try{data=await source('https://qlever.dev/api/wikidata?'+new URLSearchParams({query:factQuery(ids),format:'json'}));}catch(error){state.factsDeferred={at:new Date().toISOString(),reason:'Facts service busy; continuing with encyclopedia descriptions and verified catalogue facts.'};save(stateFile,state);log({factsDeferred:true,descriptionFetchContinues:true});}}
    if(!Array.isArray(data.results?.bindings))throw Error('Invalid Wikidata fact snapshot.');snapshot={retrievedAt:new Date().toISOString(),items:factsFromRows(data.results.bindings)};save(factCache,snapshot);await sleep(1000);
   }
   for(const city of pending){
    let done=false;
    while(!done){
     try{
      ensureVolume();const cache=path.join(DIR,'cities',city.id.replace(':','_')+'.json');let prepared;
      if(fs.existsSync(cache))prepared=read(cache);else{
       const titles=city.places.map(p=>snapshot.items[p.id]?.title??p.name).map(name=>name.replaceAll('|',' '));
       const data=await source('https://en.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',prop:'extracts|pageprops|info',ppprop:'wikibase_item|disambiguation',inprop:'url',exintro:'1',explaintext:'1',exlimit:'20',exchars:'1200',redirects:'1',titles:titles.join('|'),format:'json',formatversion:'2',maxlag:'5',maxage:'86400',smaxage:'86400'}));
       const pages=data.query?.pages??[],at=new Date().toISOString();
       prepared={cityId:city.id,city:city.city,at,places:city.places.map(p=>{const page=pages.find(page=>/^Q\d+$/.test(p.id)?page.pageprops?.wikibase_item===p.id:fold(page.title??'')===fold(p.name));return {id:p.id,name:p.name,wikidataId:page?.pageprops?.wikibase_item??(/^Q\d+$/.test(p.id)?p.id:null),details:makeDetails(p,city,snapshot.items[p.id],page,at)};})};save(cache,prepared);await sleep(1000);
      }
      const pendingPlaces=prepared.places.filter(p=>state.applied[city.id+'/'+p.id]!==hash(JSON.stringify(p.details)));
      if(pendingPlaces.length){
       const result=await apply(pendingPlaces.map(p=>detailWrite(`cities/${city.id}/attractions/${p.id}`,p.details)));
       if(result.status?.length!==pendingPlaces.length)throw Error('Unexpected details write result.');
       const errors=[];result.status.forEach((status,i)=>{const p=pendingPlaces[i];if(!status.code){state.applied[city.id+'/'+p.id]=hash(JSON.stringify(p.details));if(p.details.status==='complete')state.complete++;else state.limited++;}else errors.push(status.code);});save(stateFile,state);if(errors.length)throw Error('Some place-detail writes failed: '+errors.join(','));
      }
      state.citiesDone.push(city.id);state.lastError=null;state.updatedAt=new Date().toISOString();save(stateFile,state);failures=0;processed++;done=true;
      log({city:city.city,places:prepared.places.length,examples:prepared.places.slice(0,3).map(p=>p.name),...summary(state)});
      if(limit&&processed>=limit)return;
     }catch(error){state.lastError={at:new Date().toISOString(),message:error.message};save(stateFile,state);log({error:error.message,consecutiveFailures:++failures});if(failures>=10||/catalogue changed|Unexpected attraction|already running|ExtremeSSD/.test(error.message))throw error;await sleep(60000);}
    }
   }
  }
  state.finishedAt=new Date().toISOString();save(stateFile,state);log({finished:true,...summary(state)});
 }finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
}
async function main(){const args=process.argv.slice(2);if(args[0]==='--status'){log(summary(read(path.join(DIR,'state.json'))));return;}if(args[0]!=='--run'||args.some(a=>a!=='--run'&&!/^--limit-cities=\d+$/.test(a)))throw Error('Usage: node scripts/enrich-place-details.mjs --run [--limit-cities=N] | --status');const limit=Number(args.find(a=>a.startsWith('--limit-cities='))?.split('=')[1]??0);await run(limit);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi details: '+error.message.replace(/ya29\.[\w.-]+/g,'[REDACTED]'));process.exitCode=1;});
