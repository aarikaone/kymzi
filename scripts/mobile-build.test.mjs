import {launchNative} from './run-native.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {parseOptions,releaseVersion,buildPlan,exportOptions,preflight,runCommand,main,loadEnvironment,installPods} from './build-mobile.mjs';
import {supportsNode,selectNodeRuntime,relaunchWithSupportedNode} from './node-runtime.mjs';
const require=createRequire(import.meta.url);
const signing=require('../apps/mobile/plugins/withReleaseSigning.cjs');
const APP={expo:{name:'Kymzi',version:'0.1.0',android:{package:'com.kymzi.app',versionCode:1},ios:{bundleIdentifier:'com.kymzi.app',buildNumber:'1'}}};
const NOW=new Date('2026-11-19T12:00:00Z');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'kymzi-build-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));write(root,'apps/mobile/app.json',JSON.stringify(APP));return root;}
function write(root,name,content=''){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);return file;}
function ready(_root,_options,env){return {issues:[],notes:[],env};}
function config(root){return JSON.parse(fs.readFileSync(path.join(root,'apps/mobile/app.json'),'utf8'));}
function fakeNative(root,calls,{failAndroid=false,badIosVersion=false}={}){return async step=>{
 calls.push(step);
 if(step.name==='Generate android'){const app=config(root).expo;write(root,'apps/mobile/android/app/build.gradle',`applicationId "${app.android.package}"\nversionCode ${app.android.versionCode}\nversionName "${app.version}"\n// @generated begin kymzi-release-signing\n`);}
 if(step.name==='Generate ios')fs.mkdirSync(path.join(root,'apps/mobile/ios/Kymzi.xcworkspace'),{recursive:true});
 if(step.name==='Android native build'){if(failAndroid)throw new Error('Gradle test failure');const debug=step.args.includes(':app:assembleDebug');const apk=debug||step.args.includes(':app:assembleRelease');write(root,apk?`apps/mobile/android/app/build/outputs/apk/${debug?'debug':'release'}/app.apk`:'apps/mobile/android/app/build/outputs/bundle/release/app.aab','test-only android artifact');}
 if(step.name==='iOS archive'){const archive=step.args[step.args.indexOf('-archivePath')+1];fs.mkdirSync(path.join(archive,'Products/Applications/Kymzi.app'),{recursive:true});fs.writeFileSync(path.join(archive,'Products/Applications/Kymzi.app/Info.plist'),'test-only plist');}
 if(step.name==='Verify iOS archive'){const key=step.args[1],app=config(root).expo;return key==='CFBundleShortVersionString'?(badIosVersion?'9.9.9':app.version):key==='CFBundleVersion'?app.ios.buildNumber:app.ios.bundleIdentifier;}
 if(step.name==='Export App Store IPA'){const output=step.args[step.args.indexOf('-exportPath')+1];fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'Kymzi.ipa'),'test-only ios artifact');}
 return '';
};}
test('rejects unknown/upload flags and conflicting version or target options',()=>{
 for(const args of [['--upload'],['ios','--debug'],['android','--simulator'],['--bump','--no-bump'],['--bump','--build-number','2'],['--version'],['typo']])assert.throws(()=>parseOptions(args));
 assert.equal(parseOptions(['android','--debug']).debug,true);assert.equal(parseOptions(['ios','--simulator']).simulator,true);
});
test('keeps build numbers aligned, bumps explicitly and refuses invalid or stale versions',()=>{
 const copy=structuredClone(APP);assert.equal(releaseVersion(copy,parseOptions([])).build,1);assert.equal(releaseVersion(copy,parseOptions(['--bump'])).build,2);assert.deepEqual(copy,APP);
 assert.equal(releaseVersion(copy,parseOptions(['--version','1.2.3','--build-number','23'])).version,'1.2.3');
 for(const build of ['0','-1','1.5','1e2','2100000001'])assert.throws(()=>releaseVersion(copy,{buildNumber:build}));
 assert.throws(()=>releaseVersion({...copy,expo:{...copy.expo,ios:{...copy.expo.ios,buildNumber:'2'}}},{}));
 assert.throws(()=>releaseVersion(copy,{version:'0.1-beta'}));
});
test('help and dry runs do not run tools, mutate config or log signing values',async t=>{
 const root=fixture(t),before=fs.readFileSync(path.join(root,'apps/mobile/app.json'),'utf8'),output=[];
 await main(['--help'],{root:'/does-not-exist',log:line=>output.push(line)});
 await main(['all','--bump','--dry-run'],{root,env:{KYMZI_ANDROID_KEYSTORE_PASSWORD:'secret-never-print'},log:line=>output.push(line),check:()=>assert.fail('No preflight in dry run'),run:()=>assert.fail('No native tool in dry run')});
 assert.equal(fs.readFileSync(path.join(root,'apps/mobile/app.json'),'utf8'),before);assert.equal(fs.existsSync(path.join(root,'artifacts')),false);assert.ok(!output.join('\n').includes('secret-never-print'));assert.ok(output.some(line=>line.includes('Android native build')));
});
test('build plan orders Android before iOS and never contains an upload or database command',()=>{
 const options=parseOptions(['all']),plan=buildPlan('/project',options,releaseVersion(APP,options),{}),names=plan.map(step=>step.name);
 assert.ok(names.indexOf('Web build')<names.indexOf('Android native build'));assert.ok(names.indexOf('Android native build')<names.indexOf('iOS archive'));
 assert.ok(plan.some(step=>step.args.includes(':app:bundleRelease')));assert.ok(!JSON.stringify(plan).match(/--upload|eas submit|firebase|firestore/i));
 const sim=parseOptions(['ios','--simulator']);assert.ok(!buildPlan('/project',sim,releaseVersion(APP,sim),{}).some(step=>step.name==='Export App Store IPA'));
});
test('release signing is idempotent, uses environment-only values and stays out of nonlocal Expo config',()=>{
 const source='android { buildTypes { debug { signingConfig signingConfigs.debug } release { signingConfig signingConfigs.debug } } }';const once=signing.applySigning(source);assert.equal(signing.applySigning(once),once);assert.equal(once.split('@generated begin kymzi-release-signing').length,2);assert.ok(once.includes('release { signingConfig signingConfigs.kymziRelease }'));assert.ok(once.includes('System.getenv("KYMZI_ANDROID_KEYSTORE_PASSWORD")'));
 const previous=process.env.KYMZI_LOCAL_BUILD;delete process.env.KYMZI_LOCAL_BUILD;try{const input={name:'Kymzi'};assert.equal(signing(input),input);}finally{if(previous!==undefined)process.env.KYMZI_LOCAL_BUILD=previous;}
 assert.throws(()=>signing.applySigning('// @generated begin kymzi-release-signing\n'),/Incomplete/);
 const plist=exportOptions('ABCDE12345');assert.ok(plist.includes('<string>export</string>'));assert.ok(!plist.includes('<string>upload</string>'));assert.throws(()=>exportOptions('<bad>'));
});
test('failed preflight lists missing requirements before changing app metadata',async t=>{
 const root=fixture(t),before=config(root);await assert.rejects(main(['stores','--bump'],{root,env:{},check:()=>({issues:['Full Xcode missing'],notes:[],env:{}}),log:()=>{}}),/Full Xcode/);assert.deepEqual(config(root),before);assert.equal(fs.existsSync(path.join(root,'artifacts')),false);
 const report=preflight(root,parseOptions(['android']),{PATH:'',JAVA_HOME:'/missing-java',ANDROID_HOME:'/missing-sdk',KYMZI_ANDROID_KEY_ALIAS:'androiddebugkey'});assert.ok(report.issues.some(issue=>issue.includes('upload key')));assert.ok(report.issues.some(issue=>issue.includes('KYMZI_ANDROID_KEYSTORE_PASSWORD')));
});
test('combined local build collects both artifacts, verifies archived metadata and writes a complete manifest',async t=>{
 const root=fixture(t),calls=[];const result=await main(['stores','--bump'],{root,env:{IOS_TEAM_ID:'ABCDE12345'},check:ready,run:fakeNative(root,calls),log:()=>{},now:()=>NOW});
 assert.equal(result.manifest.status,'complete');assert.deepEqual(result.manifest.artifacts.map(file=>file.platform),['android','ios']);assert.ok(result.manifest.artifacts.every(file=>/^[a-f0-9]{64}$/.test(file.sha256)));assert.equal(config(root).expo.ios.buildNumber,'2');assert.equal(config(root).expo.android.versionCode,2);assert.ok(!fs.existsSync(path.join(root,'artifacts/store-releases/.build-lock')));assert.equal(calls.filter(step=>step.name==='Verify iOS archive').length,3);
});
test('Android compiler failure stops before iOS, retains the selected version and marks the release failed',async t=>{
 const root=fixture(t),calls=[];await assert.rejects(main(['stores','--bump'],{root,env:{},check:ready,run:fakeNative(root,calls,{failAndroid:true}),log:()=>{},now:()=>NOW}),/Gradle test failure/);
 assert.ok(!calls.some(step=>step.name==='iOS archive'));const directory=fs.readdirSync(path.join(root,'artifacts/store-releases')).find(name=>!name.startsWith('.'));const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/store-releases',directory,'release.json')));assert.equal(manifest.status,'failed');assert.equal(manifest.artifacts.length,0);assert.equal(config(root).expo.ios.buildNumber,'2');assert.equal(fs.existsSync(path.join(root,'artifacts/store-releases/.build-lock')),false);
});
test('a stale iOS archive cannot be exported or reported complete',async t=>{
 const root=fixture(t),calls=[];await assert.rejects(main(['ios'],{root,env:{IOS_TEAM_ID:'ABCDE12345'},check:ready,run:fakeNative(root,calls,{badIosVersion:true}),log:()=>{},now:()=>NOW}),/CFBundleShortVersionString/);assert.ok(!calls.some(step=>step.name==='Export App Store IPA'));
});
test('a held lock and an existing output folder cannot overwrite a prior release',async t=>{
 const root=fixture(t),dependencies={root,env:{},check:ready,run:fakeNative(root,[]),log:()=>{},now:()=>NOW};const first=await main(['android'],dependencies);const original=fs.readFileSync(path.join(first.directory,'release.json'),'utf8');await assert.rejects(main(['android'],dependencies),/EEXIST/);assert.equal(fs.readFileSync(path.join(first.directory,'release.json'),'utf8'),original);
 fs.mkdirSync(path.join(root,'artifacts/store-releases/.build-lock'));await assert.rejects(main(['android','--bump'],dependencies),/Another build/);assert.equal(config(root).expo.android.versionCode,1);
});
test('real child-process failures propagate and their complete output is kept in the log',async t=>{
 const root=fixture(t),logFile=path.join(root,'compiler.log');await assert.rejects(runCommand({name:'Test compiler',command:process.execPath,args:['-e',"console.log('compiler output'); process.exit(7)"],cwd:root},{env:process.env,logFile,quiet:true}),error=>{assert.match(error.message,/failed \(7\)/);assert.match(error.output,/compiler output/);assert.equal(error.exitCode,7);return true;});assert.match(fs.readFileSync(logFile,'utf8'),/compiler output/);
});

