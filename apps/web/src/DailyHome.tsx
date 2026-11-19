import {UnknownPalHero} from './UnknownPalHero';
import {DiscoveryTrail} from './DiscoveryTrail';
import {JOURNEY_COPY} from '@rymzi/core';
import {TravelHero} from './TravelHero';
import type {ReactNode} from 'react';
import {dailyStatus,countdownParts,nextPlayLabel,remainingDailyPlays,hasDailyProgress,type DailyGame,type AvatarId,type PassportState,type SocialState,type Profile} from '@rymzi/core';
import {Icon} from './icons';
type Props={game:DailyGame;passport:PassportState;social:SocialState;profile:Profile;blocked:string[];avatar:AvatarId;now:Date;canDiscover:boolean;onPlay:()=>void;onSchedule:()=>void;onShare:()=>void;onPassport:()=>void;community?:ReactNode;headerAction?:ReactNode};
export function PalIllustration({avatar='orbit',privatePlay=false}:{avatar?:AvatarId;privatePlay?:boolean}){return <div className="pal-illustration" aria-hidden="true"><span className="pal-art-route"/><div className="pal-art-person pal-art-you"><img src={`/avatars/${avatar}.webp`} alt=""/><span>You</span></div><span className="pal-art-earth"><Icon name="globe" size={42}/><Icon name="plane" size={23}/></span><div className="pal-art-person pal-art-them">{privatePlay?<Icon name="compass" size={71}/>:<img src={`/avatars/${avatar==='sprout'?'sunny':'sprout'}.webp`} alt=""/>}<span>{privatePlay?'New city':'New pal'}</span></div><span className="pal-art-star">✦</span></div>;}

export function DailyHome({game,now,canDiscover,onPlay,onSchedule,community,headerAction}:Props){
 const status=dailyStatus(game,now),waiting=status.kind==='waiting',left=remainingDailyPlays(game,now),resuming=hasDailyProgress(game),time=countdownParts(status.remainingMs),privatePlay=!canDiscover;
 return <div className="minimal-play-home">
  <div className="home-heading-with-updates"><h1 tabIndex={-1}>{waiting?<>{privatePlay?'More cities.':'More pals.'}<br/><em>Tomorrow.</em></>:resuming?<>{privatePlay?'Your city':'Your next pal'}<br/><em>is waiting.</em></>:privatePlay?<>Your next<br/><em>city.</em></>:<>{JOURNEY_COPY.title}<br/><em>{JOURNEY_COPY.titleAccent}</em></>}</h1>{headerAction}</div><DiscoveryTrail privatePlay={privatePlay}/>
  {waiting?<div className="minimal-play-countdown"><span>Back in</span><strong role="timer" aria-label="Next game countdown">{time.hours}:{time.minutes}:{time.seconds}</strong><small>{nextPlayLabel(game,now)}</small></div>:<div className="minimal-play-mascot" aria-hidden="true">{privatePlay?<TravelHero/>:<UnknownPalHero/>}</div>}
  {community&&<div className="home-community">{community}</div>}
  <div className="minimal-play-actions">
   <p className="minimal-play-counter">{left} {left===1?'play':'plays'} left today</p>
   {waiting?<button className="text-button" onClick={onSchedule}>Change daily time<Icon name="clock" size={18}/></button>:<button className="button" onClick={onPlay}>{resuming?JOURNEY_COPY.resume:privatePlay?JOURNEY_COPY.privateStart:JOURNEY_COPY.start}<Icon name="arrow"/></button>}
  </div>
 </div>;
}
