import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildPlan,validateShard,canReserve,canEnqueue,queuedInputReserve,usageCost,summary,quotaRejected,MODEL} from './world-art-run.mjs';
const job=(id,kind='place')=>({id:`${kind}/${id}`,kind,output:`${kind==='place'?'places':'cities'}/${id}.jpg`,prompt:'A sourced landscape illustration.'});
test('excludes generated and moderation-blocked images, and prioritizes city covers',()=>{
 const p=buildPlan([job('Q1'),job('Q2'),job('123','city'),job('Q3')],['place/Q1'],new Set(['place/Q2']),{size:1});
 assert.equal(p.count,2);assert.equal(p.excluded.length,1);assert.equal(p.shards[0].entries[0].kind,'city');assert.equal(p.shards.length,2);
 assert.throws(()=>buildPlan([job('Q1'),job('Q1')],[],new Set()),/Duplicate/);
 assert.throws(()=>buildPlan([{...job('Q1'),output:'../../private.jpg'}],[],new Set()),/Unsafe/);
});
test('requires budget headroom for all outstanding paid work',()=>{
 const p=buildPlan([job('Q1'),job('Q2')],[],new Set(),{size:1});const first=p.shards[0],second=p.shards[1];
 p.budgetUSD=first.reserveUSD+second.reserveUSD-0.00001;first.batchId='batch_existing';assert.equal(canReserve(p,second),false);
 first.collectedAt='today';first.actualUSD=0;assert.equal(canReserve(p,second),true);
 assert.throws(()=>buildPlan([job('Q1')],[],new Set(),{budgetUSD:0}),/spending guard/);
});
test('rejects tampering or a silent switch to more expensive request settings',()=>{
 const p=buildPlan([job('Q1')],[],new Set()),s=p.shards[0];
 const body={model:MODEL,n:1,size:'1536x1024',quality:'low'};
 const bytes=Buffer.from(JSON.stringify({custom_id:s.entries[0].custom_id,url:'/v1/images/generations',body})+'\n');
 s.requestsSha256=createHash('sha256').update(bytes).digest('hex');assert.equal(validateShard(s,bytes).size,1);
 assert.throws(()=>validateShard(s,Buffer.concat([bytes,Buffer.from(' ')])),/changed/);
 const changed=Buffer.from(bytes.toString().replace('"low"','"high"'));s.requestsSha256=createHash('sha256').update(changed).digest('hex');assert.throws(()=>validateShard(s,changed),/settings/);
});
test('uses discounted returned usage and refuses missing accounting data',()=>{
 assert.equal(usageCost({input_tokens:300,output_tokens:158,input_tokens_details:{text_tokens:300,image_tokens:0}}),0.00312);
 assert.throws(()=>usageCost(null),/Missing usage/);assert.throws(()=>usageCost({input_tokens:-1,output_tokens:2}),/Invalid/);
});
test('reports generated and published separately, without hiding failed slots',()=>{
 const p=buildPlan([job('Q1'),job('Q2')],[],new Set(),{size:1});Object.assign(p.shards[0],{batchId:'batch_one',downloaded:1,collectedAt:'now',status:'completed'});Object.assign(p.shards[1],{batchId:'batch_two',downloaded:0,failed:1,publishedAt:'now',status:'completed'});
 const s=summary(p);assert.equal(s.generated,1);assert.equal(s.published,0);assert.equal(s.failed,1);
});
test('only quota-rejected batches with zero completed work may be safely deferred',()=>{
 const status={status:'failed',request_counts:{completed:0},errors:{data:[{code:'token_limit_exceeded'}]}};
 assert.equal(quotaRejected(status),true);
 assert.equal(quotaRejected({...status,request_counts:{completed:1}}),false);
 assert.equal(quotaRejected({...status,errors:{data:[{code:'moderation_blocked'}]}}),false);
 assert.equal(quotaRejected({...status,status:'expired'}),false);
});
test('paces submissions against the org enqueue limit, then resumes when capacity frees',()=>{
 const r=buildPlan([job('Q1'),job('Q2')],[],new Set(),{size:1});r.maxActiveBatches=4;
 const [first,next]=r.shards;first.batchId='batch_existing';first.status='in_progress';r.maxQueuedInputTokens=queuedInputReserve(first)+queuedInputReserve(next)-1;
 assert.equal(canEnqueue(r,next),false);first.status='completed';assert.equal(canEnqueue(r,next),true);
});
