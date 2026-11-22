import {publicCdnImage,type AvatarId} from '@rymzi/core';
import {BOTTLE_DISCOVERY_STEPS,useBottleDiscoveryGuide} from '../../../packages/shared/useBottleDiscoveryGuide';
import {bottleDiscoverySeaSVG} from '../../../packages/shared/bottleDiscoveryArt';
import {BottleIcon,useBottleReducedMotion} from './PostcardBottle';
import {Icon} from './icons';
import './bottle-discovery-guide.css';
export function BottleDiscoveryGuide({avatar,photo}:{avatar:AvatarId;photo?:string}){
 const reduced=useBottleReducedMotion(),guide=useBottleDiscoveryGuide(reduced),peer=avatar==='sprout'?'cloud':'sprout';
 return <section className="bottle-how" aria-label="How bottles work" data-reduced={reduced}>
  <button type="button" className="bottle-how-replay" aria-label="Replay bottle guide" onClick={guide.replay}><Icon name="replay" size={14}/><span>Replay</span></button>
  <div key={guide.replayKey+':'+guide.step} className="bottle-how-scene" role="img" aria-label={guide.story.title}>
   {guide.step===0?<><span className="bottle-how-sea" aria-hidden="true" dangerouslySetInnerHTML={{__html:bottleDiscoverySeaSVG}}/><span className="bottle-how-drift"><BottleIcon/></span></>:guide.step===1?<div className="bottle-how-picks" aria-hidden="true">{[true,true,false].map((match,i)=><span key={i} className={match?'is-match':''} style={{animationDelay:`${i*160}ms`}}><small>{i+1}</small><Icon name={match?'check':'close'} size={24}/></span>)}</div>:<div className="bottle-how-pair" aria-hidden="true"><img src={photo??publicCdnImage('/avatars/'+avatar+'.webp')} style={{objectFit:photo?'cover':'contain'}} alt=""/><span><Icon name="link" size={22}/><strong>2/3</strong></span><img src={publicCdnImage('/avatars/'+peer+'.webp')} alt=""/></div>}
  </div>
  <div className="bottle-how-caption" aria-live="polite"><h2>{guide.story.title}</h2><p>{guide.story.copy}</p></div>
  <div className="bottle-how-steps" role="group" aria-label="Bottle guide steps">{BOTTLE_DISCOVERY_STEPS.map((step,i)=><button type="button" key={step.label} aria-label={`Bottle guide: ${step.label}`} aria-pressed={guide.step===i} onClick={()=>guide.select(i)}><i>{i+1}</i>{step.label}</button>)}</div>
 </section>;
}
