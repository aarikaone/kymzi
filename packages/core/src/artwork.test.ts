import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ATTRACTIONS,ATTRACTION_ATLASES,attractionArtwork} from './index.ts';
test('each of the 104 attractions has its own valid illustration frame',()=>{const frames=ATTRACTIONS.map(a=>{const art=attractionArtwork(a.id)!;assert.ok(ATTRACTION_ATLASES.includes(art.file));assert.ok(art.column===0||art.column===1);assert.ok(art.row>=0&&art.row<=3);return `${art.file}:${art.row}:${art.column}`;});assert.equal(new Set(frames).size,104);assert.equal(ATTRACTION_ATLASES.length,13);assert.equal(attractionArtwork('missing'),null);});
test('illustration frames follow the reviewed city-pair layout',()=>{assert.deepEqual(attractionArtwork('jp-1'),{file:'atlas-01',column:0,row:0,columns:2,rows:4});assert.deepEqual(attractionArtwork('br-1'),{file:'atlas-01',column:0,row:2,columns:2,rows:4});assert.deepEqual(attractionArtwork('ar-4'),{file:'atlas-13',column:1,row:3,columns:2,rows:4});});
