import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createHash,webcrypto} from 'node:crypto';
import {answerInvitePreparation,beginDayCard,emptyLaunch,emptyPreview,finishInvitePreparation,makeFriendInvite,questionById,rememberInvite,submitInvitePreparation,challengeToken,type PreviewState} from '@rymzi/core';
import {LaunchInvite} from './LaunchExperience';
import {SenderPostcardPreview} from './TravelPostcard';
import {webChallengeCrypto} from './launchCrypto';
import App from './App';
const NOW=new Date('2026-11-22T07:00:00Z');
const crypto={nonce:()=> 'a'.repeat(32),digest:async(value:string)=>createHash('sha256').update(value).digest('hex')};
async function seed(){let state:PreviewState=beginDayCard({...emptyPreview(NOW),profile:{name:'123456',avatar:'cloud',ageBand:'25-30'},launch:emptyLaunch(NOW)},NOW);for(let i=0;i<3;i++){state=answerInvitePreparation(state,i,questionById(state.launch!.preparation!.ids[i])!.choices![0].label);state=submitInvitePreparation(state,i);}state=finishInvitePreparation(state,NOW);const invite=await makeFriendInvite(state,crypto,NOW);state=rememberInvite(state,invite,NOW);return {state,invite,ticket:state.launch!.tickets[0]};}
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);vi.stubGlobal('crypto',webcrypto);});afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('shows a closed envelope with the sender’s exact three answers arranged underneath',async()=>{
 const {state,invite,ticket}=await seed(),later={...ticket,id:'later',answers:ticket.ids.map(id=>questionById(id)!.choices![1].label)};render(<LaunchInvite invite={invite} state={{...state,launch:{...state.launch!,tickets:[ticket,later]}}} onBack={()=>{}}/>);
 const envelope=screen.getByRole('article',{name:'Sealed postcard from #123456'}),answers=screen.getByRole('region',{name:'Your postcard answers'});await within(answers).findByText(ticket.answers[0]);const rows=within(answers).getAllByRole('listitem');expect(rows).toHaveLength(3);rows.forEach((row,i)=>{expect(row.textContent).toContain(ticket.answers[i]);expect(row.textContent).toContain(questionById(invite.ids[i])!.prompt);});expect(envelope.compareDocumentPosition(answers)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(within(answers).getByText('Only you')).toBeTruthy();expect(within(envelope).queryByRole('list')).toBeNull();expect(screen.queryByRole('article',{name:'Travel postcard from #123456'})).toBeNull();expect(document.querySelector('.postcard-landscape')).toBeNull();expect(screen.getByRole('button',{name:'Send my postcard'})).toBeTruthy();
});
it('keeps sharing the same sealed invitation link after its answer preview loads',async()=>{
 const {state,invite,ticket}=await seed(),u=userEvent.setup();render(<LaunchInvite invite={invite} state={state} onBack={()=>{}}/>);await within(screen.getByRole('region',{name:'Your postcard answers'})).findByText(ticket.answers[0]);await u.click(screen.getByRole('button',{name:'Copy link'}));expect(await screen.findByRole('status')).toHaveProperty('textContent','Link copied. Send your postcard.');const link=new URL(await navigator.clipboard.readText());expect(link.hash).toBe('#/challenge/'+challengeToken(invite));
});
it('shows sender-only answers on the share screen while the Receiver still sees only the sealed card',async()=>{
 const {state,invite,ticket}=await seed(),u=userEvent.setup();localStorage.setItem('rymzi.preview.v1',JSON.stringify(state));window.history.replaceState(null,'','/#/launch/invite/'+invite.id);render(<App/>);await within(screen.getByRole('region',{name:'Your postcard answers'})).findByText(ticket.answers[0]);await u.click(screen.getByRole('button',{name:'Receiver'}));expect(screen.getByRole('article',{name:'Sealed postcard from #123456'})).toBeTruthy();expect(screen.queryByRole('region',{name:'Your postcard answers'})).toBeNull();for(const answer of ticket.answers)expect(screen.queryByText(answer)).toBeNull();expect(screen.getByRole('button',{name:'Answer to open'})).toBeTruthy();
});
it('shows a retry for preview errors and never substitutes invented answers when local picks are absent',async()=>{
 const {state,invite,ticket}=await seed(),u=userEvent.setup();vi.spyOn(webChallengeCrypto,'digest').mockRejectedValueOnce(new Error('temporarily unavailable'));const view=render(<SenderPostcardPreview invite={invite} state={state}/>);expect(await screen.findByRole('alert')).toHaveProperty('textContent','Couldn’t load your picks.');expect(screen.queryByRole('list')).toBeNull();await u.click(screen.getByRole('button',{name:'Try again'}));await screen.findByText(ticket.answers[0]);expect(screen.getAllByRole('listitem')).toHaveLength(3);view.rerender(<SenderPostcardPreview invite={invite}/>);expect(await screen.findByText('Open on your device to see your picks.')).toBeTruthy();expect(screen.queryByRole('list')).toBeNull();
});
