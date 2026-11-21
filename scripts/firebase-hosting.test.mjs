import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareHosting} from './prepare-firebase-hosting.mjs';
const digest=value=>createHash('sha256').update(value).digest('hex');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kymzi-hosting-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const folder of ['dist/assets','artifacts/cloud-cdn/public/images/cities'])fs.mkdirSync(path.join(root,folder),{recursive:true});
 const asset={path:'images/cities/test-0123456789abcdef.jpg',sha256:digest('image bytes')};
 fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/public',asset.path),'image bytes');
 fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/manifest.json'),JSON.stringify({projectId:'kymzi-f1e9d',files:[asset]}));
 fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/public/index.html'),'old asset-site health page');
 fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/public/catalogue-images.json'),'{}');
 fs.writeFileSync(path.join(root,'dist/index.html'),'<div id="root"></div><script type="module" src="/assets/app-abcd.js"></script>');
 fs.writeFileSync(path.join(root,'dist/assets/app-abcd.js'),'app code');return {root,asset};
}
test('one release serves the app while preserving every immutable CDN image',t=>{
 const {root,asset}=fixture(t),receipt=prepareHosting(root),out=path.join(root,'artifacts/firebase-hosting/public');
 assert.equal(receipt.cdnFilesPreserved,1);assert.match(fs.readFileSync(path.join(out,'index.html'),'utf8'),/id="root"/);
 assert.equal(digest(fs.readFileSync(path.join(out,asset.path))),asset.sha256);assert.equal(fs.readFileSync(path.join(out,'assets/app-abcd.js'),'utf8'),'app code');
 assert.ok(fs.existsSync(path.join(out,'catalogue-images.json')));
 fs.writeFileSync(path.join(out,'assets/previous-abcd.js'),'old session code');prepareHosting(root);assert.ok(fs.existsSync(path.join(out,'assets/previous-abcd.js')));
});
test('refuses incomplete, modified or foreign-project CDN releases before staging',t=>{
 const {root,asset}=fixture(t);fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/public',asset.path),'different bytes');
 assert.throws(()=>prepareHosting(root),/source hash mismatch/);assert.ok(!fs.existsSync(path.join(root,'artifacts/firebase-hosting/public')));
 fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/manifest.json'),JSON.stringify({projectId:'other-project',files:[asset]}));assert.throws(()=>prepareHosting(root),/Kymzi CDN manifest/);
});
test('never replaces a previously staged immutable image with different bytes',t=>{
 const {root,asset}=fixture(t);prepareHosting(root);fs.writeFileSync(path.join(root,'artifacts/firebase-hosting/public',asset.path),'changed staged bytes');assert.throws(()=>prepareHosting(root),/immutable CDN image/);
});

test('keeps only frozen legacy Hosting images when new images are added to Storage',t=>{
 const {root,asset}=fixture(t);fs.mkdirSync(path.join(root,'content/cloud-images'),{recursive:true});fs.writeFileSync(path.join(root,'content/cloud-images/legacy-hosting-files.json'),JSON.stringify({projectId:'kymzi-f1e9d',files:[asset]}));
 const fresh={path:'images/cities/new-storage-only.jpg',sha256:digest('new image')};fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/public',fresh.path),'new image');fs.writeFileSync(path.join(root,'artifacts/cloud-cdn/manifest.json'),JSON.stringify({projectId:'kymzi-f1e9d',files:[asset,fresh]}));
 const receipt=prepareHosting(root);assert.equal(receipt.cdnFilesPreserved,1);assert.ok(!fs.existsSync(path.join(root,'artifacts/firebase-hosting/public',fresh.path)));
});
