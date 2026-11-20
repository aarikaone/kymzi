#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,loadEnvironment,preflight,runCommand,installPods} from './build-mobile.mjs';
import {relaunchWithSupportedNode} from './node-runtime.mjs';

export async function launchNative(platform,args=[],{root=ROOT,env=process.env,check=preflight,run=runCommand}={}){
 if(!['ios','android'].includes(platform))throw new Error('Choose ios or android.');
 const help=args.includes('--help')||args.includes('-h'),settings=help?env:loadEnvironment(root,env);
 const developmentIos=platform==='ios'&&!help&&!args.includes('--configuration=Release')&&args[args.indexOf('--configuration')+1]!=='Release';
 if(developmentIos){settings.RCT_USE_PREBUILT_RNCORE='0';settings.RCT_USE_RN_DEP='1';}
 const report=help?{issues:[],env:settings}:check(root,{target:platform,simulator:platform==='ios',debug:platform==='android',skipPods:false},settings);
 if(report.issues.length)throw new Error(report.issues.join('\n'));
 const lock=path.join(root,'apps/mobile/ios/Podfile.lock');
 if(developmentIos&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8').includes('React-Core-prebuilt')){
  await installPods({name:'CocoaPods for iOS development',command:'pod',args:['install'],cwd:path.dirname(lock)},{env:report.env},{run});
 }

 return run({name:`Run native ${platform}`,command:process.execPath,args:[path.join(root,'node_modules/expo/bin/cli'),`run:${platform}`,...args],cwd:path.join(root,'apps/mobile')},{env:report.env});
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 try{const code=await relaunchWithSupportedNode(process.argv[1],process.argv.slice(2));if(code!==null)process.exitCode=code;else await launchNative(process.argv[2],process.argv.slice(3));}catch(error){console.error(`Kymzi native: ${error.message}`);process.exitCode=1;}
}
