import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {destinationArtSource,destinationArtJobs} from './destination-art-plan.mjs';
import {destinationImageFields} from './destination-art-cloud.mjs';
import {destinationAssetPath} from './publish-destination-art.mjs';
import {buildPlan,validateShard,MODEL} from './world-art-run.mjs';
const source=destinationArtSource();
test('maps exactly 1,500 covers and 6,000 attraction images to distinct cloud documents',()=>{
 assert.equal(source.jobs.length,7500);assert.equal(source.jobs.filter(j=>j.kind==='city').length,1500);assert.equal(new Set(source.jobs.map(j=>j.id)).size,7500);assert.equal(new Set(source.jobs.map(j=>j.documentPath)).size,7500);assert.equal(new Set(source.jobs.map(j=>j.output)).size,7500);
 const plan=buildPlan(source.jobs,[],new Set(),{size:500,budgetUSD:35,prioritizeCityCovers:false});assert.equal(plan.shards.length,15);assert.ok(plan.reserveUSD<=35);assert.ok(plan.estimatedUSD<30);
});
test('prioritizes complete Munnar and Coorg guides while skipping images already available',()=>{
 const first=source.jobs.slice(0,10);assert.ok(first.slice(0,5).every(j=>j.cityId==='city:1262463'));assert.ok(first.slice(5).every(j=>j.cityId==='city:1264540'));
 const ready=first.map(j=>j.id),plan=buildPlan(source.jobs,ready,new Set(),{budgetUSD:35,prioritizeCityCovers:false});assert.equal(plan.count,7490);assert.ok(plan.shards.every(s=>s.entries.every(e=>!ready.includes(e.id))));
});
test('refuses duplicate destination or attraction slots before paid requests',()=>{
 const city={id:'city:1',geonameId:1,city:'Sample',country:'India',places:[{id:'Q1',name:'One',kind:'Garden',categoryId:'garden'},{id:'Q1',name:'Duplicate',kind:'Garden',categoryId:'garden'},{id:'Q3',name:'Three',kind:'Park'},{id:'Q4',name:'Four',kind:'Park'}]};assert.throws(()=>destinationArtJobs({cities:[city]},'Illustration'),/Duplicate/);
});
test('keeps batch settings locked and verifies all 500 input mappings',()=>{
 const plan=buildPlan(source.jobs,[],new Set(),{budgetUSD:35,prioritizeCityCovers:false}),shard=plan.shards[0];
 const bytes=Buffer.from(shard.entries.map(e=>JSON.stringify({custom_id:e.custom_id,url:'/v1/images/generations',body:{model:MODEL,n:1,size:'1536x1024',quality:'low',prompt:e.prompt}})).join('\n')+'\n');shard.requestsSha256=createHash('sha256').update(bytes).digest('hex');assert.equal(validateShard(shard,bytes).size,500);
});
test('publishes only immutable image fields to the exact destination document',()=>{
 const entry=source.jobs[0],digest='a'.repeat(64),path=destinationAssetPath(entry.output,digest),image={path,sha256:digest,url:'https://images.endpoints.kymzi-f1e9d.cloud.goog/'+path,width:768,height:512};
 assert.deepEqual(Object.keys(destinationImageFields(entry,image)).sort(),['cdnImageUrl','image','imageStatus']);assert.throws(()=>destinationImageFields({...entry,documentPath:'cities/JP'},image),/mapping/);assert.throws(()=>destinationImageFields(entry,{...image,url:'https://example.org/photo.jpg'}),/metadata/);assert.throws(()=>destinationAssetPath('../../secret.jpg',digest),/Unsafe/);
});
