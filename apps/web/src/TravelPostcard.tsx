import {profileDisplayName} from '@rymzi/core';
import {senderPostcardPicks,questionById,type FriendInvite,type PreviewState,openFriendPostcard,friendScore,publicCdnImage,type FriendReply,type AvatarId,type dayCardPicks} from '@rymzi/core';
import {useEffect,useState} from 'react';
import {webChallengeCrypto} from './launchCrypto';
import {AttractionImage} from './AttractionImage';
import {Icon} from './icons';
import './travel-postcard.css';
type Props={picks?:ReturnType<typeof dayCardPicks>;person:{name:string;username?:string;avatar:AvatarId};compact?:boolean};
export function TravelPostcard({picks=[],person,compact=false}:Props){
 const stops=picks.length===3?picks:[{id:'start',label:'Start slow',artworkId:'fr-3'},{id:'wander',label:'Get a little lost',artworkId:'jp-1'},{id:'stay',label:'Stay for sunset',artworkId:'br-3'}];
 return <article className={'travel-postcard'+(compact?' is-compact':'')} aria-label={'Travel postcard from '+profileDisplayName(person)}>
  <header><img src={publicCdnImage('/brand/kymzi-symbol.svg')} alt="Kymzi"/><span>A DAY AWAY</span><span className="postcard-stamp" aria-hidden="true"><Icon name="globe" size={24}/></span></header>
  <div className="postcard-landscape">{stops.map((p,i)=><div key={p.id}><AttractionImage showLoader id={p.artworkId}/><span><small>{['START','WANDER','UNWIND'][i]}</small><strong>{p.label}</strong></span></div>)}</div>
  <div className="postcard-route" aria-hidden="true"><i/><span/><i/><span/><Icon name="plane" size={18}/></div>
  <div className="postcard-letter"><div><small>{picks.length===3?'MY IDEAL TRAVEL DAY':'IMAGINE YOUR NEXT TRIP'}</small><h2>{picks.length===3?'This is my kind of trip.':'What’s your kind of trip?'}</h2></div><div className="postcard-signature"><img src={publicCdnImage('/avatars/'+person.avatar+'.webp')} alt=""/><span>From<strong>{profileDisplayName(person)}</strong></span><Icon name="stamp" size={27}/></div></div>
 </article>;
}
export function TravelMatchRule(){return <div className="travel-match-rule"><strong>50<span>%+</span></strong><span><b>Connect as Roamies</b><small>Match at least 2 of 3 travel picks.</small></span><Icon name="link" size={22}/></div>;}

export function TravelInviteIntro({person,onStart,destination,extra}:{extra?:React.ReactNode;person:Props['person'];onStart:()=>void;destination?:string}){return <div className="travel-invite-page"><div className="travel-invite-body"><header><h1>Same travel vibe?</h1><p>Same 3 questions. Match 2 to open.</p></header><div className="travel-postcard-enter"><SealedPostcard person={person} destination={destination}/></div>{extra}<div className="sealed-postcard-steps" aria-label="Answer three questions, match two, open the postcard"><span>Answer 3</span><Icon name="arrow" size={16}/><span>Match 2</span><Icon name="arrow" size={16}/><span>Become Roamies</span></div></div><footer className="travel-invite-footer"><button className="button" onClick={onStart}>Answer to open<Icon name="arrow"/></button></footer></div>;}

export function SealedPostcard({person,opening=false,compact=false,destination}:{person:Props['person'];opening?:boolean;compact?:boolean;destination?:string}){return <article className={'sealed-postcard'+(compact?' is-compact':'')} aria-label={'Sealed postcard'+(destination?' for '+destination:'')+' from '+profileDisplayName(person)}>
 <svg className="sealed-postcard-folds" viewBox="0 0 360 260" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H360L180 149Z" fill="#322A47"/><path d="M0 0 180 149 360 0M0 260l121-113m239 113L239 147" fill="none" stroke="#75618F" strokeWidth="1"/></svg>
 <div className="sealed-postcard-address"><span className={destination?'sealed-postcard-destination':undefined}>{destination?<><small>CITY POSTCARD</small><strong>{destination}</strong></>:'A DAY AWAY'}</span><span className="sealed-postcard-stamp"><Icon name="globe" size={25}/></span></div>
 <div className="sealed-postcard-seal" aria-hidden="true"><img src={publicCdnImage('/brand/kymzi-symbol.svg')} alt=""/><i><Icon name="lock" size={14}/></i></div>
 <div className="sealed-postcard-sender"><img src={publicCdnImage('/avatars/'+person.avatar+'.webp')} alt=""/><span>From<strong>{profileDisplayName(person)}</strong></span><small>{opening?'Opening…':'2 matches to open'}</small></div>
 </article>;}
export function OpenedTravelPostcard({reply}:{reply:FriendReply}){
 const [picks,setPicks]=useState<ReturnType<typeof dayCardPicks>|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),connected=friendScore(reply).connects;
 useEffect(()=>{let alive=true;setPicks(null);setError('');if(connected)void openFriendPostcard(reply,webChallengeCrypto).then(value=>{if(alive)setPicks(value);},e=>{if(alive)setError((e as Error).message);});return()=>{alive=false;};},[reply,connected,attempt]);
 if(!connected)return <SealedPostcard person={reply.invite.person}/>;
 if(!picks)return <div className="postcard-opening"><SealedPostcard person={reply.invite.person} opening={!error}/>{error?<><p role="alert">{error}</p><button className="text-button" onClick={()=>setAttempt(n=>n+1)}>Try opening again</button></>:<p role="status">Opening your postcard…</p>}</div>;
 return <div className="postcard-opened" role="region" aria-label={'Opened postcard from '+profileDisplayName(reply.invite.person)}><span className="postcard-opened-note"><Icon name="check" size={15}/>Postcard opened</span><TravelPostcard compact person={reply.invite.person} picks={picks}/></div>;
}

export function SenderPostcardPreview({invite,state}:{invite:FriendInvite;state?:PreviewState}){
 const [picks,setPicks]=useState<ReturnType<typeof dayCardPicks>|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true;setPicks(null);setError('');if(!state){setPicks([]);return;}void senderPostcardPicks(state,invite,webChallengeCrypto).then(value=>{if(alive)setPicks(value);},()=>{if(alive)setError('Couldn’t load your picks.');});return()=>{alive=false;};},[invite,state,attempt]);
 return <div className="sender-postcard-preview"><SealedPostcard compact person={invite.person}/><section className="sender-postcard-picks" aria-label="Your postcard answers"><header><h2>Your picks</h2><span><Icon name="lock" size={12}/>Only you</span></header>{error?<div className="sender-picks-unavailable"><p role="alert">{error}</p><button className="text-button" onClick={()=>setAttempt(n=>n+1)}>Try again</button></div>:picks===null?<p className="sender-picks-unavailable" role="status">Loading your picks…</p>:picks.length===3?<ol>{picks.map((pick,i)=><li key={pick.id}><span className="sender-pick-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><small title={questionById(pick.id)?.prompt}>{questionById(pick.id)?.prompt??'Your pick'}</small><strong>{pick.label}</strong></div></li>)}</ol>:<p className="sender-picks-unavailable">Open on your device to see your picks.</p>}</section></div>;
}
