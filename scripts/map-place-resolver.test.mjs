import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMapsPlace} from './map-place-resolver.mjs';
test('short Maps share resolves to provider identity and bounded metadata without executing HTML',async()=>{
 const calls=[];const result=await resolveMapsPlace('https://maps.app.goo.gl/abc',{request:async url=>{calls.push(url);return calls.length===1?new Response(null,{status:302,headers:{location:'https://www.google.com/maps/place/Senso-ji,+Tokyo,+Japan?query_place_id=place1'}}):new Response('<meta property="og:title" content="Senso-ji - Google Maps"><script>throw new Error()</script>');}});
 assert.equal(calls.length,2);assert.equal(result.maps.identity,'google:id:place1');assert.equal(result.city,'Tokyo');assert.equal(result.name,'Senso-ji');
});
test('rejects redirect escapes before any request to arbitrary hosts or private addresses',async()=>{
 for(const to of ['http://maps.apple.com/?q=Park','https://127.0.0.1/secret','https://evil.example/maps?q=Park']){let count=0;await assert.rejects(resolveMapsPlace('https://maps.app.goo.gl/abc',{request:async()=>{count++;return new Response(null,{status:302,headers:{location:to}});}}));assert.equal(count,1);}
});
test('redirect loops and unavailable metadata fail, rather than pretend a place was verified',async()=>{
 let count=0;await assert.rejects(resolveMapsPlace('https://maps.app.goo.gl/abc',{request:async()=>{count++;return new Response(null,{status:302,headers:{location:'https://maps.app.goo.gl/abc'}});}}));assert.equal(count,5);
 await assert.rejects(resolveMapsPlace('https://maps.apple.com/?q=Park',{request:async()=>new Response('',{status:503})}));
});
test('Apple place metadata can supply a title when only the provider ID is in the URL',async()=>{
 const r=await resolveMapsPlace('https://maps.apple.com/place?place-id=123',{request:async()=>new Response('<meta content="City Garden | Apple Maps" property="og:title">')});assert.equal(r.name,'City Garden');assert.equal(r.maps.identity,'apple:id:123');
});
