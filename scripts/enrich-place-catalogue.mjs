import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const lock=path.join(path.resolve(root,process.env.KYMZI_DETAILS_FOLDER??'artifacts/place-details-v1'),'catalogue-worker.lock');
try{fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('Place enrichment is already running.');}catch(err){if(err.code!=='ESRCH')throw err;}fs.unlinkSync(lock);fs.writeFileSync(lock,String(process.pid),{flag:'wx'});}
try{for(const [script,args] of [['enrich-place-details.mjs',['--run']],['enrich-place-facts.mjs',[]]]){
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),...args],{cwd:root,env:{...process.env,OPENAI_API_KEY:''},stdio:'inherit'});child.on('error',reject);child.on('close',resolve);});
 if(code!==0){process.exitCode=code??1;break;}
}

}finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
