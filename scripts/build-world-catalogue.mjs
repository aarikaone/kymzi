import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {relaunchWithSupportedNode} from './node-runtime.mjs';
const script=fileURLToPath(import.meta.url),restart=await relaunchWithSupportedNode(script,process.argv.slice(2));if(restart!==null)process.exit(restart);
const python=process.env.PYTHON_BINARY||'python3',file=path.join(path.dirname(script),'build-world-catalogue.py');
const child=spawn(python,[file,...process.argv.slice(2)],{shell:false,stdio:'inherit',env:{...process.env,NODE_BINARY:process.execPath}});
child.once('error',error=>{console.error(`Kymzi catalogue: ${error.message}. Python 3 is required.`);process.exitCode=1;});child.once('close',code=>{process.exitCode=code??1;});
