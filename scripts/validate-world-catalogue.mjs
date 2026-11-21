import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {relaunchWithSupportedNode} from './node-runtime.mjs';
const restart=await relaunchWithSupportedNode(fileURLToPath(import.meta.url),process.argv.slice(2));if(restart!==null)process.exit(restart);
const {TRAVEL_CITIES,WORLD_CATALOGUE,loadTravelCityPlaces,travelCityDistanceKm}=await import('../packages/core/src/world-catalogue.ts');
const ids=new Set(),places=new Set();let total=0;const clean=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
assert.equal(WORLD_CATALOGUE.newCities,1000);assert.equal(TRAVEL_CITIES.length,1026);
for(const city of TRAVEL_CITIES){assert(!ids.has(city.id));ids.add(city.id);assert(/^[A-Z]{2}$/.test(city.countryCode));new Intl.DateTimeFormat('en',{timeZone:city.timeZone}).format();const rows=await loadTravelCityPlaces(city.id);assert(rows.length>=20,`${city.city}: fewer than 20 places`);assert.equal(rows.length,city.placeIds.length);const names=new Set();
 for(const p of rows){assert(!places.has(p.id),`Duplicate place ID ${p.id}`);places.add(p.id);assert.equal(p.cityId,city.id);assert.equal(p.sourceCountryCode,city.countryCode);assert(p.name.trim().length>=3);assert(!names.has(clean(p.name)),`${city.city}: duplicate place name ${p.name}`);names.add(clean(p.name));assert(p.fact.length>0);assert(p.sourceUrl.startsWith('https://'));assert(p.mapsUrl.startsWith('https://'));if(p.source==='Wikidata'){assert(/^Q\d+$/.test(p.id));assert(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude));assert(Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180);const km=travelCityDistanceKm(city.id,p.latitude,p.longitude);assert(km<=35.05,`${p.name}: too far from its city centre`);assert(Math.abs(km-p.distanceKm)<.05);}total++;}
}
assert.equal(total,WORLD_CATALOGUE.places);console.log(`Validated ${TRAVEL_CITIES.length} cities, ${total} places, ${WORLD_CATALOGUE.countries} countries. Every city has at least 20 places.`);

const root=new URL('../',import.meta.url),dataset=fs.readFileSync(new URL('content/world-catalogue/catalogue.json',root)),portable=JSON.parse(dataset),report=JSON.parse(fs.readFileSync(new URL('content/world-catalogue/report.json',root),'utf8'));
assert.equal(crypto.createHash('sha256').update(dataset).digest('hex'),report.datasetSha256);assert.equal(portable.cities.length,TRAVEL_CITIES.length);
for(const city of portable.cities){assert.equal(city.places.length,20);for(const place of city.places){assert(place.description);assert(place.sourceUrl.startsWith('https://'));assert(place.mapsUrl.startsWith('https://'));if(place.latitude===null)assert.equal(place.source,'Kymzi curated guide');}}
console.log(`Portable JSON and source report verified (${report.recordsWithCoordinates} sourced coordinates; ${report.curatedWithoutCoordinates} curated records use place-name Maps search).`);
