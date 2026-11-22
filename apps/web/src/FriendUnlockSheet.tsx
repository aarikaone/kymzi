import {profileDisplayName} from '@rymzi/core';
import {friendUnlockContent} from '../../../packages/shared/friendUnlockContent';
import {useEffect,useRef,useState} from 'react';
import {publicCdnImage,type PreviewState} from '@rymzi/core';
import {Icon} from './icons';
import './unlock-sheet.css';
import './friend-unlock.css';
export function FriendUnlockSheet({visible,state,onClose,onShare,onAddAll}:{visible:boolean;state:PreviewState;onClose:()=>void;onShare:()=>void;onAddAll?:()=>void|Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null),lock=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),{friends,count,goal,eligible,canPlay,requirement,explanation,progressLabel,benefit}=friendUnlockContent(state);
 async function addAll(){if(!onAddAll||lock.current)return;lock.current=true;setBusy(true);setError('');try{await onAddAll();onClose();}catch(e){setError((e as Error).message||'Couldn’t unlock. Try again.');}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{const el=dialog.current;if(visible&&!el?.open)el?.showModal();else if(!visible&&el?.open)el.close();},[visible]);
 return <dialog ref={dialog} className="unlock-process-sheet friend-unlock-sheet" aria-label="Find Roamies worldwide" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClose={onClose} onClick={e=>{if(!busy&&e.target===e.currentTarget)onClose();}}><div className="unlock-process-handle"/><div className="unlock-process-top"><span/><button aria-label="Close unlock" disabled={busy} onClick={onClose}><Icon name="close" size={23}/></button></div><div className="friend-unlock-body">
 <div className="friend-unlock-heading"><div className="friend-unlock-globe" aria-hidden="true"><Icon name="globe" size={30}/><i><Icon name={canPlay?'check':'lock'} size={11}/></i></div><h2 className="page-heading">Find Roamies.</h2></div>
 <strong className="friend-unlock-remaining" aria-live="polite">{requirement}</strong>
 <p>{explanation}</p>
 {!canPlay&&<><div className="friend-unlock-faces" aria-label={count+' friends connected'}>{Array.from({length:goal},(_,i)=>{const friend=friends[i];return <span key={i} className={friend?'is-connected':''}>{friend?<img src={publicCdnImage('/avatars/'+friend.person.avatar+'.webp')} alt={'Friend '+profileDisplayName(friend.person)}/>:<Icon name="plus" size={19}/>}</span>;})}</div>
 <div className="friend-unlock-progress-block"><span>{progressLabel}</span><div className="friend-unlock-progress" role="progressbar" aria-label="Friend invite progress" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={count} aria-valuetext={progressLabel}>{Array.from({length:goal},(_,i)=><i key={i} className={i<count?'complete':''}/>)}</div></div>
 <small>{benefit}</small></>}
 </div><footer>{error&&<p className="place-error" role="alert">{error}</p>}<button className="place-primary" disabled={busy} onClick={()=>{onClose();onShare();}}>Share my postcard<Icon name="arrow" size={21}/></button>{onAddAll&&eligible&&!canPlay&&<button type="button" className="friend-unlock-add-all" disabled={busy} aria-busy={busy} onClick={()=>void addAll()}>{busy?'Unlocking…':'Add all'}</button>}</footer></dialog>;
}
