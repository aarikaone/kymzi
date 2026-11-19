import {JOURNEY_COPY,WELCOME_DESCRIPTION} from '@rymzi/core';

export function Welcome({onStart}:{onStart:()=>void}){
 return <div className="kymzi-onboarding">
  <div className="onboarding-portrait" aria-hidden="true">
   <img src="/avatars/cloud-glasses-v1.webp" alt="" width={1312} height={1199} draggable="false" fetchPriority="high"/>
  </div>
  <div className="onboarding-copy">
   <h1 tabIndex={-1}>{JOURNEY_COPY.title}<br/><em>{JOURNEY_COPY.titleAccent}</em></h1>
   <p>{WELCOME_DESCRIPTION}</p>
  </div>
  <button className="button onboarding-start" onClick={onStart}>Get started</button>
 </div>;
}
