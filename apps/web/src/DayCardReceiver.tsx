import {ConnectionAvatar} from './ConnectionAvatar';
import {FriendInvitationReceiver} from './FriendInvitation';
import {profileDisplayName} from '@rymzi/core';
import {PostcardDestination} from './PostcardHub';
import {placePostcardForInvite,travelCityById,type TravelCityId} from '@rymzi/core';
import {useCityPlaces} from './useCityPlaces';
import {FriendUnlockSheet} from './FriendUnlockSheet';
import {OpenedTravelPostcard,SealedPostcard,TravelInviteIntro} from './TravelPostcard';
import {publicCdnImage} from '@rymzi/core';
import {useEffect,useRef,useState} from 'react';
import {answerFriendInvite,friendScore,inviteQuestions,palFindingProgress,invitedFriends,receiverPreviewProfile,receiverPreviewReply,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import {PerfectDayPlay} from './PerfectDay';
import {webChallengeCrypto} from './launchCrypto';
import {Icon} from './icons';
import './day-card-receiver.css';

export function DayCardReceiver(props:Parameters<typeof MatchingDayCardReceiver>[0]){if(props.invite.kind==='friend')return <FriendInvitationReceiver invite={props.invite} state={props.state} profile={receiverPreviewProfile(props.state,props.invite)} preview onJoin={props.onComplete} onDone={props.onReturn}/>;return <MatchingDayCardReceiver {...props}/>;}
function MatchingDayCardReceiver({state,invite,onComplete,onReturn}:{state:PreviewState;invite:FriendInvite;onComplete:(reply:FriendReply)=>void|Promise<void>;onReturn:()=>void}) {
 const placed=placePostcardForInvite(state,invite.id),destinationCity=travelCityById(placed?.cityId)?.city,guide=useCityPlaces(placed?.cityId??null),placeLabel=placed?(guide.places.find(p=>p.id===placed.placeId)?.name??travelCityById(placed.cityId)?.city):undefined;
 const [guest]=useState(()=>receiverPreviewProfile(state,invite)),[reply,setReply]=useState(()=>receiverPreviewReply(state,invite));
 const [origin,setOrigin]=useState<TravelCityId|undefined>(()=>receiverPreviewReply(state,invite)?.playCityId),[choosingOrigin,setChoosingOrigin]=useState(false);
 const [started,setStarted]=useState(false),[answers,setAnswers]=useState(['','','']),[index,setIndex]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<FriendReply|undefined>(undefined),lock=useRef(false),alive=useRef(true),questions=inviteQuestions(invite);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function next(){
  if(lock.current||!answers[index])return;
  if(index<2){setIndex(i=>i+1);return;}
  lock.current=true;setBusy(true);setError('');
  try{
   const result=pending.current??await answerFriendInvite(invite,guest,answers,webChallengeCrypto,undefined,origin);
   pending.current=result;
   if(!alive.current)return;
   await onComplete(result);
   if(alive.current)setReply(result);
  }catch(e){if(alive.current)setError((e as Error).message);}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 if(choosingOrigin)return <div className="receiver-origin-page"><button className="receiver-origin-back" onClick={()=>setChoosingOrigin(false)}><Icon name="back" size={20}/>Back to postcard</button><PostcardDestination purpose="play" onCity={id=>{setOrigin(id);setChoosingOrigin(false);}} onPlace={()=>{}}/></div>;
 const originChoice=<button className="receiver-origin-choice" onClick={()=>setChoosingOrigin(true)}><Icon name="pin" size={16}/><span>{origin?`Playing from ${travelCityById(origin)?.city}`:'Playing from…'}<small>{origin?'Change city':'City only · optional'}</small></span><Icon name="arrow" size={16}/></button>;
 if(!reply&&!started)return placed?<div className="place-postcard-receiver-intro"><p>{placeLabel} · {travelCityById(placed.cityId)?.city}</p><TravelInviteIntro extra={originChoice} person={invite.person} destination={destinationCity} onStart={()=>setStarted(true)}/></div>:<TravelInviteIntro extra={originChoice} person={invite.person} destination={destinationCity} onStart={()=>setStarted(true)}/>;
 if(!reply)return <PerfectDayPlay questions={questions} index={index} answer={answers[index]} answers={Object.fromEntries(questions.map((q,i)=>[q.id,answers[i]]))} onSelect={value=>{if(!lock.current){pending.current=undefined;setAnswers(v=>v.map((a,i)=>i===index?value:a));}}} onNext={()=>void next()} busy={busy} finalLabel="Reveal our match" header={<><div className="receiver-travel-context"><b>{placeLabel??'Your travel day'}</b><span>With {profileDisplayName(invite.person)}</span></div>{error&&<p role="alert" className="place-error">{error}</p>}</>}/>;
 const score=friendScore(reply),progress=palFindingProgress(state),opened=score.connects&&progress.unlocked&&!placed;
 function retry(){pending.current=undefined;setReply(undefined);setAnswers(['','','']);setIndex(0);setError('');setStarted(true);}
 return <div className="receiver-connected"><div className="receiver-connected-body"><div className="receiver-pair" aria-label={score.connects?'You and your new Roamie':'Your travel comparison'}><img src={publicCdnImage('/avatars/'+invite.person.avatar+'.webp')} alt={'Sender '+profileDisplayName(invite.person)}/><span><Icon name={score.connects?'link':'compass'} size={23}/></span><img src={publicCdnImage('/avatars/'+reply.person.avatar+'.webp')} alt={'Receiver '+profileDisplayName(reply.person)}/></div><div className="receiver-match-percent" aria-label={score.percentage+' percent travel match'}>{score.percentage}<small>% travel match</small></div><h1>{opened?'Worldwide matching unlocked.':score.connects?'You’re connected.':'Different travel vibes.'}</h1><p>{opened?'Five friends. Worldwide matching is on.':score.connects?'Postcard opened. Meet your new Roamie.':'Still sealed. Match 2 of 3 to open it.'}</p><span className="receiver-score">{score.shared}/3 shared picks</span>{score.connects&&!placed&&<span className="receiver-score">{progress.count} added · {progress.remaining} left</span>}{score.connects?<OpenedTravelPostcard reply={reply}/>:<SealedPostcard person={invite.person}/>}</div><footer className="receiver-try-again">{!score.connects&&<button className="place-primary" onClick={retry}>Try another day<Icon name="arrow"/></button>}<button className={score.connects?'place-primary':'text-button'} onClick={onReturn}>{placed?'Back to postcard':opened?'Find a Roamie':'Back to my profile'}{score.connects&&<Icon name="arrow"/>}</button></footer></div>;
}

export function ReceiverCircle({state,onOpen,onRoamie,onInvite,onAddAll,onFindRoamie}:{onRoamie?:(id:string)=>void;state:PreviewState;onOpen:()=>void;onFindRoamie?:()=>void;onInvite?:()=>void;onFeed?:()=>void;onAddAll?:()=>void|Promise<void>}){
 const [unlockOpen,setUnlockOpen]=useState(false),{count}=palFindingProgress(state),friends=invitedFriends(state);if(!friends.length)return null;
 return <section className="friend-home-rail" aria-label="Connected friends and Roamies"><div className="pal-story-rail connection-rail"><button className="rail-unlock" aria-label="Find Roamies worldwide" onClick={onFindRoamie??(()=>setUnlockOpen(true))}><span><Icon name="plus" size={27}/></span><strong>Find Roamie</strong><small>{count}/5 friends</small></button>{friends.map(reply=><button key={reply.person.name} aria-label={'View friend '+(reply.person.username??reply.person.name)} onClick={()=>onRoamie?onRoamie('circle:'+reply.person.name):onOpen()}><ConnectionAvatar avatar={reply.person.avatar} kind="friend"/><strong>{profileDisplayName(reply.person)}</strong><small className="connection-kind is-friend">Friend</small></button>)}</div><FriendUnlockSheet visible={unlockOpen} state={state} onClose={()=>setUnlockOpen(false)} onShare={onInvite??onOpen} onAddAll={onAddAll}/></section>;
}
