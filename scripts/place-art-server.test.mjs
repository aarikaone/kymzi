import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlaceArtServer,placeArtInput} from './place-art-server.mjs';
const input={name:'Cubbon Park',categoryId:'park',city:'Bengaluru',country:'India'};
async function withServer(options,run){const server=createPlaceArtServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));try{await run(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(r=>server.close(r));}}
const post=(url,body=input)=>fetch(url+'/api/place-art',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('art input excludes GPS and profile data and validates category',()=>{
 assert.deepEqual(placeArtInput({...input,latitude:1,longitude:2,profileId:'private'}),input);
 assert.throws(()=>placeArtInput({...input,categoryId:'invalid'}));
});
test('no server key returns a controlled fallback without calling the provider',async()=>{
 let called=false;await withServer({env:{},request:()=>{called=true;throw new Error();}},async url=>{assert.equal((await post(url)).status,503);assert.equal(called,false);});
});
test('real integration contract caches art, keeps the key on the server and sends no GPS',async()=>{
 let calls=0;await withServer({env:{OPENAI_API_KEY:'test-secret'},request:async(url,request)=>{calls++;assert.equal(request.headers.Authorization,'Bearer test-secret');assert.ok(!request.body.includes('latitude'));return Response.json({data:[{b64_json:'aGVsbG8='}]});}},async url=>{
  const a=await post(url,{...input,latitude:12,longitude:77});assert.equal(a.status,200);assert.deepEqual(await a.json(),{illustration:'data:image/jpeg;base64,aGVsbG8='});assert.equal((await post(url)).status,200);assert.equal(calls,1);
 });
});
test('untrusted origins, bad categories, oversized payloads and provider failures are bounded',async()=>{
 await withServer({env:{OPENAI_API_KEY:'test-secret'},request:async()=>new Response('',{status:500})},async url=>{
  assert.equal((await fetch(url+'/api/place-art',{method:'POST',headers:{Origin:'https://untrusted.invalid','Content-Type':'application/json'},body:JSON.stringify(input)})).status,403);
  assert.equal((await post(url,{...input,categoryId:'invalid'})).status,400);
  assert.equal((await post(url,{...input,name:'x'.repeat(5000)})).status,413);
  const result=await post(url);assert.equal(result.status,502);assert.ok(!(await result.text()).includes('test-secret'));
 });
});
