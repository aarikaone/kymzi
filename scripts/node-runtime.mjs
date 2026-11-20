import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';

export function supportsNode(version){
 const [major,minor]=version.replace(/^v/,'').split('.').map(Number);
 return major===22&&minor>=18||major===24||major>=26;
}
function installedCandidates(env){
 const home=os.homedir(),nvm=path.join(env.NVM_DIR||path.join(home,'.nvm'),'versions/node');
 let versions=[];try{versions=fs.readdirSync(nvm).map(name=>path.join(nvm,name,'bin/node'));}catch{}
 return [
  env.NVM_BIN&&path.join(env.NVM_BIN,'node'),...versions,
  ...['/opt/homebrew','/usr/local'].flatMap(prefix=>['24','22'].map(version=>`${prefix}/opt/node@${version}/bin/node`)),
  path.join(home,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'),
  ...(env.PATH||'').split(path.delimiter).filter(Boolean).map(directory=>path.join(directory,process.platform==='win32'?'node.exe':'node')),
 ].filter(Boolean);
}
function probeVersion(binary){
 const result=spawnSync(binary,['-p','process.versions.node'],{encoding:'utf8',timeout:5000,shell:false,windowsHide:true});
 return result.status===0?result.stdout.trim():null;
}
export function selectNodeRuntime({env=process.env,current=process.execPath,candidates,probe=probeVersion}={}){
 const explicit=env.KYMZI_NODE_BINARY;
 if(explicit&&!path.isAbsolute(explicit))throw new Error('KYMZI_NODE_BINARY must be an absolute path to a supported Node executable.');
 const paths=explicit?[explicit]:candidates??installedCandidates(env),available=[];
 for(const binary of new Set(paths)){
  if(binary===current)continue;
  const version=probe(binary);
  if(version&&supportsNode(version))available.push({binary,version});
 }
 const priority=version=>version.startsWith('24.')?0:version.startsWith('22.')?1:2;
 available.sort((a,b)=>priority(a.version)-priority(b.version)||b.version.localeCompare(a.version,undefined,{numeric:true}));
 if(!available.length)throw new Error(explicit?'KYMZI_NODE_BINARY is unavailable or unsupported. Use Node 24 LTS or Node 22.18+ LTS.':'No supported Node runtime found. Install Node 24 LTS (nvm install 24 && nvm use 24), then retry.');
 return available[0];
}
function runRuntime(binary,args,env){
 return new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{env,shell:false,stdio:'inherit'});
  const interrupt=()=>child.kill('SIGINT'),terminate=()=>child.kill('SIGTERM');
  process.once('SIGINT',interrupt);process.once('SIGTERM',terminate);
  const cleanup=()=>{process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',terminate);};
  child.once('error',error=>{cleanup();reject(error);});
  child.once('close',(code,signal)=>{cleanup();resolve(code??(signal?128+(os.constants.signals[signal]??1):1));});
 });
}
export async function relaunchWithSupportedNode(script,args,{env=process.env,version=process.versions.node,current=process.execPath,candidates,probe=probeVersion,run=runRuntime,log=console.log}={}){
 if(supportsNode(version))return null;
 if(env.KYMZI_NODE_REEXEC)throw new Error('The selected Node runtime is unsupported. Set KYMZI_NODE_BINARY to Node 24 LTS or Node 22.18+ LTS.');
 const runtime=selectNodeRuntime({env,current,candidates,probe});
 log(`Using Node ${runtime.version} for Kymzi (current shell: ${version}).`);
 return run(runtime.binary,[script,...args],{...env,PATH:`${path.dirname(runtime.binary)}${path.delimiter}${env.PATH??''}`,NODE_BINARY:runtime.binary,KYMZI_NODE_REEXEC:'1'});
}
