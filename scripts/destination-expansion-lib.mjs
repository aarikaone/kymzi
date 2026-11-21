import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
const normal=value=>{const folded=value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return folded.replace(/[^a-z0-9]/g,'')||folded.replace(/[^\p{L}\p{N}]/gu,'');};
export function distanceKm(a,b,c,d){const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(x)));}
/** Validate the combined catalogue, before a single cloud write is permitted. */
export function validateDestinationExpansion(base,expansion,report,bytes){
 if(expansion.expansionId!=='kymzi-destinations-v2'||report.expansionId!==expansion.expansionId)throw Error('Unexpected destination expansion.');
 if(sha(bytes)!==report.datasetSha256)throw Error('Destination snapshot checksum changed.');
 if(base.cities.length!==1026||expansion.cities.length!==1500)throw Error('Expected the original 1,026 and exactly 1,500 additional destinations.');
 const ids=new Set(base.cities.map(c=>c.id)),geo=new Set(base.cities.map(c=>c.geonameId)),qids=new Set(Object.values(expansion.existingDestinationIdentities??{})),places=new Set(base.cities.flatMap(c=>c.places.map(p=>p.id))),names=new Map();
 const addName=(city,p)=>{const key=city.countryCode+':'+normal(p.name),list=names.get(key)??[];list.push({city,p});names.set(key,list);};
 for(const c of base.cities)for(const p of c.places)addName(c,p);
 const scores=[...Object.entries(expansion.existingPopularity)];let additional=0,withoutCoordinates=0;
 const destinations=[...base.cities];
 if(!Object.keys(expansion.existingDestinationIdentities??{}).length)throw Error('Missing original destination identities.');
 for(const c of expansion.cities){
  if(!/^city:\d+$/.test(c.id)||c.id!==`city:${c.geonameId}`||ids.has(c.id)||geo.has(c.geonameId)||qids.has(c.wikidataId))throw Error('Duplicate destination identity: '+c.city);
  if(!/^Q\d+$/.test(c.wikidataId??'')||!c.city.trim()||!/^[A-Z]{2}$/.test(c.countryCode)||!['AF','AS','EU','NA','SA','OC'].includes(c.continent))throw Error('Invalid destination metadata: '+c.id);
  if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180)throw Error('Invalid destination point.');
  new Intl.DateTimeFormat('en',{timeZone:c.timeZone}).format();
  const labels=new Set([c.city,c.ascii,...(c.aliases??[])].filter(Boolean).map(normal));
  for(const old of destinations)if(old.countryCode===c.countryCode&&distanceKm(c.latitude,c.longitude,old.latitude,old.longitude)<=3&&[old.city,old.ascii,...(old.aliases??[])].filter(Boolean).some(v=>labels.has(normal(v))))throw Error('Nearby duplicate destination alias: '+c.city);
  destinations.push(c);
  if(c.places.length!==4||new Set(c.places.map(p=>normal(p.name))).size!==4)throw Error('Expected four different attractions in '+c.city);
  ids.add(c.id);geo.add(c.geonameId);qids.add(c.wikidataId);scores.push([c.id,c.popularity]);
  for(const p of c.places){
   if(places.has(p.id)||!/^Q\d+$/.test(p.id)||p.sourceUrl!==`https://www.wikidata.org/wiki/${p.id}`)throw Error('Duplicate or invalid attraction identity: '+p.id);
   if(p.countryCode!==c.countryCode||!p.name.trim()||!p.description.trim())throw Error('Missing attraction provenance.');
   if(p.latitude===null||p.longitude===null){withoutCoordinates++;if(p.coordinateStatus!=='Not provided by source'||!p.descriptionSourceUrl?.startsWith('https://en.wikipedia.org/wiki/'))throw Error('Unsourced missing coordinates.');}
   else if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180||distanceKm(c.latitude,c.longitude,p.latitude,p.longitude)>35.05)throw Error('Attraction lies outside its sourced destination area: '+p.name);
   for(const old of names.get(c.countryCode+':'+normal(p.name))??[]){
    const located=Number.isFinite(p.latitude)&&Number.isFinite(old.p.latitude);
    const same=located?distanceKm(p.latitude,p.longitude,old.p.latitude,old.p.longitude)<=.75:distanceKm(c.latitude,c.longitude,old.city.latitude,old.city.longitude)<=35;
    if(same)throw Error('Nearby duplicate attraction name: '+p.name);
   }
   places.add(p.id);addName(c,p);additional++;
  }
 }
 if(additional!==6000||ids.size!==2526||places.size!==26520)throw Error('Combined catalogue counts do not match.');
 if(scores.length!==2526||new Set(scores.map(([id])=>id)).size!==2526||new Set(scores.map(([,p])=>p.rank)).size!==2526)throw Error('Popularity ranks are incomplete or duplicated.');
 for(const [,p] of scores)if(!Number.isFinite(p.score)||p.score<0||!Number.isInteger(p.rank)||p.rank<1||p.rank>2526||p.method!=='wikimedia-travel-coverage-v1')throw Error('Invalid popularity provenance.');
 for(const id of ['city:1262463','city:1264540'])if(!expansion.cities.some(c=>c.id===id))throw Error('Munnar or Coorg is missing.');
 return {additionalDestinations:1500,additionalAttractions:6000,combinedDestinations:ids.size,combinedAttractions:places.size,attractionsWithoutPublishedCoordinates:withoutCoordinates,identityOverlaps:0,nearbySameNameOverlaps:0};
}