test('a stale Android application identifier is rejected before compiling an incorrectly identified app',async t=>{
 const root=fixture(t);write(root,'apps/mobile/android/app/build.gradle','applicationId "com.example.old"\nversionCode 1\nversionName "0.1.0"\n// @generated begin kymzi-release-signing');const calls=[];await assert.rejects(main(['android','--skip-prebuild'],{root,env:{},check:ready,run:fakeNative(root,calls),log:()=>{},now:()=>NOW}),/applicationId does not match/);assert.ok(!calls.some(step=>step.name==='Android native build'));
});

test('native development commands use the selected build tools and forward device arguments without release credentials',async t=>{
 const root=fixture(t),calls=[];await launchNative('ios',['--device','Test iPhone'],{root,env:{},check:(_r,options)=>{assert.equal(options.simulator,true);return {issues:[],notes:[],env:{DEVELOPER_DIR:'/Selected/Xcode/Contents/Developer'}};},run:async(step,settings)=>{calls.push(step);assert.equal(settings.env.DEVELOPER_DIR,'/Selected/Xcode/Contents/Developer');}});assert.deepEqual(calls[0].args.slice(-3),['run:ios','--device','Test iPhone']);assert.equal(calls[0].cwd,path.join(root,'apps/mobile'));
});

test('Node runtime selection accepts supported engines and prefers installed Node 24 over 22 or newer majors',()=>{
 for(const version of ['22.18.0','22.23.1','24.0.0','v24.22.1','26.0.0'])assert.equal(supportsNode(version),true,version);
 for(const version of ['20.19.0','22.17.9','23.11.0','25.0.0'])assert.equal(supportsNode(version),false,version);
 const versions={'/runtime/22/node':'22.23.1','/runtime/24/node':'24.22.1','/runtime/26/node':'26.0.0','/runtime/23/node':'23.11.0'},settings={env:{},current:'/runtime/23/node',candidates:Object.keys(versions),probe:binary=>versions[binary]};
 assert.deepEqual(selectNodeRuntime(settings),{binary:'/runtime/24/node',version:'24.22.1'});
 assert.equal(selectNodeRuntime({...settings,candidates:['/runtime/22/node','/runtime/26/node']}).version,'22.23.1');
 assert.equal(selectNodeRuntime({...settings,env:{KYMZI_NODE_BINARY:'/runtime/22/node'}}).binary,'/runtime/22/node');
 assert.throws(()=>selectNodeRuntime({...settings,env:{KYMZI_NODE_BINARY:'/runtime/23/node'}}),/unavailable or unsupported/);
 assert.throws(()=>selectNodeRuntime({...settings,env:{KYMZI_NODE_BINARY:'node'}}),/absolute path/);
 assert.throws(()=>selectNodeRuntime({...settings,candidates:[]}),/Install Node 24/);
});

