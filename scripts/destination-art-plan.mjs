import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateDestinationExpansion} from './destination-expansion-lib.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
export function destinationArtJobs(expansion,style){
 const preferred=['city:1262463','city:1264540'];
 const cities=[...expansion.cities].sort((a,b)=>(preferred.includes(a.id)?preferred.indexOf(a.id):-1+preferred.length+1)-(preferred.includes(b.id)?preferred.indexOf(b.id):-1+preferred.length+1)||(a.popularity?.rank??9999)-(b.popularity?.rank??9999));
 const jobs=[],ids=new Set(),outputs=new Set();
 for(const city of cities){
  if(!/^city:\d+$/.test(city.id)||city.id!==`city:${city.geonameId}`||city.places.length!==4)throw Error('Invalid destination image source.');
  for(const place of [null,...city.places]){
   const kind=place?'place':'city',id=`${kind}/${place?.id??city.id}`,output=place?`places/${place.id}.jpg`:`cities/${city.geonameId}.jpg`;
   if(ids.has(id)||outputs.has(output)||place&&!/^Q\d+$/.test(place.id))throw Error('Duplicate or unsafe destination image slot.');ids.add(id);outputs.add(output);
   const hero=city.places.find(p=>/park|garden|trail|lake|beach/.test(p.categoryId))??city.places[0];
   const subject=place?`Subject: ${place.name}. Place type: ${place.kind}. Sourced description: ${clean(place.description).slice(0,220)}.`:`Subject: a travel cover for ${city.city}, showing ${hero.name} in its local setting. Nearby guide places: ${city.places.map(p=>p.name).join(', ')}. Show a single coherent local scene, not a montage of all four places.`;
   const prompt=`${style.trim()}\nDestination: ${city.city}, ${city.region}, ${city.country}. ${subject}\nOne continuous illustrated landscape. No titles, labels, readable inscriptions, logos or watermark. Show the place and its setting, not portraits or reenactments. For memorials, use a respectful exterior or landscape without conflict imagery.`;
   jobs.push({id,kind,cityId:city.id,geonameId:city.geonameId,name:place?.name??city.city,city:city.city,country:city.country,countryCode:city.countryCode,sourceUrl:place?.sourceUrl??city.citySourceUrl,documentPath:place?`cities/${city.id}/attractions/${place.id}`:`cities/${city.id}`,output,prompt});
  }
 }
 if(jobs.length!==7500)throw Error('Expected exactly 7,500 expansion image slots.');
 return jobs;
}
export function destinationArtSource(root=ROOT){
 const file=path.join(root,'content/world-catalogue/expansion-v2.json'),bytes=fs.readFileSync(file),expansion=JSON.parse(bytes),base=JSON.parse(fs.readFileSync(path.join(root,'content/world-catalogue/catalogue.json'),'utf8')),report=JSON.parse(fs.readFileSync(path.join(root,'content/world-catalogue/expansion-v2-report.json'),'utf8'));
 validateDestinationExpansion(base,expansion,report,bytes);
 return {catalogueSha256:sha(bytes),jobs:destinationArtJobs(expansion,fs.readFileSync(path.join(root,'content/world-art/style.txt'),'utf8'))};
}
