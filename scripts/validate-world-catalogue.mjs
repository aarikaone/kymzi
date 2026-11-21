import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {relaunchWithSupportedNode} from './node-runtime.mjs';
import {validateDestinationExpansion} from './destination-expansion-lib.mjs';
const restart=await relaunchWithSupportedNode(fileURLToPath(import.meta.url),process.argv.slice(2));if(restart!==null)process.exit(restart);
await import('./catalogue-test-setup.ts');
const {TRAVEL_CITIES,WORLD_CATALOGUE,loadTravelCityPlaces,travelCityDistanceKm}=await import('../packages/core/src/world-catalogue.ts');
const root=new URL('../',import.meta.url),bytes=fs.readFileSync(new URL('content/world-catalogue/catalogue.json',root)),base=JSON.parse(bytes),baseReport=JSON.parse(fs.readFileSync(new URL('content/world-catalogue/report.json',root),'utf8')),extraBytes=fs.readFileSync(new URL('content/world-catalogue/expansion-v2.json',root)),extra=JSON.parse(extraBytes),extraReport=JSON.parse(fs.readFileSync(new URL('content/world-catalogue/expansion-v2-report.json',root),'utf8'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),baseReport.datasetSha256);assert.equal(extra.baseCatalogueSha256,baseReport.datasetSha256);
const audited=validateDestinationExpansion(base,extra,extraReport,extraBytes),ids=new Set(),geo=new Set(),places=new Set(),baseIds=new Set(base.cities.map(c=>c.id));let total=0;
for(const city of TRAVEL_CITIES){assert(!ids.has(city.id));ids.add(city.id);assert(!geo.has(city.geonameId));geo.add(city.geonameId);new Intl.DateTimeFormat('en',{timeZone:city.timeZone}).format();const rows=await loadTravelCityPlaces(city.id);assert.equal(rows.length,baseIds.has(city.id)?20:4,city.city);assert.equal(rows.length,city.placeIds.length);for(const p of rows){assert(!places.has(p.id));places.add(p.id);assert.equal(p.cityId,city.id);assert.equal(p.sourceCountryCode,city.countryCode);assert(p.name.trim()&&p.fact.trim());assert(p.sourceUrl.startsWith('https://'));if(p.latitude!==undefined&&p.longitude!==undefined){const distance=travelCityDistanceKm(city.id,p.latitude,p.longitude);assert(distance<=35.05);if(p.distanceKm!==undefined)assert(Math.abs(distance-p.distanceKm)<.05);}total++;}}
assert.equal(TRAVEL_CITIES.length,2526);assert.equal(total,26520);assert.equal(total,WORLD_CATALOGUE.places);console.log(JSON.stringify({verified:true,...audited,countriesAndTerritories:WORLD_CATALOGUE.countries,frozenOriginalChecksum:baseReport.datasetSha256}));
