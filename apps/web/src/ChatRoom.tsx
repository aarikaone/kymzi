import {useEffect,useRef,type ReactNode} from 'react';
import type {AvatarId} from '@rymzi/core';
import {Icon} from './icons';

export type RoomMessage={id:string;from:'you'|'pal';text:string;at:string};
type Props={
 alias:string;avatar:AvatarId;yourAvatar:AvatarId;city:string;mode:'pal'|'meetup';
 messages:RoomMessage[];draft:string;onDraft:(value:string)=>void;onSend:()=>void;
 logLabel:string;inputLabel:string;sendLabel:string;busy?:boolean;error?:string;
 status:string;remaining?:number;previewLabel?:string;
 context?:{label:string;detail:string;actionLabel:string;onAction:()=>void};
 onCheckout?:()=>void;
};
function time(at:string){const date=new Date(at);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(date):'';}
function day(at:string){const date=new Date(at);if(!Number.isFinite(date.getTime()))return '';return date.toDateString()===new Date().toDateString()?'Today':new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(date);}
export function ChatRoom({alias,avatar,yourAvatar,city,mode,messages,draft,onDraft,onSend,logLabel,inputLabel,sendLabel,busy=false,error,status,remaining,previewLabel,context,onCheckout}:Props){
 const log=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight;},[messages.length,messages.at(-1)?.id]);
 useEffect(()=>{const field=input.current;if(field){field.style.height='0px';field.style.height=`${Math.min(104,Math.max(48,field.scrollHeight))}px`;}},[draft]);
 function send(){if(!busy&&draft.trim())onSend();}
 const ideas=mode==='meetup'?['Hey, roamie 👋','See you at the entrance?','Coffee nearby?']:['Hey, roamie 👋','Your city’s hidden gem?','What should I try first?'];
 return <div className="chat-room">
  <header className="room-header">
   <div className="room-avatar"><img src={`/avatars/${avatar}.webp`} alt={`${alias}’s chosen character`}/><i aria-hidden="true"><Icon name="spark" size={12}/></i></div>
   <div className="room-identity"><span>YOUR PAL, A NEW STORY</span><h1 tabIndex={-1}>{alias}</h1><p><Icon name="pin" size={13}/>{city}</p></div>
   {remaining!==undefined?<div className="room-timer" aria-label={`${remaining} minutes of shared check-in left`}><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle cx="24" cy="24" r="21" strokeDasharray={`${Math.max(0,Math.min(1,remaining/60))*132} 132`}/></svg><strong>{remaining}<small>min</small></strong></div>:<span className="room-match-mark" aria-label="Five matches together">5<Icon name="spark" size={13}/></span>}
  </header>
  <div className="room-status"><span aria-hidden="true"/><p>{status}</p>{previewLabel&&<small>{previewLabel}</small>}</div>
  {context&&<button className="room-context" onClick={context.onAction} aria-label={context.actionLabel}><span className="room-map" aria-hidden="true"><i/><b/><Icon name="pin" size={23}/></span><span><small>{context.label}</small><strong>{context.detail}</strong></span><Icon name="arrow" size={18}/></button>}
  <div className="room-messages" ref={log} role="log" aria-label={logLabel} aria-live="polite" aria-relevant="additions text">
   <div className="room-hello" aria-hidden="true"><span><img src={`/avatars/${yourAvatar}.webp`} alt=""/><img src={`/avatars/${avatar}.webp`} alt=""/></span><em>A hello. A whole new story.</em></div>
   {messages.map((message,i)=>{
    const previous=messages[i-1],newDay=!previous||day(previous.at)!==day(message.at);
    return <MessageGroup key={message.id} divider={newDay?day(message.at):undefined}>
     <div className={`room-message-row ${message.from==='you'?'is-you':''}`}>
      {message.from==='pal'&&<img className="room-message-avatar" src={`/avatars/${avatar}.webp`} alt=""/>}
      <div className="room-message"><p>{message.text}</p><time dateTime={message.at}>{time(message.at)}</time></div>
     </div>
    </MessageGroup>;
   })}
  </div>
  <footer className="room-footer">
   {!draft.trim()&&<div className="room-ideas" aria-label="Reply ideas">{ideas.map(idea=><button key={idea} disabled={busy} aria-label={`Reply idea: ${idea}`} onClick={()=>{onDraft(idea);input.current?.focus();}}>{idea}</button>)}</div>}
   {error&&<p className="room-error" role="alert">{error}</p>}
   <form className="room-composer" onSubmit={e=>{e.preventDefault();send();}}>
    <label className="visually-hidden" htmlFor="room-message">{inputLabel}</label>
    <textarea ref={input} id="room-message" rows={1} value={draft} maxLength={280} placeholder="A little hello…" onChange={e=>onDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
    <button type="submit" aria-label={sendLabel} disabled={busy||!draft.trim()}><Icon name="arrow" size={24}/></button>
   </form>
   <div className="room-footer-note"><span>Local preview · Replies are simulated</span>{onCheckout&&<button disabled={busy} onClick={onCheckout}>Check out<Icon name="close" size={13}/></button>}</div>
  </footer>
 </div>;
}
function MessageGroup({divider,children}:{divider?:string;children:ReactNode}){return <>{divider&&<div className="room-day"><span>{divider}</span></div>}{children}</>;}
