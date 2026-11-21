import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePilot,decodeResult} from './collect-world-art-batch.mjs';
function fixture(){
 const entries=Array.from({length:100},(_,i)=>({id:'place/Q'+i,kind:'place',custom_id:'place_Q'+i,output:'places/Q'+i+'.jpg'}));
 const requests=Buffer.from(entries.map(entry=>JSON.stringify({custom_id:entry.custom_id})).join('\n')+'\n');
 return {requests,manifest:{batchId:'batch_existing123',count:100,entries,requestsSha256:createHash('sha256').update(requests).digest('hex')}};
}
test('accepts the original 100-entry request mapping',()=>{const f=fixture();assert.equal(validatePilot(f.manifest,f.requests).size,100);});
test('refuses changed input and unsafe output paths',()=>{
 const f=fixture();assert.throws(()=>validatePilot(f.manifest,Buffer.concat([f.requests,Buffer.from(' ')])),/changed/);
 f.manifest.entries[0].output='../../escape.jpg';assert.throws(()=>validatePilot(f.manifest,f.requests),/mapping/);
});
test('refuses duplicate request IDs and mismatched request mapping',()=>{
 const f=fixture();f.manifest.entries[1].custom_id=f.manifest.entries[0].custom_id;assert.throws(()=>validatePilot(f.manifest,f.requests),/duplicate/);
 const other=fixture();other.manifest.entries[0].custom_id='different';assert.throws(()=>validatePilot(other.manifest,other.requests),/do not match/);
});
test('maps errors by custom ID regardless of order and rejects duplicate or foreign output',()=>{
 const f=fixture(),known=validatePilot(f.manifest,f.requests),seen=new Set();
 const row={custom_id:'place_Q99',error:{code:'batch_expired'}};
 assert.equal(decodeResult(row,known,seen).entry.output,'places/Q99.jpg');
 assert.throws(()=>decodeResult(row,known,seen),/duplicate/);
 assert.throws(()=>decodeResult({custom_id:'foreign'},known,new Set()),/Unknown/);
});
test('requires exactly one real-sized JPEG payload for a successful result',()=>{
 const f=fixture(),known=validatePilot(f.manifest,f.requests);
 assert.throws(()=>decodeResult({custom_id:'place_Q0',response:{status_code:200,body:{data:[]}}},known,new Set()),/one image/);
 assert.throws(()=>decodeResult({custom_id:'place_Q0',response:{status_code:200,body:{data:[{b64_json:'not base64'}]}}},known,new Set()),/encoding/);
});
