import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPreview,addCameraMoment,removeCityPhoto,photoMonthProgress,cityPhotoMonth,readPreview,type PreviewState,type AgeBand} from './index.ts';
const images=["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDQooor0TU//9k=", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCzRRRUnGf/2Q==", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDpKKKK8k7T/9k=", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDp6KKK7yj/2Q=="];
const when=(month:number,day=1)=>new Date(2026,month-1,day,12);
function seed(at=when(11),ageBand:AgeBand='16-17'):PreviewState{return {...emptyPreview(at),profile:{name:'Private',avatar:'cloud',ageBand}};}
function post(s:PreviewState,at:Date,n=0){return {...s,photos:addCameraMoment(s,{captureId:`${at.toISOString()}-${n}`,countryId:'JP',capturedAt:at.toISOString(),image:images[n%images.length]},true,at)};}
function complete(s:PreviewState,at:Date){for(let i=0;i<3;i++)s=post(s,at,i);return s;}

test('monthly camera progress spans weeks and resets at the local calendar month boundary',()=>{
 let s=seed();for(const [i,day]of [2,12,28].entries())s=post(s,when(11,day),i);
 assert.equal(photoMonthProgress(s,when(11,30)).count,3);
 assert.equal(photoMonthProgress(s,when(11,30)).done,true);
 assert.equal(photoMonthProgress(s,when(12)).count,0);
 assert.equal(cityPhotoMonth(new Date(2027,0,1,0,0)), '2027-01');
 assert.equal(s.daily.playsToday,0);
});
test('new and migrated profiles have a first-month grace period and a missed task pauses activity',()=>{
 const s=seed();assert.equal(photoMonthProgress(s,when(11)).active,true);
 assert.equal(photoMonthProgress(s,when(11)).status,'due');
 assert.equal(photoMonthProgress(s,when(12)).active,false);
 assert.equal(photoMonthProgress(s,when(12)).status,'paused');
 const legacy=JSON.parse(JSON.stringify(s));delete legacy.photos.activityStartedMonth;
 const restored=readPreview(legacy,when(12));
 assert.equal(restored.photos.activityStartedMonth,'2026-12');
 assert.equal(photoMonthProgress(restored,when(12)).active,true);
});
test('completing this month maintains next-month activity and three fresh shots reactivate a paused profile',()=>{
 let s=complete(seed(),when(11,18));
 assert.equal(photoMonthProgress(s,when(11,18)).status,'renewed');
 assert.equal(photoMonthProgress(s,when(12)).active,true);
 const january=new Date(2027,0,1,12);
 assert.equal(photoMonthProgress(s,january).status,'paused');
 for(const p of s.photos.photos)s={...s,photos:removeCityPhoto(s,p.id)};
 s=complete(s,january);
 assert.equal(photoMonthProgress(s,january).active,true);
 assert.equal(photoMonthProgress(s,january).done,true);
 assert.equal(photoMonthProgress(readPreview(JSON.parse(JSON.stringify(s)),january),january).count,3);
});
test('deletion retains timestamped monthly credit and does not allow duplicate credit',()=>{
 let s=seed();const at=when(11,18);
 for(let i=0;i<15;i++){s=post(s,at,i);s={...s,photos:removeCityPhoto(s,s.photos.photos[0].id)};}
 assert.equal(s.photos.photos.length,0);
 assert.equal(photoMonthProgress(s,at).count,15);
 const again=post(s,at,0);assert.equal(again.photos.credits.length,15);
 const restored=readPreview(JSON.parse(JSON.stringify(s)),at);
 assert.equal(photoMonthProgress(restored,at).count,15);
 assert.equal(photoMonthProgress(restored,when(12)).count,0);
});
test('legacy photos backfill exact monthly timestamps even when their old week crosses months',()=>{
 const at=when(11,1),s=post(seed(at),at),legacy=JSON.parse(JSON.stringify(s));
 delete legacy.photos.credits[0].capturedAt;
 const restored=readPreview(legacy,at);
 assert.equal(photoMonthProgress(restored,at).count,1);
 const removed={...restored,photos:removeCityPhoto(restored,restored.photos.photos[0].id)};
 assert.equal(photoMonthProgress(readPreview(JSON.parse(JSON.stringify(removed)),at),at).count,1);
});
test('legacy deleted credits are assigned only when the complete old week lies in one month',()=>{
 let s=seed();s.photos.credits=[{captureId:'inside',week:'2026-11-16',ageBand:'16-17'},{captureId:'boundary',week:'2026-10-26',ageBand:'16-17'}];
 assert.equal(photoMonthProgress(readPreview(s,when(11,18)),when(11,18)).count,1);
 assert.equal(photoMonthProgress(readPreview(s,when(11,18)),when(10,30)).count,0);
});
test('monthly progress is cohort-specific and unreviewed captures never count',()=>{
 const at=when(11,18);let s=post(seed(),at);
 assert.equal(photoMonthProgress({...s,profile:{...s.profile!,ageBand:'18-20'}},at).count,0);
 assert.throws(()=>addCameraMoment(s,{captureId:'unreviewed',countryId:'JP',capturedAt:at.toISOString(),image:images[1]},false,at));
 assert.equal(photoMonthProgress(s,at).count,1);
 s=post(seed(at,'10-12'),at);assert.equal(s.photos.photos[0].visibility,'private');assert.equal(photoMonthProgress(s,at).count,1);
});
