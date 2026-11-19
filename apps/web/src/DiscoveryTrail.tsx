import {JOURNEY_COPY} from '@rymzi/core';
import {Icon} from './icons';

export function DiscoveryTrail({privatePlay=false}:{privatePlay?:boolean}){
  return <div className="discovery-trail" role="group" aria-label={privatePlay?'Answer three questions, reveal a city, then explore its places':'Match three answers, see your unknown pal’s photos, then explore their city'}>
    {(privatePlay?JOURNEY_COPY.privateTrail:JOURNEY_COPY.trail).map((label,index)=><div className="discovery-trail-step" key={label}>
      <span className="discovery-trail-number" aria-hidden="true">{index===2?<Icon name="compass" size={14}/>:index+1}</span>
      <span>{label}</span>{index<2&&<Icon name="arrow" size={14} className="discovery-trail-arrow"/>}
    </div>)}
  </div>;
}
