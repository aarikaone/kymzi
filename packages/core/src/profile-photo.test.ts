import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,beginDaily,answerDaily,completeDemoPlay,beginPalPlay,palSummaries,readPreview,makeProfilePhoto,readProfilePhoto,profilePhotoForPal,type PreviewState} from './index.ts';
const NOW=new Date('2026-11-18T05:00:00Z');
const JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDQooor0TU//9k=";
function seed(){return {...emptyPreview(NOW),profile:{name:'Nova',avatar:'nori',ageBand:'18-20',photo:makeProfilePhoto(JPEG,'18-20',NOW)}} as PreviewState;}
function play(s:PreviewState,id?:string,country='JP'){let daily=id?beginPalPlay(s,id,'food',NOW):beginDaily(s.daily,s.profile!.ageBand,NOW,'food',country as 'JP');for(const q of daily.active!.ids)daily=answerDaily(daily,q,'my thought',NOW);return completeDemoPlay({...s,daily},NOW);}
test('a personal photo reveals per Roamie after three matches, never three unrelated plays',()=>{
 let s=play(seed()),id=palSummaries(s)[0].id;assert.equal(profilePhotoForPal(s,id),undefined);s=play(s,id);assert.equal(profilePhotoForPal(s,id),undefined);s=play(s,id);assert.equal(profilePhotoForPal(s,id)?.image,JPEG);assert.equal(profilePhotoForPal(s,'unknown'),undefined);
 assert.equal(profilePhotoForPal({...s,blocked:[id]},id),undefined);assert.equal(profilePhotoForPal({...s,profile:{...s.profile!,ageBand:'16-17'}},id),undefined);assert.equal(profilePhotoForPal({...s,profile:{...s.profile!,ageBand:'10-12'}},id),undefined);
 let different=seed();for(const country of ['JP','FR','BR'])different=play(different,undefined,country);assert.equal(different.daily.playsToday,3);for(const pal of palSummaries(different))assert.equal(profilePhotoForPal(different,pal.id),undefined);
});
test('photo persistence, replacement and removal never credit monthly shots or change game progress',()=>{
 let s=play(seed()),id=palSummaries(s)[0].id;s=play(play(s,id),id);const next=readPreview(JSON.parse(JSON.stringify(s)),NOW);assert.deepEqual(next.profile,s.profile);assert.deepEqual(next.daily,s.daily);assert.deepEqual(next.photos,s.photos);assert.equal(next.photos.credits.length,0);
 next.profile={...next.profile!,photo:makeProfilePhoto(JPEG,'18-20',new Date(NOW.getTime()+1000))};assert.notEqual(profilePhotoForPal(next,id)?.uploadedAt,s.profile!.photo!.uploadedAt);delete next.profile.photo;assert.equal(profilePhotoForPal(next,id),undefined);assert.equal(readPreview(next,NOW).profile?.photo,undefined);
});
test('profile readers whitelist fields and reject remote, corrupt, oversized or wrong-cohort photos',()=>{
 const s=seed();for(const image of ['https://example.org/face.jpg','file:///private/face.jpg','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,AAAA','x'.repeat(120001)])assert.equal(readProfilePhoto({...s.profile!.photo,image},'18-20'),undefined);
 assert.equal(readProfilePhoto({...s.profile!.photo,uploadedAt:'not a date'},'18-20'),undefined);assert.equal(readProfilePhoto(s.profile!.photo,'16-17'),undefined);
 const raw={...s,profile:{...s.profile,hiddenIdentity:'secret',photo:{...s.profile!.photo,originalUri:'private',latitude:1}}};const restored=readPreview(raw,NOW);assert.equal(JSON.stringify(restored.profile).includes('private'),false);assert.equal(JSON.stringify(restored.profile).includes('secret'),false);
 const child=seed();child.profile={...child.profile!,ageBand:'10-12',photo:makeProfilePhoto(JPEG,'10-12',NOW)};assert.ok(readPreview(child,NOW).profile?.photo);assert.equal(profilePhotoForPal(child,'any'),undefined);
});
test('profile JPEG sanitation strips embedded GPS and private camera tags',()=>{
 const jpeg=Buffer.from(JPEG.split(',')[1],'base64'),tag=Buffer.from('GPSLatitude PrivateCamera'),len=tag.length+2,segment=Buffer.concat([Buffer.from([255,225,len>>8,len&255]),tag]),image='data:image/jpeg;base64,'+Buffer.concat([jpeg.subarray(0,2),segment,jpeg.subarray(2)]).toString('base64');
 assert.equal(makeProfilePhoto(image,'18-20',NOW).image,JPEG);
});
