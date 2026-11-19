import { useEffect, useRef, useState } from 'react';
import { activityAge, demoActivityUpdate } from '@rymzi/core';
export function ActivityStrip({now}:{now:Date}){
  const [event,setEvent]=useState(()=>demoActivityUpdate(now)),sequence=useRef(0);
  useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden)setEvent(demoActivityUpdate(new Date(),++sequence.current));},5500);return()=>clearInterval(timer);},[]);
  return <section className="activity-strip" aria-label="Demo match activity">
    <div className="activity-strip-heading"><span><i/>The Kymzi pulse</span></div>
    <div className="activity-strip-update"><strong><span className="activity-strip-spark">{event.partial?'✧':'✦'}</span>{event.title}</strong><time dateTime={event.occurredAt}>{activityAge(event.occurredAt,now)}</time></div>
    <div className="activity-strip-countries">{event.countries.map(country=><span key={country.name}>{country.flag} {country.name}</span>)}</div>
  </section>;
}
