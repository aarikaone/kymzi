#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseEnv} from 'node:util';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {supportsNode,relaunchWithSupportedNode} from './node-runtime.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TARGETS=['ios','android','stores','all','doctor'];
const SIGNING=['KYMZI_ANDROID_KEYSTORE_PATH','KYMZI_ANDROID_KEYSTORE_PASSWORD','KYMZI_ANDROID_KEY_ALIAS','KYMZI_ANDROID_KEY_PASSWORD'];
export const HELP=`Kymzi local builds — no uploads or publishing.

  npm run build:doctor                 Check local tools and release credentials
  npm run build:android                Signed Play Store AAB
  npm run build:android:apk            Signed release APK
  npm run build:android:debug          Installable debug APK, no upload key
  npm run build:ios                    Signed App Store IPA and Xcode archive
  npm run build:ios:simulator          Unsigned Release .app for iOS simulators
  npm run release:stores              Android AAB + iOS IPA, matching version/build
  npm run build:all                   Web + Android AAB + iOS IPA

Options (after npm's --):
  --dry-run             Print the build plan without running tools or changing files
  --preflight-only      Check this target's tools and signing settings without building
  --bump                Increment the shared Android/iOS build number
  --no-bump             Keep the configured build number (the default)
  --version X.Y.Z       Set the app marketing version
  --build-number N      Set both platform build numbers
  --apk                 Android release APK instead of AAB
  --debug               Android debug APK; cannot be combined with iOS
  --simulator           iOS Release simulator build; cannot be combined with Android
  --skip-prebuild       Reuse existing native projects (versions are still verified)
  --skip-pods           Reuse already installed iOS Pods/workspace
  --skip-checks         Skip the TypeScript check
  -h, --help            Show this help

Copy .env.build.example to .env.build.local for local signing settings.
Builds and logs go under artifacts/store-releases/. See docs/MOBILE_BUILDS.md.
`;
export function parseOptions(args){
 const options={target:args[0]&&!args[0].startsWith('-')?args[0]:'stores',dryRun:false,preflightOnly:false,bump:false,apk:false,debug:false,simulator:false,skipPrebuild:false,skipPods:false,skipChecks:false,help:false};
 let explicitBump=false,explicitNoBump=false;
 for(let i=options.target===args[0]?1:0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--version'||arg==='--build-number'){const value=args[++i];if(!value||value.startsWith('-'))throw new Error(`${arg} needs a value.`);options[arg==='--version'?'version':'buildNumber']=value;continue;}
  const names={'--dry-run':'dryRun','--preflight-only':'preflightOnly','--bump':'bump','--apk':'apk','--debug':'debug','--simulator':'simulator','--skip-prebuild':'skipPrebuild','--skip-pods':'skipPods','--skip-checks':'skipChecks','--help':'help','-h':'help'};
  if(arg==='--no-bump'){explicitNoBump=true;continue;}if(!names[arg])throw new Error(`Unknown option: ${arg}`);options[names[arg]]=true;if(arg==='--bump')explicitBump=true;
 }
 if(!TARGETS.includes(options.target))throw new Error(`Unknown target: ${options.target}`);
 if(explicitBump&&(explicitNoBump||options.buildNumber))throw new Error('--bump cannot be combined with --no-bump or --build-number.');
 if(options.debug&&options.target!=='android')throw new Error('--debug is only supported for Android.');
 if(options.simulator&&options.target!=='ios')throw new Error('--simulator is only supported for iOS.');
 if(options.apk&&options.target==='ios')throw new Error('--apk is only supported for Android.');
 return options;
}
export function releaseVersion(config,options){
 const app=config.expo;if(!app)throw new Error('apps/mobile/app.json must contain expo configuration.');
 const version=options.version??app.version;
 if(!/^\d+\.\d+\.\d+$/.test(version??''))throw new Error('App version must use X.Y.Z.');
 const android=app.android?.versionCode??1,ios=app.ios?.buildNumber??String(android);
 if(!options.buildNumber&&String(android)!==String(ios))throw new Error('Android versionCode and iOS buildNumber must match. Use --build-number N.');
 const build=options.buildNumber===undefined?Number(android)+(options.bump?1:0):Number(options.buildNumber);
 if(!/^\d+$/.test(String(options.buildNumber??build))||!Number.isSafeInteger(build)||build<1||build>2100000000)throw new Error('Build number must be a whole number between 1 and 2100000000.');
 if(!app.ios?.bundleIdentifier||!app.android?.package)throw new Error('Set both iOS bundleIdentifier and Android package in app.json.');
 return {version,build,appName:app.name,iosId:app.ios.bundleIdentifier,androidId:app.android.package};
}
function platforms(options){return {ios:['ios','stores','all','doctor'].includes(options.target),android:['android','stores','all','doctor'].includes(options.target),web:options.target==='all'};}
export function loadEnvironment(root,env){
 const file=path.join(root,'.env.build.local'),config=JSON.parse(fs.readFileSync(path.join(root,'apps/mobile/app.json'),'utf8'));
 return {...(config.expo?.ios?.appleTeamId?{IOS_TEAM_ID:config.expo.ios.appleTeamId}:{}),...(fs.existsSync(file)?parseEnv(fs.readFileSync(file,'utf8')):{}),...env};
}
function executable(name,env){if(path.isAbsolute(name))return fs.existsSync(name)?name:null;return (env.PATH??'').split(path.delimiter).map(dir=>path.join(dir,name)).find(file=>{try{fs.accessSync(file,fs.constants.X_OK);return true;}catch{return false;}});}
function developerDirectory(env){if(env.DEVELOPER_DIR)return env.DEVELOPER_DIR;const standard='/Applications/Xcode.app/Contents/Developer';return fs.existsSync(standard)?standard:null;}
export function preflight(root,options,env){
 const p=platforms(options),issues=[],notes=[],next={...env,PATH:`${path.dirname(process.execPath)}${path.delimiter}${env.PATH??''}`,NODE_BINARY:process.execPath,KYMZI_LOCAL_BUILD:'1'};
 if(!supportsNode(process.versions.node))issues.push('Use Node 24 LTS or Node 22.18+ (the project does not support Node 23/25).');
 if(!fs.existsSync(path.join(root,'node_modules/expo/bin/cli')))issues.push('Dependencies are missing. Run npm ci from the project root.');
 if(!fs.existsSync(path.join(root,'packages/core/src/index.ts')))issues.push('packages/core is missing. Include the shared packages directory.');
 if(p.android){
  const sdk=env.ANDROID_HOME||env.ANDROID_SDK_ROOT||path.join(os.homedir(),process.platform==='darwin'?'Library/Android/sdk':'Android/Sdk');
  if(env.ANDROID_HOME&&env.ANDROID_SDK_ROOT&&path.resolve(env.ANDROID_HOME)!==path.resolve(env.ANDROID_SDK_ROOT))issues.push('ANDROID_HOME and ANDROID_SDK_ROOT must point to the same SDK.');
  if(!fs.existsSync(path.join(sdk,'platform-tools/adb')))issues.push('Android SDK is missing. Set ANDROID_HOME to the SDK directory.');
  else{next.ANDROID_HOME=sdk;next.ANDROID_SDK_ROOT=sdk;notes.push(`Android SDK: ${sdk}`);}
  if(!executable(env.JAVA_HOME?path.join(env.JAVA_HOME,'bin/java'):'java',next))issues.push('Java is missing. Install JDK 17 and set JAVA_HOME.');
  if(!options.debug){
   for(const name of SIGNING)if(!env[name])issues.push(`Set ${name} for a signed Android release.`);
   if(env.KYMZI_ANDROID_KEYSTORE_PATH&&(!path.isAbsolute(env.KYMZI_ANDROID_KEYSTORE_PATH)||!fs.existsSync(env.KYMZI_ANDROID_KEYSTORE_PATH)))issues.push('KYMZI_ANDROID_KEYSTORE_PATH must be an existing absolute upload-keystore path.');
   if(env.KYMZI_ANDROID_KEY_ALIAS==='androiddebugkey'||path.basename(env.KYMZI_ANDROID_KEYSTORE_PATH??'')==='debug.keystore')issues.push('Use an Android upload key, not the debug keystore.');
  }
 }
 if(p.ios){
  if(process.platform!=='darwin')issues.push('iOS builds require macOS and full Xcode.');
  const developer=developerDirectory(env);
  if(!developer||!fs.existsSync(path.join(developer,'usr/bin/xcodebuild')))issues.push('Full Xcode is unavailable. Connect the external Xcode drive or set DEVELOPER_DIR to Xcode.app/Contents/Developer.');
  else{next.DEVELOPER_DIR=developer;notes.push(`Xcode: ${developer}`);}
  if(!options.skipPods&&!executable('pod',next))issues.push('CocoaPods is missing. Install it before building iOS.');
  if(!options.simulator&&!/^[A-Z0-9]{10}$/.test(env.IOS_TEAM_ID??''))issues.push('Set IOS_TEAM_ID to your own 10-character Apple Developer team ID.');
  else if(env.IOS_TEAM_ID)notes.push(`Apple team: ${env.IOS_TEAM_ID}`);
  if(env.IOS_DERIVED_DATA_PATH&&!path.isAbsolute(env.IOS_DERIVED_DATA_PATH))issues.push('IOS_DERIVED_DATA_PATH must be absolute.');
  if(env.IOS_DERIVED_DATA_PATH?.startsWith('/Volumes/')){const volume='/Volumes/'+env.IOS_DERIVED_DATA_PATH.split('/')[2];if(!fs.existsSync(volume)||fs.statSync(volume).dev===fs.statSync('/Volumes').dev)issues.push(`The iOS cache drive is not mounted: ${volume}`);}
 }
 return {issues,notes,env:next};
}
function mobileCommand(root,args){return {command:process.execPath,args:[path.join(root,'node_modules/expo/bin/cli'),...args],cwd:path.join(root,'apps/mobile')};}
export function buildPlan(root,options,release,env){
 const p=platforms(options),mobile=path.join(root,'apps/mobile'),steps=[];
 if(!options.skipChecks)steps.push({name:'TypeScript',command:'npm',args:['run','typecheck'],cwd:root});
 if(p.web)steps.push({name:'Web build',command:'npm',args:['run','build'],cwd:root});
 for(const platform of ['android','ios'].filter(platform=>p[platform])){
  if(!options.skipPrebuild)steps.push({name:`Generate ${platform}`, ...mobileCommand(root,['prebuild','--platform',platform,'--no-install','--skip-dependency-update','react,react-native'])});
  if(platform==='android')steps.push({name:'Android native build',command:process.platform==='win32'?'gradlew.bat':'./gradlew',args:[options.debug?':app:assembleDebug':options.apk?':app:assembleRelease':':app:bundleRelease'],cwd:path.join(mobile,'android')});
  else{
   if(!options.skipPods)steps.push({name:'CocoaPods',command:'pod',args:['install'],cwd:path.join(mobile,'ios')});
   steps.push({name:options.simulator?'iOS simulator build':'iOS archive',command:'xcodebuild',args:['-workspace','<generated workspace>','-scheme',env.IOS_SCHEME||'<generated scheme>','-configuration','Release','-destination',options.simulator?'generic/platform=iOS Simulator':'generic/platform=iOS',`MARKETING_VERSION=${release.version}`,`CURRENT_PROJECT_VERSION=${release.build}`,options.simulator?'build':'archive'],cwd:mobile});
   if(!options.simulator)steps.push({name:'Export App Store IPA',command:'xcodebuild',args:['-exportArchive','-archivePath','<release>/Kymzi.xcarchive','-exportPath','<release>/ios/export','-exportOptionsPlist','<release>/ExportOptions.plist'],cwd:mobile});
  }
 }
 return steps;
}
export function exportOptions(team){
 if(!/^[A-Z0-9]{10}$/.test(team))throw new Error('Invalid IOS_TEAM_ID.');
 return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>method</key><string>app-store-connect</string><key>destination</key><string>export</string><key>signingStyle</key><string>automatic</string><key>teamID</key><string>${team}</string><key>manageAppVersionAndBuildNumber</key><false/><key>stripSwiftSymbols</key><true/></dict></plist>\n`;
}
export function runCommand(step,{env,logFile,quiet=false,interactive=false}={}){
 return new Promise((resolve,reject)=>{
  const output=logFile?fs.createWriteStream(logFile,{flags:'a'}):null;
  const child=spawn(step.command,step.args,{cwd:step.cwd,env,shell:false,stdio:interactive&&!quiet&&!logFile?'inherit':['inherit','pipe','pipe']});let captured='',tail='';
  for(const [stream,destination] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream?.on('data',chunk=>{tail=(tail+chunk.toString()).slice(-32768);if(quiet)captured+=chunk;if(!quiet)destination.write(chunk);output?.write(chunk);});
  output?.on('error',error=>{child.kill('SIGTERM');reject(error);});
  const interrupt=()=>child.kill('SIGINT');process.once('SIGINT',interrupt);
  child.on('error',error=>{process.removeListener('SIGINT',interrupt);output?.end();reject(error);});
  child.on('close',(code,signal)=>{process.removeListener('SIGINT',interrupt);const finish=()=>{if(code===0)resolve(captured);else reject(Object.assign(new Error(`${step.name??step.command} failed (${signal??code}).${logFile?` See ${logFile}`:''}`),{output:tail,exitCode:code,signal}));};if(output)output.end(finish);else finish();});
 });
}
export function transientPodDownload(error){
 if(error.signal)return false;
 const output=error.output??'';
 return /Error installing|Downloading|git clone|curl:|fetch-pack/i.test(output)&&/Operation timed out|Connection timed out|Could not resolve host|Failed to connect|Connection reset|Recv failure|HTTP\/2 stream|SSL_ERROR_SYSCALL|network is unreachable|early EOF|unexpected disconnect|requested URL returned error: (429|502|503|504)/i.test(output);
}
export async function installPods(step,settings,{run=runCommand,log=console.log,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 for(let attempt=1;attempt<=3;attempt++){
  let selected=settings;
  if(attempt>1){
   const count=Number(settings.env?.GIT_CONFIG_COUNT??0);
   if(!Number.isSafeInteger(count)||count<0)throw new Error('GIT_CONFIG_COUNT must be a nonnegative integer.');
   selected={...settings,env:{...settings.env,GIT_CONFIG_COUNT:String(count+1),[`GIT_CONFIG_KEY_${count}`]:'http.version',[`GIT_CONFIG_VALUE_${count}`]:'HTTP/1.1'}};
  }
  try{return await run(step,selected);}catch(error){
   if(attempt===3||!transientPodDownload(error))throw error;
   const delay=attempt===1?1000:3000,message=`CocoaPods download interrupted. Retrying in ${delay/1000}s (${attempt+1}/3) using Git HTTP/1.1.`;
   log(message);if(settings.logFile)fs.appendFileSync(settings.logFile,`\n${message}\n`);await wait(delay);
  }
 }
}
function oneFile(directory,extension){const files=fs.existsSync(directory)?fs.readdirSync(directory).filter(name=>name.endsWith(extension)):[];if(files.length!==1)throw new Error(`Expected one ${extension} in ${directory}.`);return path.join(directory,files[0]);}
function hash(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function writeJson(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
export async function main(args,{root=ROOT,env=process.env,run=runCommand,check=preflight,log=console.log,now=()=>new Date()}={}){
 const options=parseOptions(args);if(options.help){log(HELP);return;}
 const appFile=path.join(root,'apps/mobile/app.json'),config=JSON.parse(fs.readFileSync(appFile,'utf8')),release=releaseVersion(config,options),environment=loadEnvironment(root,env),plan=buildPlan(root,options,release,environment);
 if(options.dryRun){log(`Dry run: Kymzi ${release.version} (${release.build}). No files changed; no tools run.`);for(const step of plan)log(`${step.name}: ${step.command} ${step.args.join(' ')}`);return {options,release,plan};}
 const ready=check(root,options,environment);for(const note of ready.notes)log(note);
 if(options.target==='doctor'){for(const issue of ready.issues)log(`Needs setup: ${issue}`);if(ready.issues.length)throw new Error('Build tools or signing credentials need setup. See docs/MOBILE_BUILDS.md.');log('Both store build environments are ready.');return;}
 if(ready.issues.length)throw new Error(ready.issues.join('\n'));
 if(options.preflightOnly){log(`${options.target} build prerequisites are ready. No build started; no files changed.`);return {options,release};}
 const artifactRoot=path.join(root,'artifacts/store-releases');fs.mkdirSync(artifactRoot,{recursive:true});
 const lock=path.join(artifactRoot,'.build-lock');try{fs.mkdirSync(lock);}catch(error){if(error.code==='EEXIST')throw new Error(`Another build owns ${lock}. If a previous build was interrupted, check its pid.json before removing that lock.`);throw error;}
 const stamp=now().toISOString().replace(/[-:.]/g,''),directory=path.join(artifactRoot,`${release.version}-${release.build}-${stamp}`),manifest={app:'Kymzi',...release,status:'building',startedAt:now().toISOString(),artifacts:[]};
 let ownsDirectory=false;
 try{
  writeJson(path.join(lock,'pid.json'),{pid:process.pid,at:now().toISOString()});
  fs.mkdirSync(directory);ownsDirectory=true;const manifestFile=path.join(directory,'release.json');writeJson(manifestFile,manifest);
  config.expo.version=release.version;config.expo.android.versionCode=release.build;config.expo.ios.buildNumber=String(release.build);writeJson(appFile,config);
  const childEnv={...ready.env,NODE_ENV:'production'},p=platforms(options),mobile=path.join(root,'apps/mobile');
  const execute=async step=>{log(`\n${step.name}`);const settings={env:childEnv,logFile:path.join(directory,`${step.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.log`)};return step.name==='CocoaPods'?installPods(step,settings,{run,log}):run(step,settings);};
  const record=(source,platform,extension)=>{const target=path.join(directory,`Kymzi-${release.version}-${release.build}-${platform}.${extension}`);fs.copyFileSync(source,target);manifest.artifacts.push({platform,path:path.relative(root,target),sha256:hash(target)});};
  for(const step of plan){
   if(step.name==='Android native build'){
    const gradle=fs.readFileSync(path.join(mobile,'android/app/build.gradle'),'utf8');
    if(!gradle.includes('@generated begin kymzi-release-signing'))throw new Error('Android signing plugin is missing. Run prebuild without --skip-prebuild.');
    const nativeId=gradle.match(/\bapplicationId\s+(['"])([^'"]+)\1/)?.[2];if(nativeId!==release.androidId)throw new Error('Android native applicationId does not match app.json. Run prebuild.');
    if(!new RegExp(`versionCode\\s+${release.build}\\b`).test(gradle)||!gradle.includes(`versionName "${release.version}"`))throw new Error('Android native version is stale. Run prebuild.');
    await execute(step);const extension=options.debug||options.apk?'apk':'aab',variant=options.debug?'debug':'release';
    const source=extension==='aab'?oneFile(path.join(mobile,'android/app/build/outputs/bundle/release'),'.aab'):oneFile(path.join(mobile,`android/app/build/outputs/apk/${variant}`),'.apk');record(source,options.debug?'android-debug':'android',extension);continue;
   }
   if(step.command==='xcodebuild'){
    const ios=path.join(mobile,'ios'),workspace=environment.IOS_WORKSPACE?path.resolve(environment.IOS_WORKSPACE):oneFile(ios,'.xcworkspace'),scheme=environment.IOS_SCHEME||path.basename(workspace,'.xcworkspace');
    const derived=environment.IOS_DERIVED_DATA_PATH||path.join(root,'artifacts/build-cache/ios/DerivedData'),archive=path.join(directory,'Kymzi.xcarchive'),exportDir=path.join(directory,'ios/export'),plist=path.join(directory,'ExportOptions.plist');
    if(step.name==='Export App Store IPA'){
     const app=oneFile(path.join(archive,'Products/Applications'),'.app'),info=path.join(app,'Info.plist');
     for(const [key,value] of [['CFBundleShortVersionString',release.version],['CFBundleVersion',String(release.build)],['CFBundleIdentifier',release.iosId]]){const actual=await run({name:'Verify iOS archive',command:'plutil',args:['-extract',key,'raw','-o','-',info],cwd:root},{env:childEnv,quiet:true});if(actual.trim()!==value)throw new Error(`iOS archive ${key} does not match app.json.`);}
     fs.writeFileSync(plist,exportOptions(environment.IOS_TEAM_ID));await execute({...step,args:['-exportArchive','-archivePath',archive,'-exportPath',exportDir,'-exportOptionsPlist',plist,'-allowProvisioningUpdates']});record(oneFile(exportDir,'.ipa'),'ios','ipa');
    }else{
     const common=['-workspace',workspace,'-scheme',scheme,'-configuration','Release','-destination',options.simulator?'generic/platform=iOS Simulator':'generic/platform=iOS','-derivedDataPath',derived,`MARKETING_VERSION=${release.version}`,`CURRENT_PROJECT_VERSION=${release.build}`];
     await execute({...step,args:options.simulator?[...common,'-sdk','iphonesimulator','CODE_SIGNING_ALLOWED=NO','build']:[...common,'-archivePath',archive,`DEVELOPMENT_TEAM=${environment.IOS_TEAM_ID}`,'-allowProvisioningUpdates','archive']});
     if(options.simulator){const source=oneFile(path.join(derived,'Build/Products/Release-iphonesimulator'),'.app'),target=path.join(directory,'Kymzi-simulator.app');fs.cpSync(source,target,{recursive:true});manifest.artifacts.push({platform:'ios-simulator',path:path.relative(root,target)});}
    }
    continue;
   }
   await execute(step);
  }
  if(p.web)manifest.artifacts.push({platform:'web',path:'dist'});
  manifest.status='complete';manifest.completedAt=now().toISOString();writeJson(manifestFile,manifest);log(`\nBuild complete. Artifacts: ${directory}`);return {release,directory,manifest};
 }catch(error){manifest.status='failed';manifest.error=error.message;if(ownsDirectory)writeJson(path.join(directory,'release.json'),manifest);throw error;}
 finally{fs.rmSync(lock,{recursive:true,force:true});}
}
export async function cli(args=process.argv.slice(2)){try{const code=await relaunchWithSupportedNode(fileURLToPath(import.meta.url),args);if(code!==null){process.exitCode=code;return;}await main(args);}catch(error){console.error(`\nKymzi build: ${error.message}`);process.exitCode=1;}}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await cli();
