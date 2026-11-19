import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,beginDaily,answerDaily,completeDemoPlay,addCameraMoment,type PreviewState} from '@rymzi/core';
import {LegacyPreview as App} from './App';
const KEY='rymzi.preview.v1',NOW=new Date('2026-11-18T05:00:00Z');
const CAMERA_IMAGE="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDQooor0TU//9k=";
function save(s:PreviewState){localStorage.setItem(KEY,JSON.stringify(s));return s;}
function data(){return JSON.parse(localStorage.getItem(KEY)!) as PreviewState;}
function seed(){return save({...emptyPreview(NOW),profile:{name:'PrivateNova',avatar:'cloud',ageBand:'18-20'}});}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.spyOn(Math,'random').mockReturnValue(0);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('connects arbitrary answers to an unknown pal, their moments, places, visit plan and explicit public meetup',async()=>{
 seed();const user=userEvent.setup();render(<App/>);
 await user.click(screen.getByRole('button',{name:'Find my pal'}));await user.click(screen.getByRole('button',{name:'Choose Food mood'}));
 for(const [i,answer] of ['flying noodles','the 98th moon','a surprise thought'].entries()){
  await user.type(screen.getByRole('textbox',{name:'Your answer'}),answer);
  await user.click(screen.getByRole('button',{name:i===2?'Meet my pal':'Next'}));
 }
 expect(screen.getByRole('heading',{name:'You found a pal.'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Meet my pal'}));
 expect(screen.getByRole('heading',{name:'Pal 01'})).toBeTruthy();await user.click(screen.getAllByRole('button',{name:'Open Pal 01’s photo in Tokyo'})[0]);expect(screen.getByText('Illustrated preview')).toBeTruthy();
 expect(screen.queryByText('PrivateNova')).toBeNull();expect(screen.queryByRole('button',{name:/Chat|Reveal.*photo/})).toBeNull();
 expect(screen.getByRole('button',{name:'Plan visit to Tokyo'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Explore their city'}));
 for(const place of ['Sensō-ji','Shibuya Crossing','Tokyo Tower','Ueno Park'])expect(screen.getByRole('button',{name:`Discover ${place}`})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'City photos'}));
 await user.click(screen.getByRole('button',{name:'Plan visit to Tokyo'}));
 expect((screen.getByRole('combobox',{name:'City'}) as HTMLSelectElement).value).toBe('JP');
 await user.click(screen.getByRole('button',{name:'Post visit'}));
 expect(data().visits.visits[0].status).toBe('planned');expect(data().visits.meetings).toHaveLength(0);
 await user.click(screen.getByRole('button',{name:'Check in'}));
 await user.click(screen.getByRole('button',{name:'Choose Sensō-ji'}));
 expect(data().visits.visits[0].status).toBe('planned');
 await user.click(screen.getByRole('button',{name:'I’m here'}));
 expect(data().visits.visits[0].spotId).toBe('jp-1');
 await user.click(screen.getAllByRole('button',{name:/^Meet Visitor/})[0]);
 await user.click(screen.getByRole('button',{name:'Send meetup request'}));
 expect(screen.getByText('Waiting for a reply')).toBeTruthy();expect(data().visits.meetings[0].visitorAccepted).toBe(false);
 await user.click(screen.getByRole('button',{name:'Preview acceptance'}));
 expect(screen.getByText('Both agreed')).toBeTruthy();expect(screen.getByText('Local preview · No invitation sent')).toBeTruthy();
 expect(data().daily.playsToday).toBe(1);
});
it('returns connected users to pal moments while keeping their own camera collection under You',async()=>{
 let s=seed(),daily=beginDaily(s.daily,'18-20',NOW,'food','JP');
 for(const id of daily.active!.ids)daily=answerDaily(daily,id,'my answer',NOW);
 s=completeDemoPlay({...s,daily},NOW);
 s={...s,photos:addCameraMoment(s,{captureId:'my-own-lens',countryId:'JP',image:CAMERA_IMAGE,capturedAt:NOW.toISOString()},true,NOW)};save(s);
 const user=userEvent.setup();render(<App/>);
 expect(screen.getByRole('button',{name:'Explore'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getAllByRole('article')).toHaveLength(3);expect(screen.getAllByRole('article')[0].getAttribute('aria-label')).toContain('Pal 01');
 expect(screen.queryByRole('button',{name:'Next photo'})).toBeNull();expect(screen.queryByRole('button',{name:'Delete my photo'})).toBeNull();
 fireEvent.keyDown(screen.getByRole('region',{name:'City photo feed'}),{key:'End'});
 expect(screen.getByRole('heading',{name:'Another pal. Another story.'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Profile'}));await user.click(screen.getByRole('button',{name:'My city photos'}));
 expect(screen.getByRole('heading',{name:'My photos.'})).toBeTruthy();expect(screen.getByText('1 / 1')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Delete my photo'})).toBeTruthy();expect(screen.queryByText('Pal 01')).toBeNull();
 expect(screen.queryByRole('button',{name:'Your pals'})).toBeNull();expect(data().daily.playsToday).toBe(1);expect(data().photos.credits).toHaveLength(1);
});
