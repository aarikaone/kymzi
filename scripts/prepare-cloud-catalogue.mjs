#!/usr/bin/env node
// Offline preparation only: no network calls, credentials, or image generation.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {imageSize} from 'image-size';
import pngjs from 'pngjs';
import {IMAGE_DELIVERY} from './image-delivery-config.mjs';
const {PNG}=pngjs;
const atlasCache=new Map();
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const PROJECT=IMAGE_DELIVERY.projectId,ORIGIN=IMAGE_DELIVERY.cdnOrigin,LEGACY_ORIGIN=IMAGE_DELIVERY.legacyOrigin;
const OUT=path.join(ROOT,'artifacts/cloud-cdn'),PUBLIC=path.join(OUT,'public');
const CATALOGUE=path.join(ROOT,'content/world-catalogue/catalogue.json');
const catalogue=JSON.parse(fs.readFileSync(CATALOGUE,'utf8'));
const approved=JSON.parse(fs.readFileSync(path.join(ROOT,'content/world-art/approved.json'),'utf8'));
const pilot=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/world-art/pilot-100-v1/results.json'),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=new Map(),publicImages={},images={};
function json(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
function put(source,label){
 const bytes=fs.readFileSync(source),digest=sha(bytes),ext=path.extname(source).toLowerCase();
 const size=ext==='.svg'||ext==='.ico'?{}:imageSize(bytes);
 const safe=label.replace(/[^a-zA-Z0-9/_-]/g,'-').replace(/^\/+|\/+$/g,'');
 const target=`images/${safe}-${digest.slice(0,16)}${ext}`,absolute=path.join(PUBLIC,target);
 if(fs.existsSync(absolute)){if(sha(fs.readFileSync(absolute))!==digest)throw Error('Refusing to change immutable image: '+target);}
 else{fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.copyFileSync(source,absolute);}
 files.set(target,{path:target,sha256:digest,bytes:bytes.length,width:size.width??null,height:size.height??null});
 return {path:target,sha256:digest,width:size.width??null,height:size.height??null};
}
function jpeg(source,target,{crop}={}){
 fs.mkdirSync(path.dirname(target),{recursive:true});
 const sourceHash=sha(fs.readFileSync(source))+JSON.stringify(crop??null),stamp=target+'.source-sha256';
 if(fs.existsSync(target)&&fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8')===sourceHash)return target;
 let input=source;
 if(crop){
  let atlas=atlasCache.get(source);if(!atlas){atlas=PNG.sync.read(fs.readFileSync(source));atlasCache.set(source,atlas);}
  const tile=new PNG({width:512,height:384});PNG.bitblt(atlas,tile,crop.column*512,crop.row*384,512,384,0,0);
  input=target+'.crop.png';fs.writeFileSync(input,PNG.sync.write(tile));
 }
 execFileSync('sips',[...(!crop?['-Z','768']:[]),'-s','format','jpeg','-s','formatOptions','72',input,'--out',target],{stdio:'pipe'});
 if(crop)fs.unlinkSync(input);fs.writeFileSync(stamp,sourceHash);
 return target;
}
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
// Publish the existing public artwork only, never private environment files or prompts.
const webPublic=path.join(ROOT,'apps/web/public');
for(const file of walk(webPublic).filter(file=>/\.(png|jpe?g|webp|svg|ico)$/i.test(file)&&!file.includes('/world-art/'))){
 const relative=path.relative(webPublic,file).replaceAll(path.sep,'/');
 publicImages['/'+relative]=put(file,relative.replace(/\.[^.]+$/,''));
}
// Individual atlas tiles give every legacy attraction its own usable CDN image URL.
const legacyCities=catalogue.cities.filter(city=>!city.id.startsWith('city:'));
for(const [cityIndex,city] of legacyCities.entries()){
 const source=path.join(ROOT,'packages/assets/attractions',`atlas-${String(Math.floor(cityIndex/2)+1).padStart(2,'0')}.png`);
 for(const place of city.places.filter(place=>place.source!=='Wikidata')){
  const slot=Number(place.id.split('-').at(-1))-1,crop={column:slot%2,row:(cityIndex%2)*2+Math.floor(slot/2)};
  const asset=put(jpeg(source,path.join(OUT,'optimized/legacy',place.id+'.jpg'),{crop}),'places/'+place.id);
  if(asset.width!==512||asset.height!==384)throw Error('Legacy tile dimensions changed: '+place.id);
  images['place/'+place.id]={...asset,reviewStatus:'existing-guide-art',appReady:true,provider:'Kymzi generated atlas'};
 }
 const first=city.places.find(place=>place.source!=='Wikidata');
 images['city/'+city.id]={...images['place/'+first.id],reusedFrom:'place/'+first.id};
}
for(const image of pilot.images){
 const record=approved[image.id],source=record?path.join(ROOT,'packages/assets/world/v1',record.relativePath):path.join(ROOT,image.file);
 if(sha(fs.readFileSync(source))!==(record?.sha256??image.sha256))throw Error('Image hash mismatch: '+image.id);
 const optimized=record?source:jpeg(source,path.join(OUT,'optimized',image.output));
 images[image.id]={...put(optimized,image.output.replace(/\.[^.]+$/,'')),reviewStatus:record?'reviewed-illustration-preview':'needs-landmark-review',appReady:!!record,provider:'OpenAI Batch API',batchId:pilot.batchId};
}
for(const [key,record] of Object.entries(approved))if(!images[key]){
 const source=path.join(ROOT,'packages/assets/world/v1',record.relativePath);
 if(sha(fs.readFileSync(source))!==record.sha256)throw Error('Approved image hash mismatch: '+key);
 images[key]={...put(source,record.relativePath.replace(/\.[^.]+$/,'')),reviewStatus:'reviewed-illustration-preview',appReady:true,provider:record.provider};
}
// Bulk results are technical-checked guide illustrations, not documentary photos or
// manually verified landmarks. Keep that provenance explicit instead of claiming review.
const bulkFile=path.join(ROOT,'artifacts/world-art/remaining-v1/run.json');
if(fs.existsSync(bulkFile)){
 const bulk=JSON.parse(fs.readFileSync(bulkFile,'utf8'));
 if(bulk.projectId!==PROJECT||bulk.catalogueSha256!==sha(fs.readFileSync(CATALOGUE)))throw Error('Bulk artwork catalogue provenance mismatch.');
 for(const shard of bulk.shards.filter(shard=>shard.collectedAt)){
  const result=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/world-art/remaining-v1/shards',shard.id,'results.json'),'utf8'));
  if(result.runId!==bulk.runId||result.batchId!==shard.batchId||result.images.length!==shard.downloaded)throw Error('Bulk result provenance mismatch.');
  for(const image of result.images){
   if(images[image.id])throw Error('Bulk generation duplicated an existing image: '+image.id);
   if(!/^(cities|places)\/[a-zA-Z0-9_-]+\.jpg$/.test(image.output)||image.file!=='output/imagegen/remaining-v1/'+image.output)throw Error('Unsafe bulk source path.');
   const source=path.join(ROOT,image.file);
   if(sha(fs.readFileSync(source))!==image.sha256)throw Error('Bulk image source hash mismatch: '+image.id);
   const optimized=jpeg(source,path.join(OUT,'optimized/remaining-v1',image.output));
   images[image.id]={...put(optimized,image.output.replace(/\.[^.]+$/,'')),reviewStatus:'generated-guide-illustration',appReady:true,provider:'OpenAI Batch API',batchId:result.batchId,model:bulk.model,landmarkVerified:false};
  }
 }
}
const cdnImage=key=>images[key]?{...images[key],url:`${ORIGIN}/${images[key].path}`} : null;
const legacyFiles=new Set(JSON.parse(fs.readFileSync(path.join(ROOT,'content/cloud-images/legacy-hosting-files.json'),'utf8')).files.map(file=>file.path));
const legacyUrl=image=>image&&legacyFiles.has(image.path)?`${LEGACY_ORIGIN}/${image.path}`:null;
const documents=[];
for(const [catalogueOrder,city] of catalogue.cities.entries()){
 const {places,...details}=city,image=cdnImage('city/'+city.id);
 documents.push({path:`cities/${city.id}`,data:{schemaVersion:1,...details,catalogueOrder,placeIds:places.map(place=>place.id),attractionCount:places.length,generatedImageCount:places.filter(place=>images['place/'+place.id]).length,image,imageUrl:legacyUrl(image),...(image?{cdnImageUrl:image.url}:{}),imageStatus:image?'available':'not-generated'}});
 for(const place of places){const image=cdnImage('place/'+place.id);documents.push({path:`cities/${city.id}/attractions/${place.id}`,data:{schemaVersion:1,...place,cityId:city.id,city:city.city,country:city.country,continent:city.continent,image,imageUrl:legacyUrl(image),...(image?{cdnImageUrl:image.url}:{}),imageStatus:image?'available':'not-generated'}});}
}
documents.push({path:'appConfig/public',data:{schemaVersion:1,cdnOrigin:ORIGIN,storageBucket:IMAGE_DELIVERY.bucket,publicImages:Object.fromEntries(Object.entries(publicImages).map(([key,image])=>[key,`${LEGACY_ORIGIN}/${image.path}`])),publicCdnImages:Object.fromEntries(Object.entries(publicImages).map(([key,image])=>[key,`${ORIGIN}/${image.path}`]))}});
const seen=new Set();for(const doc of documents){if(!/^(?:cities\/[^/]+(?:\/attractions\/[^/]+)?|appConfig\/public)$/.test(doc.path)||seen.has(doc.path))throw Error('Invalid or duplicate Firestore document path: '+doc.path);seen.add(doc.path);doc.contentHash=sha(JSON.stringify(doc.data));doc.data.catalogueContentHash=doc.contentHash;}
const report={version:1,projectId:PROJECT,cdnOrigin:ORIGIN,catalogueSha256:sha(fs.readFileSync(CATALOGUE)),cities:catalogue.cities.length,newCities:catalogue.cities.filter(c=>c.id.startsWith('city:')).length,attractions:catalogue.cities.reduce((n,c)=>n+c.places.length,0),firestoreDocuments:documents.length,generatedPilotImages:pilot.images.length,totalNewGeneratedImages:Object.keys(images).filter(k=>!images[k].reusedFrom&&images[k].provider!=='Kymzi generated atlas').length,catalogueImageSlots:Object.keys(images).length,uniqueCdnFiles:files.size,bytes:[...files.values()].reduce((n,f)=>n+f.bytes,0),cacheControl:'public, max-age=31536000, s-maxage=31536000, immutable',firestoreRegion:'asia-south1',firestoreEdition:'standard'};
json(path.join(OUT,'manifest.json'),{...report,files:[...files.values()],publicImages,catalogueImages:images});
json(path.join(OUT,'firestore-documents.json'),{projectId:PROJECT,catalogueSha256:report.catalogueSha256,documents});
json(path.join(PUBLIC,'catalogue-images.json'),{version:1,images:Object.fromEntries(Object.keys(images).map(key=>[key,cdnImage(key)]))});
fs.writeFileSync(path.join(PUBLIC,'index.html'),'<!doctype html><html><head><meta name="robots" content="noindex"><title>Kymzi</title></head><body>Kymzi</body></html>\n');
fs.writeFileSync(path.join(PUBLIC,'404.html'),'<!doctype html><html><head><meta name="robots" content="noindex"><title>Not found</title></head><body>Image not found.</body></html>\n');
fs.writeFileSync(path.join(PUBLIC,'robots.txt'),'User-agent: *\nDisallow: /\n');
const data=`// Generated by scripts/prepare-cloud-catalogue.mjs. Public asset metadata only.\nexport const CATALOGUE_CDN_ORIGIN=${JSON.stringify(ORIGIN)};\nexport type CdnImageData={path:string;sha256:string;width:number|null;height:number|null;reviewStatus?:string;appReady?:boolean;provider?:string;batchId?:string;model?:string;landmarkVerified?:boolean;reusedFrom?:string};\nexport const CLOUD_PUBLIC_IMAGES:Record<string,CdnImageData>=${JSON.stringify(publicImages)};\nexport const CLOUD_CATALOGUE_IMAGES:Record<string,CdnImageData>=${JSON.stringify(images)};\n`;
fs.writeFileSync(path.join(ROOT,'packages/core/src/catalogue/cloud-assets-data.ts'),data);
json(path.join(ROOT,'content/world-art/cloud-coverage.json'),report);
console.log(JSON.stringify(report));
