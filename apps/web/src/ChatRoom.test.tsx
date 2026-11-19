import {useState} from 'react';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {emptyPreview,emptyLaunch,simulatePalUnlock,seedGlobalPals,comingHomeVisit,checkInHomeVisit,previewHomePalCheckIn,startHomeVisitChat,homeVisitMeet,type PreviewState} from '@rymzi/core';
import {ChatRoom} from './ChatRoom';
import App from './App';
const NOW=new Date('2026-11-19T05:00:00Z'),KEY='rymzi.preview.v1';
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('reply ideas fill an editable draft, multiline Enter sends once, and empty drafts stay disabled',async()=>{
 const sent=vi.fn();function Room(){const [draft,setDraft]=useState('');return <ChatRoom alias="Pal 01" avatar="cloud" yourAvatar="sprout" city="Tokyo" mode="pal" status="5 matches together" messages={[]} draft={draft} onDraft={setDraft} onSend={()=>{sent(draft);setDraft('');}} inputLabel="Your message" sendLabel="Send message" logLabel="Conversation"/>;}
 const u=userEvent.setup();render(<Room/>);expect(screen.getByRole('button',{name:'Send message'}).hasAttribute('disabled')).toBe(true);await u.click(screen.getByRole('button',{name:'Reply idea: Hey, pal 👋'}));expect((screen.getByLabelText('Your message') as HTMLTextAreaElement).value).toBe('Hey, pal 👋');expect(sent).not.toHaveBeenCalled();expect(document.activeElement).toBe(screen.getByLabelText('Your message'));await u.keyboard('{Shift>}{Enter}{/Shift}Coffee?');expect(sent).not.toHaveBeenCalled();await u.keyboard('{Enter}');expect(sent).toHaveBeenCalledExactlyOnceWith('Hey, pal 👋\nCoffee?');expect(screen.getByRole('button',{name:'Send message'}).hasAttribute('disabled')).toBe(true);
});
it('shows the saved public place and timer in the 25–30 chat, with suggestions and checkout connected to saved state',async()=>{
 let s:PreviewState=seedGlobalPals(simulatePalUnlock({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30',city:'Bengaluru',country:'India'},launch:emptyLaunch(NOW)},NOW),NOW,'Asia/Kolkata');const id=comingHomeVisit(s,NOW)!.peerId;s=checkInHomeVisit(s,id,{city:'Bengaluru',country:'India',placeId:'park',placeName:'Public park entrance'},NOW);s=previewHomePalCheckIn(s,id,{city:'Bengaluru',country:'India'},NOW);s=startHomeVisitChat(s,id,NOW);localStorage.setItem(KEY,JSON.stringify(s));window.history.replaceState(null,'',`/#/pal-visit/${id}`);const u=userEvent.setup();render(<App/>);
 expect(screen.getByRole('button',{name:'View check-ins'}).textContent).toContain('Public park entrance');expect(screen.getByLabelText('60 minutes of shared check-in left')).toBeTruthy();expect(screen.queryByText(/adult walkthrough/i)).toBeNull();await u.click(screen.getByRole('button',{name:'Reply idea: Coffee nearby?'}));expect(homeVisitMeet(JSON.parse(localStorage.getItem(KEY)!),id)!.messages).toHaveLength(1);await u.click(screen.getByRole('button',{name:'Send meetup message'}));expect(screen.getByRole('log',{name:'Meetup chat'}).textContent).toContain('Coffee nearby?');expect(homeVisitMeet(JSON.parse(localStorage.getItem(KEY)!),id)!.messages).toHaveLength(3);await u.click(screen.getByRole('button',{name:'Check out'}));expect(screen.queryByLabelText('Message your pal')).toBeNull();expect(screen.getByRole('button',{name:'Check in here'})).toBeTruthy();
});
