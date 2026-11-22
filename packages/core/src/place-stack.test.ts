import test from 'node:test';
import assert from 'node:assert/strict';
import {travelPlaceStack,validPlaceStack,travelPreview} from './index.ts';
test('the floating draft replaces current-city picks including an empty selection, without mutating saved lists',()=>{
 const t=travelPreview(['GB'],['JP','FR']),before=JSON.stringify(t);
 assert.deepEqual(travelPlaceStack(t,'wishlist',{cityId:'JP',ids:['jp-3','jp-3','fr-1','unknown']}),['fr-1','fr-2','jp-3']);
 assert.deepEqual(travelPlaceStack(t,'wishlist',{cityId:'JP',ids:[]}),['fr-1','fr-2']);
 assert.deepEqual(travelPlaceStack(t,'visited',{cityId:'JP',ids:['jp-1']}),['gb-1','gb-2','jp-1']);assert.equal(JSON.stringify(t),before);
});
test('the global stack removes unknown and duplicate IDs while preserving addition order',()=>{assert.deepEqual(validPlaceStack(['jp-1','wrong','fr-1','jp-1']),['jp-1','fr-1']);});
