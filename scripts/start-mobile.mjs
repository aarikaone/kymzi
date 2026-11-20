#!/usr/bin/env node
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ROOT,loadEnvironment} from './build-mobile.mjs';
import {relaunchWithSupportedNode} from './node-runtime.mjs';

const args=process.argv.slice(2);
try{
 const code=await relaunchWithSupportedNode(fileURLToPath(import.meta.url),args);
 if(code!==null)process.exitCode=code;
 else{
  const env=loadEnvironment(ROOT,process.env);
  env.PATH=`${path.dirname(process.execPath)}${path.delimiter}${env.PATH??''}`;
  env.DEVELOPER_DIR??='/Applications/Xcode.app/Contents/Developer';
  const flags=[...(args.includes('--go')?[]:['--dev-client']),...(args.some(a=>['--tunnel','--localhost','--lan','--host'].includes(a)||a.startsWith('--host='))?[]:['--lan'])];
  const child=spawn(process.execPath,[path.join(ROOT,'node_modules/expo/bin/cli'),'start',...flags,...args],{cwd:path.join(ROOT,'apps/mobile'),env,stdio:'inherit',shell:false});
  const interrupt=()=>child.kill('SIGINT'),terminate=()=>child.kill('SIGTERM');
  process.once('SIGINT',interrupt);process.once('SIGTERM',terminate);
  child.once('error',error=>{console.error(`Kymzi preview: ${error.message}`);process.exitCode=1;});
  child.once('close',(status,signal)=>{process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',terminate);process.exitCode=status??(signal==='SIGINT'?130:1);});
 }
}catch(error){console.error(`Kymzi preview: ${error.message}`);process.exitCode=1;}
