// Match file bytes, not filenames, so renamed/copied bundled content is detected.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
for(const output of ['dist/index.html','artifacts/cloud-native-export/metadata.json'])if(!fs.existsSync(path.join(root,output)))throw Error('Build output is required before verification: '+output);
const raster=/\.(png|jpe?g|webp)$/i;
const walk=folder=>fs.existsSync(folder)?fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]):[];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources=[];
for(const folder of ['avatars','categories','cities','portraits','attractions','world']){
 for(const base of ['packages/assets','apps/web/public'])sources.push(...walk(path.join(root,base,folder)).filter(file=>raster.test(file)));
}
for(const base of ['packages/assets/brand','apps/web/public/brand'])sources.push(...walk(path.join(root,base)).filter(file=>raster.test(file)&&path.basename(file).startsWith('rymzi-world-')));
const sourceHashes=new Set(sources.map(hash));
const failures=[];
for(const folder of ['dist','artifacts/cloud-native-export'])for(const file of walk(path.join(root,folder))){
 if((raster.test(file)||file.includes('/assets/'))&&sourceHashes.has(hash(file)))failures.push(path.relative(root,file));
}
if(failures.length)throw Error('Content bitmaps were bundled: '+failures.join(', '));
console.log(JSON.stringify({verified:true,sourceContentImages:sources.length,bundledContentImages:failures.length,web:'dist',ios:'artifacts/cloud-native-export'}));
