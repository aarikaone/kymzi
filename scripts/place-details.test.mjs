import test from 'node:test';
import assert from 'node:assert/strict';
import {factQuery,yearLabel,factsFromRows,makeDetails,detailWrite} from './enrich-place-details.mjs';
const city={city:'Jaipur',country:'India',aliases:['Jaipur']};
const place={id:'Q836531',name:'Hawa Mahal',kind:'Palace',description:'palace in Jaipur, Rajasthan, India',sourceUrl:'https://www.wikidata.org/wiki/Q836531'};
test('keeps dates at their sourced precision rather than inventing a year',()=>{
 assert.equal(yearLabel('1799-01-01T00:00:00Z',9),'1799');assert.equal(yearLabel('1700-01-01T00:00:00Z',7),null);assert.equal(yearLabel('-0500-01-01T00:00:00Z',9),'500 BCE');assert.equal(yearLabel('1799-01-01T00:00:00Z',0),null);
});
test('uses preferred claims, actual units and named architectural facts',()=>{
 const row=(property,value,extra={})=>({place:{value:'http://www.wikidata.org/entity/Q836531'},property:{value:'http://www.wikidata.org/entity/'+property},value:{value},rank:{value:'http://wikiba.se/ontology#NormalRank'},...extra});
 const r=factsFromRows([row('P571','1799-01-01T00:00:00Z',{precision:{value:'9'}}),row('P84','Q1',{label:{value:'Architect A'}}),row('P84','Q2',{label:{value:'Architect B'},rank:{value:'http://wikiba.se/ontology#PreferredRank'}}),row('P2048','15',{unitLabel:{value:'metre'}})]).Q836531.facts;
 assert.deepEqual(r,[{label:'Established',value:'1799'},{label:'Architect',value:'Architect B'},{label:'Height',value:'15 m'}]);
});
test('never attaches an encyclopedia description for a different attraction',()=>{
 const wrong={title:'Another palace',extract:'A long description of an unrelated palace.',pageprops:{wikibase_item:'Q999'}};
 const d=makeDetails(place,city,{facts:[{label:'Opened',value:'1799'}]},wrong,'today');assert.equal(d.status,'limited');assert.ok(!d.description.includes('unrelated'));assert.equal(d.credits.length,1);
 const right={...wrong,title:'Hawa Mahal',pageprops:{wikibase_item:'Q836531'}};const valid=makeDetails(place,city,{},right,'today');assert.equal(valid.status,'complete');assert.equal(valid.credits[0].license,'CC BY-SA 4.0');
 assert.equal(makeDetails(place,city,{}, {...right,pageprops:{wikibase_item:'Q836531',disambiguation:''}},'today').status,'limited');
});
test('writes only detail fields into existing Kymzi attraction records, preserving image publishing',()=>{
 const write=detailWrite('cities/city:1269515/attractions/Q836531',makeDetails(place,city,{},null,'today'));
 assert.deepEqual(write.updateMask.fieldPaths,['details','detailsStatus','detailsUpdatedAt']);assert.equal(write.currentDocument.exists,true);assert.ok(write.update.name.startsWith('projects/kymzi-f1e9d/'));assert.ok(!('image' in write.update.fields));assert.ok(!('catalogueContentHash' in write.update.fields));
 assert.throws(()=>detailWrite('profiles/private',{}),/Unexpected/);assert.throws(()=>factQuery(['Q1 } bad query']),/known/);
});

test('does not present conflicting quantities as a single established fact',()=>{const row=amount=>({place:{value:'http://www.wikidata.org/entity/Q456817'},property:{value:'http://www.wikidata.org/entity/P2046'},value:{value:amount},unitLabel:{value:'hectare'}});assert.deepEqual(factsFromRows([row('30'),row('498')]).Q456817.facts,[]);});