test('Node relaunch preserves arguments, selected PATH, signing environment and nonzero child exit codes',async()=>{
 const env={PATH:'/old/bin',IOS_TEAM_ID:'ABCDE12345'},calls=[];
 const code=await relaunchWithSupportedNode('/project with spaces/build.mjs',['ios','--build-number','2'],{env,version:'23.11.0',current:'/old/bin/node',candidates:['/new/bin/node'],probe:()=> '24.22.1',log:()=>{},run:async(binary,args,childEnv)=>{calls.push({binary,args,env:childEnv});return 7;}});
 assert.equal(code,7);assert.equal(calls[0].binary,'/new/bin/node');assert.deepEqual(calls[0].args,['/project with spaces/build.mjs','ios','--build-number','2']);assert.equal(calls[0].env.IOS_TEAM_ID,'ABCDE12345');assert.equal(calls[0].env.NODE_BINARY,'/new/bin/node');assert.equal(calls[0].env.PATH,`/new/bin${path.delimiter}/old/bin`);assert.equal(calls[0].env.KYMZI_NODE_REEXEC,'1');assert.deepEqual(env,{PATH:'/old/bin',IOS_TEAM_ID:'ABCDE12345'});
});

test('supported Node continues directly and a failed runtime relaunch cannot loop',async()=>{
 const noProbe=()=>assert.fail('No runtime discovery expected');
 assert.equal(await relaunchWithSupportedNode('/build',[],{version:'24.22.1',probe:noProbe,run:noProbe}),null);
 await assert.rejects(relaunchWithSupportedNode('/build',[],{version:'23.11.0',env:{KYMZI_NODE_REEXEC:'1'},probe:noProbe,run:noProbe}),/selected Node runtime is unsupported/);
});

