// Continue the already-authorized image Batch API workflow in an isolated journal.
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {relaunchWithSupportedNode} from './node-runtime.mjs';
const restart=await relaunchWithSupportedNode(fileURLToPath(import.meta.url),process.argv.slice(2));if(restart!==null)process.exit(restart);
const args=process.argv.slice(2);if(args.length!==1||!['--prepare','--run','--once','--status'].includes(args[0]))throw Error('Usage: node scripts/destination-art.mjs --prepare|--run|--once|--status');
const root=fileURLToPath(new URL('..',import.meta.url));
const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'scripts/world-art-run.mjs'),...args],{cwd:root,env:{...process.env,KYMZI_WORLD_ART_PROFILE:'destinations-v2'},stdio:'inherit'});child.on('error',reject);child.on('close',resolve);});process.exitCode=code??1;
