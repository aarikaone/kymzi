import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCitySuggestion,citySuggestionIdentity,existingSuggestedCity} from './city-suggestions.ts';
import {TRAVEL_CITIES} from './world-catalogue.ts';
test('city suggestions trim and normalise Unicode names without changing their display spelling',()=>{
 assert.deepEqual(prepareCitySuggestion({city:'  São   Tomé ',country:' São Tomé and Príncipe '}),{city:'São Tomé',country:'São Tomé and Príncipe'});
 assert.deepEqual(prepareCitySuggestion({city:'東京',country:'日本'}),{city:'東京',country:'日本'});
});
test('city suggestions require meaningful bounded city and country names',()=>{
 for(const invalid of ['', 'A', '123', 'x'.repeat(81), '<city>', 'City\u0000']){
  assert.throws(()=>prepareCitySuggestion({city:invalid,country:'India'}));assert.throws(()=>prepareCitySuggestion({city:'Neral',country:invalid}));
 }
});
test('repeated suggestions share an identity across spacing, case and accents while pairs cannot collide',()=>{
 assert.equal(citySuggestionIdentity({city:' São  Tomé ',country:'INDIA'}),citySuggestionIdentity({city:'sao tome',country:'India'}));
 assert.notEqual(citySuggestionIdentity({city:'AA|BB',country:'CC'}),citySuggestionIdentity({city:'AA',country:'BB|CC'}));
 assert.notEqual(citySuggestionIdentity({city:'Neral',country:'India'}),citySuggestionIdentity({city:'Neral',country:'France'}));
});
test('existing city names and aliases are detected within their country without changing the catalogue',()=>{
 const before=TRAVEL_CITIES.length;assert.equal(existingSuggestedCity({city:'Tokyo',country:'Japan'})?.city,'Tokyo');assert.equal(existingSuggestedCity({city:'tokyo',country:'JP'})?.city,'Tokyo');
 assert.ok(existingSuggestedCity({city:'Coorg',country:'India'}));assert.equal(existingSuggestedCity({city:'Tokyo',country:'France'}),undefined);assert.equal(existingSuggestedCity({city:'Cloudberry Bay',country:'India'}),undefined);assert.equal(TRAVEL_CITIES.length,before);
});
