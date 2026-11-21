#!/usr/bin/env node
// Add primary Wikidata facts after the description pass; all requests are cached.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {source,apply,factsFromRows,makeDetails,detailWrite} from './enrich-place-details.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url)),DIR=path.resolve(ROOT,process.env.KYMZI_DETAILS_FOLDER??'artifacts/place-details-v1');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.part',JSON.stringify(value)+'\n');fs.renameSync(file+'.part',file);}
function log(value){console.log(JSON.stringify({at:new Date().toISOString(),...value}));}
const properties=['P571','P1619','P84','P149','P2048','P2046','P186','P1435'];
let nextAt=0;
const pending=new Map();
async function entity(id){
 if(!/^Q\d+$/.test(id??''))return null;if(pending.has(id))return pending.get(id);
 const task=(async()=>{const file=path.join(DIR,'entities',id+'.json');if(fs.existsSync(file))return read(file).entity;
  const delay=Math.max(0,nextAt-Date.now());nextAt=Math.max(Date.now(),nextAt)+450;await pause(delay);
  let data;try{data=await source(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`);}catch(error){if(!/Public source request failed: (404|no-such-entity)$/.test(error.message))throw error;save(file,{id,retrievedAt:new Date().toISOString(),entity:null});return null;}
  const result=Object.values(data.entities??{}).find(e=>e.missing===undefined)??null;save(file,{id,retrievedAt:new Date().toISOString(),entity:result});return result;
 })();pending.set(id,task);try{return await task;}finally{pending.delete(id);}
}
async function pool(items,fn){const values=new Array(items.length);let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<items.length){const i=next++;values[i]=await fn(items[i]);}}));return values;}
export function entityFactRows(item,labels){
 const rows=[];if(!item)return rows;
 for(const property of properties)for(const claim of item.claims?.[property]??[]){
  if(claim.rank==='deprecated'||claim.mainsnak?.snaktype!=='value')continue;
  const value=claim.mainsnak.datavalue?.value;if(!value)continue;
  const row={place:{value:'http://www.wikidata.org/entity/'+item.id},property:{value:'http://www.wikidata.org/entity/'+property},rank:{value:'http://wikiba.se/ontology#'+(claim.rank==='preferred'?'PreferredRank':'NormalRank')}};
  if(value.id){row.value={value:'http://www.wikidata.org/entity/'+value.id};if(labels[value.id])row.label={value:labels[value.id]};}
  else if(value.time){row.value={value:value.time};row.precision={value:String(value.precision)};}
  else if(value.amount){row.value={value:value.amount};const unit=value.unit?.split('/').at(-1);if(labels[unit])row.unitLabel={value:labels[unit]};}
  else continue;rows.push(row);
 }
 return rows;
}
async function run(onlyCity){
 const lock=path.join(DIR,'facts-worker.lock');
 if(!fs.existsSync('/Volumes/ExtremeSSD/Kymzi-world-art/.kymzi-volume'))throw Error('Keep ExtremeSSD connected.');
 try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('Facts worker is already running.');}catch(err){if(err.code!=='ESRCH')throw err;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
 try{
  const stateFile=path.join(DIR,'state.json'),input=fs.readFileSync(path.resolve(ROOT,process.env.KYMZI_DETAILS_CATALOGUE??'content/world-catalogue/catalogue.json')),catalogue=JSON.parse(input),state=read(stateFile);
  if(state.projectId!=='kymzi-f1e9d'||state.catalogueSha256!==hash(input))throw Error('Place catalogue provenance changed.');
  state.factApplied??={};state.factCitiesDone??=[];state.placeStatus??={};
  const cities=[...catalogue.cities].filter(c=>!onlyCity||c.city.toLowerCase()===onlyCity.toLowerCase()).sort((a,b)=>(a.city==='Jaipur'?0:1)-(b.city==='Jaipur'?0:1));
  for(const city of cities){
   if(state.factCitiesDone.includes(city.id))continue;
   if(!state.citiesDone.includes(city.id))throw Error('Run the description pass before adding facts.');
   let failures=0,done=false;
   while(!done){try{
    if(!fs.existsSync('/Volumes/ExtremeSSD/Kymzi-world-art/.kymzi-volume'))throw Error('Keep ExtremeSSD connected.');
    const cache=path.join(DIR,'cities',city.id.replace(':','_')+'.json'),prepared=read(cache);
    const items=await pool(prepared.places,p=>entity(p.wikidataId??(/^Q\d+$/.test(p.id)?p.id:null)));
    const ids=new Set();for(const item of items)for(const property of properties)for(const claim of item?.claims?.[property]??[]){const value=claim.mainsnak?.datavalue?.value;if(value?.id)ids.add(value.id);const unit=value?.unit?.split('/').at(-1);if(/^Q\d+$/.test(unit??''))ids.add(unit);}
    const related=await pool([...ids],entity),labels=Object.fromEntries(related.filter(Boolean).map(item=>[item.id,item.labels?.en?.value??item.labels?.['en-gb']?.value]).filter(([,label])=>label));
    const repairs=items.filter((item,i)=>item?.sitelinks?.enwiki?.title&&prepared.places[i].details.status==='limited').map(item=>item.sitelinks.enwiki.title);
    let pages=[];
    if(repairs.length){const data=await source('https://en.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',prop:'extracts|pageprops',ppprop:'wikibase_item|disambiguation',exintro:'1',explaintext:'1',exlimit:'20',exchars:'1200',redirects:'1',titles:repairs.join('|'),format:'json',formatversion:'2',maxlag:'5'}));pages=data.query?.pages??[];}
    const at=new Date().toISOString(),records=prepared.places.map((p,i)=>{
     const item=items[i],original=city.places.find(source=>source.id===p.id);if(!item)return p;
     const extra=factsFromRows(entityFactRows(item,labels))[item.id]?.facts??[],page=pages.find(page=>page.pageprops?.wikibase_item===item.id);
     let details;
     if(p.details.status==='limited')details=makeDetails({...original,id:item.id},city,{facts:extra},page,at);
     else details={...p.details,updatedAt:at,facts:extra.length?[{label:'Type',value:original.kind},...extra].slice(0,7):p.details.facts};
     if(!details.credits.some(c=>c.url===`https://www.wikidata.org/wiki/${item.id}`))details.credits.push({title:'Wikidata',url:`https://www.wikidata.org/wiki/${item.id}`,license:'CC0',attribution:'Wikidata contributors'});
     return {...p,wikidataId:item.id,details};
    });
    const selected=records.filter(p=>state.factApplied[city.id+'/'+p.id]!==hash(JSON.stringify(p.details)));
    if(selected.length){const result=await apply(selected.map(p=>detailWrite(`cities/${city.id}/attractions/${p.id}`,p.details)));if(result.status?.length!==selected.length)throw Error('Unexpected fact-write response.');
     const errors=[];result.status.forEach((status,i)=>{const p=selected[i],key=city.id+'/'+p.id;if(!status.code){const previous=state.placeStatus[key]??prepared.places.find(v=>v.id===p.id).details.status;if(previous!==p.details.status){if(p.details.status==='complete'){state.complete++;state.limited--;}else{state.complete--;state.limited++;}}state.placeStatus[key]=p.details.status;state.factApplied[key]=hash(JSON.stringify(p.details));state.applied[key]=state.factApplied[key];}else errors.push(status.code);});save(stateFile,state);if(errors.length)throw Error('Some fact writes failed: '+errors.join(','));}
    prepared.places=records;save(cache,prepared);state.factCitiesDone.push(city.id);state.primaryFactsChecked=Object.keys(state.factApplied).length;state.lastError=null;save(stateFile,state);done=true;
    log({factsCity:city.city,primaryFactsChecked:state.primaryFactsChecked,examples:records.slice(0,2).map(p=>({name:p.name,facts:p.details.facts}))});
   }catch(error){state.lastError={at:new Date().toISOString(),message:error.message};save(stateFile,state);log({error:error.message,consecutiveFailures:++failures});if(failures>=10||/ExtremeSSD|provenance|before adding/.test(error.message))throw error;await pause(60000);}}
  }
  if(!onlyCity){state.factsFinishedAt=new Date().toISOString();save(stateFile,state);log({factsFinished:true,checked:state.primaryFactsChecked});}
 }finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
}
async function main(){const arg=process.argv.slice(2);if(arg.some(v=>!v.startsWith('--city=')))throw Error('Usage: node scripts/enrich-place-facts.mjs [--city=Jaipur]');await run(arg.find(v=>v.startsWith('--city='))?.slice(7));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error('Kymzi place facts: '+error.message);process.exitCode=1;});
