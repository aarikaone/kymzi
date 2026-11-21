import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateDestinationExpansion} from './destination-expansion-lib.mjs';
const root=new URL('../',import.meta.url),read=file=>JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
const base=read('content/world-catalogue/catalogue.json'),source=read('content/world-catalogue/expansion-v2.json'),report=read('content/world-catalogue/expansion-v2-report.json');
const encode=data=>Buffer.from(JSON.stringify(data)),freshReport=data=>({...report,datasetSha256:createHash('sha256').update(encode(data)).digest('hex')});
test('validates all 1,500 new destinations and 6,000 attractions against the frozen original catalogue',()=>{
 const verified=validateDestinationExpansion(base,source,report,fs.readFileSync(new URL('content/world-catalogue/expansion-v2.json',root)));assert.equal(verified.identityOverlaps,0);assert.equal(verified.nearbySameNameOverlaps,0);assert.equal(verified.combinedAttractions,26520);
});
test('rejects a repeated GeoNames or Wikidata destination identity before cloud writes',()=>{
 const data=structuredClone(source);data.cities[1].wikidataId=data.cities[0].wikidataId;assert.throws(()=>validateDestinationExpansion(base,data,freshReport(data),encode(data)),/Duplicate destination identity/);
 data.cities[1].wikidataId=source.cities[1].wikidataId;data.cities[1].geonameId=base.cities[0].geonameId;data.cities[1].id=`city:${data.cities[1].geonameId}`;assert.throws(()=>validateDestinationExpansion(base,data,freshReport(data),encode(data)),/Duplicate destination identity/);
});
test('rejects a reused attraction ID, even with a different display name',()=>{
 const data=structuredClone(source),place=data.cities[0].places[0];place.id=base.cities[0].places.find(p=>p.source==='Wikidata').id;place.sourceUrl=`https://www.wikidata.org/wiki/${place.id}`;assert.throws(()=>validateDestinationExpansion(base,data,freshReport(data),encode(data)),/Duplicate or invalid attraction/);
});
test('rejects the same physical attraction under a new ID and preserves distinct same-name destinations',()=>{
 const data=structuredClone(source),first=data.cities[0],second=data.cities.find(c=>c.id!==first.id&&c.countryCode===first.countryCode);assert.ok(second);second.places[0]={...first.places[0],id:'Q999999999999',sourceUrl:'https://www.wikidata.org/wiki/Q999999999999'};second.latitude=first.latitude;second.longitude=first.longitude;
 assert.throws(()=>validateDestinationExpansion(base,data,freshReport(data),encode(data)),/Nearby duplicate attraction name/);
 const banff=source.cities.filter(c=>c.city==='Banff');assert.ok(banff.length>=1);assert.ok(new Set(source.cities.map(c=>c.geonameId)).size===1500);
});
test('requires four attractions and matching source checksums',()=>{
 const data=structuredClone(source);data.cities[0].places.pop();assert.throws(()=>validateDestinationExpansion(base,data,freshReport(data),encode(data)),/four different attractions/);assert.throws(()=>validateDestinationExpansion(base,source,report,Buffer.from('changed')),/checksum/);
});
