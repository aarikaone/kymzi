// Hosting serves the app and a frozen set of legacy URLs. New images live in Storage.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function copy(source,target){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
export function prepareHosting(root=ROOT){
 const cdn=path.join(root,'artifacts/cloud-cdn'),build=path.join(root,'dist'),output=path.join(root,'artifacts/firebase-hosting/public');
 const legacy=path.join(root,'content/cloud-images/legacy-hosting-files.json');
 const manifest=JSON.parse(fs.readFileSync(fs.existsSync(legacy)?legacy:path.join(cdn,'manifest.json'),'utf8'));
 if(manifest.projectId!=='kymzi-f1e9d'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('A complete Kymzi CDN manifest is required.');
 const html=fs.readFileSync(path.join(build,'index.html'),'utf8');
 if(!html.includes('id="root"')||!html.includes('type="module"'))throw Error('Build the Kymzi web app before staging Hosting.');
 // Validate the entire CDN inventory before changing any staged files.
 for(const asset of manifest.files){
  if(!/^images\/[a-zA-Z0-9_./-]+$/.test(asset.path)||asset.path.split('/').includes('..'))throw Error('Invalid CDN asset path.');
  const source=path.join(cdn,'public',asset.path),target=path.join(output,asset.path);
  if(hash(source)!==asset.sha256)throw Error('CDN source hash mismatch: '+asset.path);
  if(fs.existsSync(target)&&hash(target)!==asset.sha256)throw Error('Refusing to change an immutable CDN image: '+asset.path);
 }
 fs.mkdirSync(output,{recursive:true});
 // Preserve previous hashed files so open app sessions and old image URLs work.
 for(const asset of manifest.files)copy(path.join(cdn,'public',asset.path),path.join(output,asset.path));
 for(const file of ['catalogue-images.json','404.html','robots.txt'])if(fs.existsSync(path.join(cdn,'public',file)))copy(path.join(cdn,'public',file),path.join(output,file));
 fs.cpSync(build,output,{recursive:true});
 for(const asset of manifest.files)if(hash(path.join(output,asset.path))!==asset.sha256)throw Error('Staged CDN image changed: '+asset.path);
 const receipt={projectId:manifest.projectId,webUrl:'https://kymzi-f1e9d.web.app',cdnFilesPreserved:manifest.files.length,indexSha256:hash(path.join(output,'index.html')),preparedAt:new Date().toISOString()};
 fs.writeFileSync(path.join(root,'artifacts/firebase-hosting/prepared.json'),JSON.stringify(receipt,null,2)+'\n');
 return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(prepareHosting()));}catch(error){console.error('Kymzi hosting: '+error.message);process.exitCode=1;}}