test('Apple team defaults to app.json while local and shell signing settings keep their precedence',t=>{
 const root=fixture(t),app=config(root);app.expo.ios.appleTeamId='5Y3QHYUW35';write(root,'apps/mobile/app.json',JSON.stringify(app));
 assert.equal(loadEnvironment(root,{}).IOS_TEAM_ID,'5Y3QHYUW35');
 write(root,'.env.build.local','IOS_TEAM_ID=LOCAL12345\nIOS_SCHEME=LocalScheme\n');
 assert.equal(loadEnvironment(root,{}).IOS_TEAM_ID,'LOCAL12345');
 const shell={IOS_TEAM_ID:'SHELL12345'},resolved=loadEnvironment(root,shell);assert.equal(resolved.IOS_TEAM_ID,'SHELL12345');assert.equal(resolved.IOS_SCHEME,'LocalScheme');assert.deepEqual(shell,{IOS_TEAM_ID:'SHELL12345'});
});

test('iOS preflight-only resolves the configured team without building, bumping versions or creating artifacts',async t=>{
 const root=fixture(t),app=config(root);app.expo.ios.appleTeamId='5Y3QHYUW35';write(root,'apps/mobile/app.json',JSON.stringify(app));const before=config(root),lines=[];
 await main(['ios','--preflight-only','--bump'],{root,env:{},check:(_root,options,env)=>{assert.equal(options.target,'ios');assert.equal(env.IOS_TEAM_ID,'5Y3QHYUW35');return ready(root,options,env);},log:line=>lines.push(line),run:()=>assert.fail('No build expected')});
 assert.deepEqual(config(root),before);assert.equal(fs.existsSync(path.join(root,'artifacts')),false);assert.match(lines.join('\n'),/ios build prerequisites are ready/);
 await assert.rejects(main(['ios','--preflight-only'],{root,env:{},check:()=>({issues:['Missing full Xcode'],notes:[],env:{}}),log:()=>{}}),/Missing full Xcode/);
});

