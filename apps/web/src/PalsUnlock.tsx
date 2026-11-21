import {publicCdnImage} from '@rymzi/core';
import type {ReactNode} from 'react';
import {palFindingProgress,type PreviewState} from '@rymzi/core';
import {Icon} from './icons';
import './pals-unlock.css';

export function PalsUnlock({state,onInvite,onFriend,children}:{state:PreviewState;onInvite:()=>void;onFriend:()=>void;children?:ReactNode}) {
 const {friends,count,remaining}=palFindingProgress(state);
 return <div className="pals-unlock">
  {children}
  <section className="pals-global-box" aria-label="Unlock Global Roamies">
   <header><span className="pals-global-icon"><Icon name="globe" size={30}/></span><h2>Global Roamies</h2><span className="pals-global-off"><Icon name="lock" size={11}/>OFF</span></header>
   <div className="pals-unlock-friends">{Array.from({length:5},(_,i)=>{const reply=friends[i];return reply?<button key={reply.person.name} onClick={onFriend} aria-label={`View friend ${reply.person.name}`}><img src={publicCdnImage(`/avatars/${reply.person.avatar}.webp`)} alt=""/><i><Icon name="check" size={11}/></i></button>:<span key={i} className="pals-empty-friend" aria-label="Friend slot available">{i+1}</span>;})}</div>
   <div className="pals-global-progress" role="progressbar" aria-label="Global unlock progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={count} aria-valuetext={`${count} friends connected, ${remaining} more to unlock Global Roamies`}>{Array.from({length:5},(_,i)=><i key={i} className={i<count?'complete':''}/>)}</div>
   <div className="pals-unlock-count"><strong>{remaining}</strong><span>{remaining===1?'friend':'friends'} to go</span></div>
   <p>Bring 5 friends. Meet new Roamies around the world.</p>
   <button className="pals-invite-button" onClick={onInvite}>Invite a friend<Icon name="arrow" size={20}/></button>
  </section>
 </div>;
}
