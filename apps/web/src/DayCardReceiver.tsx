import {publicCdnImage} from '@rymzi/core';
import {useEffect,useRef,useState} from 'react';
import {answerFriendInvite,dayCardPicks,friendScore,inviteQuestions,palFindingProgress,receiverPreviewProfile,receiverPreviewReply,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import {PerfectDayCard,PerfectDayPlay} from './PerfectDay';
import {webChallengeCrypto} from './launchCrypto';
import {Icon} from './icons';
import './day-card-receiver.css';

export function DayCardReceiver({state,invite,onComplete,onReturn}:{state:PreviewState;invite:FriendInvite;onComplete:(reply:FriendReply)=>void|Promise<void>;onReturn:()=>void}) {
 const [guest]=useState(()=>receiverPreviewProfile(state,invite)),[reply,setReply]=useState(()=>receiverPreviewReply(state,invite));
 const [answers,setAnswers]=useState(['','','']),[index,setIndex]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<FriendReply|undefined>(undefined),lock=useRef(false),alive=useRef(true),questions=inviteQuestions(invite);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function next(){
  if(lock.current||!answers[index])return;
  if(index<2){setIndex(i=>i+1);return;}
  lock.current=true;setBusy(true);setError('');
  try{
   const result=pending.current??await answerFriendInvite(invite,guest,answers,webChallengeCrypto);
   pending.current=result;
   if(!alive.current)return;
   await onComplete(result);
   if(alive.current)setReply(result);
  }catch(e){if(alive.current)setError((e as Error).message);}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 if(!reply)return <PerfectDayPlay questions={questions} index={index} answer={answers[index]} answers={Object.fromEntries(questions.map((q,i)=>[q.id,answers[i]]))} onSelect={value=>{if(!lock.current){pending.current=undefined;setAnswers(v=>v.map((a,i)=>i===index?value:a));}}} onNext={()=>void next()} busy={busy} finalLabel="See our day cards" header={<><span className="receiver-from">A DAY CARD FROM #{invite.person.name}</span>{error&&<p role="alert" className="place-error">{error}</p>}</>}/>;
 const score=friendScore(reply),progress=palFindingProgress(state);
 return <div className="receiver-connected"><div className="receiver-connected-body"><span className="receiver-from">{progress.unlocked?'GLOBAL PLAY IS ON':'YOUR FIRST CIRCLE'}</span><div className="receiver-pair" aria-label="You and your new friend"><img src={publicCdnImage(`/avatars/${invite.person.avatar}.webp`)} alt={`Sender ${invite.person.name}`}/><span><Icon name="check" size={23}/></span><img src={publicCdnImage(`/avatars/${reply.person.avatar}.webp`)} alt={`Receiver ${reply.person.name}`}/></div><h1>{progress.unlocked?'Your world.':'You’re'}<br/><em>{progress.unlocked?'Wide open.':'connected.'}</em></h1><p>{progress.unlocked?'Five friends. A whole world to explore.':`Added to #${invite.person.name}’s circle.`}</p><span className="receiver-score">{progress.unlocked?'5/5 connected':`${progress.count} added · ${progress.remaining} left`}</span><span className="receiver-score">{score.shared}/3 shared picks</span>{answers.every(Boolean)&&<PerfectDayCard compact picks={dayCardPicks(invite.ids,answers)} title="Your kind of day."/>}</div><footer><button className="place-primary" onClick={onReturn}>{progress.unlocked?'Open my world':'Back to my profile'}<Icon name="arrow"/></button></footer></div>;
}

export function ReceiverCircle({state,onOpen,onInvite,onFeed}:{state:PreviewState;onOpen:()=>void;onInvite?:()=>void;onFeed?:()=>void}) {
 const {friends,count,remaining,canPlay}=palFindingProgress(state);if(!count)return null;
 return <section className="receiver-circle" aria-label="Your circle">
  <header><h2>Your circle</h2><span className={canPlay?'circle-global is-on':'circle-global'}><Icon name={canPlay?'globe':'lock'} size={13}/>Global {canPlay?'ON':'OFF'}</span></header>
  <div className="circle-total"><span><b>{count}</b>/5</span><div><strong>{count} {count===1?'friend':'friends'}</strong><small>{canPlay?'Your world is open.':`${count} added · ${remaining} left`}</small></div></div>
  <div className="receiver-circle-faces">{Array.from({length:5},(_,i)=>{const reply=friends[i];return reply?<button key={reply.person.name} onClick={onOpen} aria-label={`View friend ${reply.person.name}`}><span><img src={publicCdnImage(`/avatars/${reply.person.avatar}.webp`)} alt=""/><i><Icon name="check" size={11}/></i></span><strong>#{reply.person.name}</strong></button>:<span key={i} className="circle-empty-slot" aria-label="Friend slot available"><Icon name="plus" size={20}/></span>;})}</div>
  <div className="receiver-circle-meter" role="progressbar" aria-label="Global unlock progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={count}>{Array.from({length:5},(_,i)=><i className={i<count?'complete':''} key={i}/>)}</div>
  {(onInvite||onFeed)&&<footer className="receiver-circle-actions">{!canPlay&&onInvite&&<button className="place-primary" onClick={onInvite}>Invite next friend<Icon name="arrow" size={18}/></button>}{onFeed&&<button className={canPlay?'place-primary':'circle-feed-link'} onClick={onFeed}>{canPlay?'Explore the world':'See your feed'}<Icon name="arrow" size={18}/></button>}</footer>}
 </section>;
}