test('the configured Apple team is passed to the archive and exported IPA signing settings',async t=>{
 const root=fixture(t),app=config(root);app.expo.ios.appleTeamId='5Y3QHYUW35';write(root,'apps/mobile/app.json',JSON.stringify(app));const calls=[];
 const result=await main(['ios'],{root,env:{},check:ready,run:fakeNative(root,calls),log:()=>{},now:()=>NOW});
 assert.ok(calls.find(step=>step.name==='iOS archive').args.includes('DEVELOPMENT_TEAM=5Y3QHYUW35'));
 assert.match(fs.readFileSync(path.join(result.directory,'ExportOptions.plist'),'utf8'),/<key>teamID<\/key><string>5Y3QHYUW35<\/string>/);
});

const networkFailure=()=>Object.assign(new Error('CocoaPods failed (1).'),{output:'[!] Error installing ZXingObjC\n[!] /usr/bin/git clone https://github.com/zxingify/zxingify-objc.git\nerror: RPC failed; curl 56 Recv failure: Operation timed out\nfatal: early EOF'});
test('CocoaPods retries interrupted downloads using local HTTP/1.1 without overwriting existing Git environment settings',async t=>{
 const root=fixture(t),logFile=path.join(root,'pods.log'),env={PATH:'/tools',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.sslVerify',GIT_CONFIG_VALUE_0:'true'},calls=[],delays=[];
 const result=await installPods({name:'CocoaPods',command:'pod',args:['install']},{env,logFile},{log:()=>{},wait:async ms=>{delays.push(ms);},run:async(_step,settings)=>{calls.push(settings);if(calls.length===1)throw networkFailure();return 'pods installed';}});
 assert.equal(result,'pods installed');assert.equal(calls.length,2);assert.deepEqual(delays,[1000]);assert.equal(calls[1].env.GIT_CONFIG_COUNT,'2');assert.equal(calls[1].env.GIT_CONFIG_KEY_0,'http.sslVerify');assert.equal(calls[1].env.GIT_CONFIG_VALUE_0,'true');assert.equal(calls[1].env.GIT_CONFIG_KEY_1,'http.version');assert.equal(calls[1].env.GIT_CONFIG_VALUE_1,'HTTP/1.1');assert.equal(env.GIT_CONFIG_COUNT,'1');assert.match(fs.readFileSync(logFile,'utf8'),/Retrying.*2\/3/);
});

test('CocoaPods retries are bounded and configuration failures or interruptions fail immediately',async()=>{
 let calls=0;const delays=[];await assert.rejects(installPods({}, {env:{}},{log:()=>{},wait:async ms=>{delays.push(ms);},run:async()=>{calls++;throw networkFailure();}}),/CocoaPods failed/);assert.equal(calls,3);assert.deepEqual(delays,[1000,3000]);
 for(const error of [new Error('pod executable missing'),Object.assign(new Error('Invalid Podfile'),{output:'[!] Error installing ZXingObjC: invalid podspec version'}),Object.assign(networkFailure(),{signal:'SIGINT'})]){
  calls=0;await assert.rejects(installPods({}, {env:{}},{log:()=>{},wait:()=>assert.fail('No retry wait expected'),run:async()=>{calls++;throw error;}}));assert.equal(calls,1);
 }
});

test('an iOS build resumes after a transient CocoaPods download failure and archives only after Pods finish',async t=>{
 const root=fixture(t),calls=[],native=fakeNative(root,calls);let attempts=0,installed=false;
 const result=await main(['ios'],{root,env:{IOS_TEAM_ID:'ABCDE12345'},check:ready,log:()=>{},now:()=>NOW,run:async(step,settings)=>{
  if(step.name==='CocoaPods'){attempts++;if(attempts===1)throw networkFailure();assert.equal(settings.env.GIT_CONFIG_VALUE_0,'HTTP/1.1');installed=true;}
  if(step.name==='iOS archive')assert.equal(installed,true);
  return native(step);
 }});
 assert.equal(attempts,2);assert.equal(result.manifest.status,'complete');assert.equal(result.manifest.artifacts[0].platform,'ios');assert.equal(config(root).expo.ios.buildNumber,'1');
});

test('iOS Debug refreshes incompatible prebuilt Pods before Expo and enables source core for the dev client',async t=>{
 const root=fixture(t),calls=[];write(root,'apps/mobile/ios/Podfile.lock','PODS:\n  - React-Core-prebuilt (0.81.5)\n');
 await launchNative('ios',['--device','Test iPhone'],{root,env:{},check:ready,run:async(step,settings)=>{calls.push(step);assert.equal(settings.env.RCT_USE_PREBUILT_RNCORE,'0');assert.equal(settings.env.RCT_USE_RN_DEP,'1');}});
 assert.equal(calls.length,2);assert.equal(calls[0].command,'pod');assert.deepEqual(calls[0].args,['install']);assert.equal(calls[1].name,'Run native ios');
 await assert.rejects(launchNative('ios',[],{root,env:{},check:ready,run:async()=>{throw new Error('Invalid Podfile');}}),/Invalid Podfile/);
});

test('iOS Release and help do not enable development-only core settings or refresh Pods',async t=>{
 const root=fixture(t);write(root,'apps/mobile/ios/Podfile.lock','React-Core-prebuilt');
 for(const args of [['--configuration','Release'],['--help']]){
  let calls=0;await launchNative('ios',args,{root,env:{},check:ready,run:async(step,settings)=>{calls++;assert.equal(step.name,'Run native ios');assert.equal(settings.env.RCT_USE_PREBUILT_RNCORE,undefined);}});assert.equal(calls,1);
 }
});
