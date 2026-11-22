import {publicCdnImage} from '@rymzi/core';
import {useId,useState,type CSSProperties} from 'react';
import {CITIES,CITY_SETS,COVERS,cityById,passportStamps,passportStats,setProgress,coverUnlocked,latestJourney,journeyIsNew,weeklyCrew,type City,type CityId,type CoverId,type PassportState,type Profile} from '@rymzi/core';
import {Icon} from './icons';

export function CityArt({city,className=''}:{city:City;className?:string}){return city.artId?<img className={`city-art ${className}`} src={publicCdnImage(`/cities/${city.artId}.webp`)} alt="" draggable="false"/>:<span className={`city-art country-art-fallback ${className}`} aria-hidden="true"><span>{city.flag}</span><i>✦</i><b>✧</b></span>;}

export function WorldMap({passport,onCity,mini=false}:{passport:PassportState;onCity?:(id:CityId)=>void;mini?:boolean}){
 const uid=useId(),owned=new Set(passportStamps(passport).map(s=>s.city.id));
 return <div className={`world-map ${mini?'world-mini':''}`}>
  <svg viewBox="0 0 360 220" fill="none" aria-hidden="true">
   <defs><radialGradient id={uid}><stop stopColor="#D5F88F" stopOpacity=".25"/><stop offset="1" stopColor="#779E6E" stopOpacity=".04"/></radialGradient><clipPath id={`${uid}clip`}><ellipse cx="180" cy="110" rx="169" ry="101"/></clipPath></defs>
   <ellipse cx="180" cy="110" rx="169" ry="101" fill={`url(#${uid})`} stroke="currentColor" strokeOpacity=".2"/>
   <g stroke="currentColor" strokeOpacity=".1"><ellipse cx="180" cy="110" rx="112" ry="101"/><ellipse cx="180" cy="110" rx="48" ry="101"/><ellipse cx="180" cy="110" rx="169" ry="46"/><path d="M12 110h336M180 9v202"/></g>
   <g clipPath={`url(#${uid}clip)`} fill="currentColor" fillOpacity=".15">
    <path d="m40 47 27-17 42 8 23 22-11 18-18 5-6 23-19 3-7-18-20-9-17-17Z"/><path d="m110 110 22 5 18 24-5 36-21 23-7-29-14-25Z"/>
    <path d="m169 48 18-7 18 9 4 19-18 8-25-10Z"/><path d="m181 86 30-8 24 21-9 31-19 25-15-20-6-22-12-12Z"/>
    <path d="m205 44 45-16 56 16 30 31-10 26-26 4-13 30-23-8-17-24-23-4-15-18-19-8Z"/><path d="m284 150 29-8 23 14-6 23-30 3-18-17Z"/>
    <path d="m125 20 20-9 15 8-4 22-18 6Z"/>
   </g>
   <g stroke="#D5F88F" strokeWidth="1.2" strokeDasharray="3 6" opacity=".55">{passportStamps(passport).slice(0,5).map(s=><path key={s.city.id} d={`M180 112 Q${(s.city.x+180)/2} ${Math.min(38,s.city.y/2)} ${s.city.x} ${s.city.y}`}/>)}</g>
   <path d="m59 170 7-8m-3-1 5 2-2 5M310 33v8m-4-4h8M41 112v6m-3-3h6" stroke="currentColor" strokeOpacity=".45" strokeLinecap="round"/>
  </svg>
  {CITIES.map(city=>onCity?<button key={city.id} className={`map-pin ${owned.has(city.id)?'pin-owned':''}`} style={{left:`${city.x/3.6}%`,top:`${city.y/2.2}%`}} aria-label={`Explore ${city.name}${owned.has(city.id)?', collected':''}`} onClick={()=>onCity(city.id)}><i/><span>{city.code}</span></button>:<span key={city.id} className={`map-dot ${owned.has(city.id)?'dot-owned':''}`} style={{left:`${city.x/3.6}%`,top:`${city.y/2.2}%`}}/>) }
 </div>;
}

export function Stamp({city,passport,onClick,large=false}:{city:City;passport:PassportState;onClick?:()=>void;large?:boolean}){
 const stamp=passportStamps(passport).find(s=>s.city.id===city.id),style={'--stamp-paper':city.color,'--stamp-ink':city.ink} as CSSProperties;
 const content=<><div className="stamp-top"><span>{city.code}</span>{stamp?.perfect?<span className="perfect-seal" aria-label="Perfect match">✦ 3/3{stamp.visits>1&&<small> · ×{stamp.visits}</small>}</span>:stamp?<span>×{stamp.visits}</span>:<Icon name="lock" size={13}/>}</div><CityArt city={city}/><div className="stamp-bottom"><strong>{city.name}</strong><span>{city.flag}</span></div>{stamp&&<span className="stamp-marks" aria-label={`${stamp.visits} visits`}>{Array.from({length:Math.min(3,stamp.visits)},(_,i)=><i key={i} className="mark-filled">{city.motif}</i>)}</span>}{stamp&&<span className="stamp-postmark" aria-hidden="true">{city.motif}</span>}</>;
 return onClick?<button aria-label={`${stamp?'View':'Explore'} ${city.name} stamp`} className={`city-stamp ${stamp?'stamp-owned':'stamp-locked'} ${large?'stamp-large':''}`} style={style} onClick={onClick}>{content}</button>:<div className={`city-stamp stamp-owned ${large?'stamp-large':''}`} style={style}>{content}</div>;
}

export function PassportView({passport,onCity,onAtlas,onCover,onLocked}:{passport:PassportState;onCity:(id:CityId)=>void;onAtlas:()=>void;onCover:(id:CoverId)=>void;onLocked:(message:string)=>void}){
 const stats=passportStats(passport);
 return <div className={`passport-page passport-cover-${passport.cover}`}>
  <div className="passport-heading"><div><h1 className="page-heading" tabIndex={-1}>Small <em>world.</em></h1><div className="passport-counts"><span><b>{stats.cities}</b> cities</span><span><b>{stats.countries}</b> countries</span></div></div><button className="atlas-button" aria-label="Open atlas" onClick={onAtlas}><Icon name="globe" size={24}/><span>Atlas</span></button></div>
  <div className="passport-stamp-grid" aria-label="City stamp collection">{CITIES.map(city=><Stamp key={city.id} city={city} passport={passport} onClick={()=>onCity(city.id)}/>)}</div>
  <div className="passport-sets">{CITY_SETS.map(set=>{const progress=setProgress(passport,set.id);return <div key={set.id} className={progress.complete?'set-complete':''} aria-label={`${set.name}: ${progress.count} of ${progress.total}`}><span className="set-symbol">{set.symbol}</span><div><strong>{set.name}</strong><span className="set-dots">{set.cities.map(id=><span key={id} title={cityById(id)?.name} aria-label={`${cityById(id)?.name}: ${passport.journeys.some(j=>j.cityId===id)?'collected':'uncollected'}`} className={passport.journeys.some(j=>j.cityId===id)?'set-city-owned':''}>{cityById(id)?.flag}</span>)}</span></div><span>{progress.complete?'✓':`${progress.count}/3`}</span></div>;})}</div>
  <div className="passport-personalize"><div className="ink-balance"><Icon name="ink" size={19}/><strong>{stats.ink}</strong><span>ink</span></div><div className="cover-swatches" aria-label="Passport covers">{COVERS.map(cover=>{const unlocked=coverUnlocked(passport,cover.id);return <button key={cover.id} aria-label={`Choose ${cover.name} cover${unlocked?'':`, requires ${cover.requirement}`}`} aria-pressed={passport.cover===cover.id} className={passport.cover===cover.id?'cover-selected':''} style={{'--cover-color':cover.color} as CSSProperties} onClick={()=>unlocked?onCover(cover.id):onLocked(cover.requirement)}>{unlocked?passport.cover===cover.id?<Icon name="check" size={15}/>:null:<Icon name="lock" size={12}/>}</button>;})}</div></div>
 </div>;
}

export function AtlasView({passport,onCity}:{passport:PassportState;onCity:(id:CityId)=>void}){
 const stats=passportStats(passport);
 return <div className="atlas-page"><h1 className="page-heading" tabIndex={-1}>Thoughts, <em>worldwide.</em></h1><WorldMap passport={passport} onCity={onCity}/><div className="atlas-stats"><span><b>{stats.cities}</b>cities</span><i/><span><b>{stats.countries}</b>countries</span><i/><span><b>{stats.continents}</b>continents</span></div><div className="atlas-city-list">{CITIES.map(city=><button key={city.id} onClick={()=>onCity(city.id)} className={passport.journeys.some(j=>j.cityId===city.id)?'atlas-city-owned':''}><span>{city.flag}</span>{city.name}<Icon name={passport.journeys.some(j=>j.cityId===city.id)?'check':'lock'} size={14}/></button>)}</div><span className="small center">Illustrated destinations</span></div>;
}

export function CityView({id,passport,onPlay,onShare}:{id:string;passport:PassportState;onPlay:()=>void;onShare:()=>void}){
 const city=cityById(id),[flipped,setFlipped]=useState(false);if(!city)return <h1 className="page-heading">City unavailable.</h1>;
 const stamp=passportStamps(passport).find(s=>s.city.id===city.id);
 return <div className="city-detail"><div className="city-detail-title"><h1 className="page-heading" tabIndex={-1}><em>{city.name}.</em></h1><span>{city.flag} {city.country}</span></div><div className={`city-postcard ${flipped?'postcard-flipped':''}`}><div className="postcard-corners"/>{flipped?<div className="postcard-back"><span className="postcard-hand">A little connection.</span><Icon name="plane" size={32}/><strong>{stamp?`${stamp.visits} ${stamp.visits===1?'visit':'visits'}`:'Waiting for your thoughts.'}</strong><span>{stamp?.perfect?'✦ Perfect Kymzi':stamp?'Shared thoughts, different worlds.':'Collect through play.'}</span><span className="small">Fictional destination</span></div>:<Stamp city={city} passport={passport} large/>}<button className="postcard-flip" aria-label="Flip stamp" aria-pressed={flipped} onClick={()=>setFlipped(v=>!v)}><Icon name="flip" size={22}/></button></div><div className="city-detail-status">{stamp?<><Icon name="stamp" size={20}/>{stamp.perfect?'Perfect match stamp':'In your passport'}</>:<><Icon name="lock" size={18}/>Uncollected</>}</div><div className="footer-actions"><button className="button" onClick={onPlay}>Find your Kymzi<Icon name="plane"/></button>{stamp&&<button className="text-button" onClick={onShare}><Icon name="share" size={19}/>Share my passport</button>}</div></div>;
}

export function CityReveal({passport,privatePlay,onPassport,onMatches}:{passport:PassportState;privatePlay:boolean;onPassport:()=>void;onMatches:()=>void}){
 const journey=latestJourney(passport),city=cityById(journey?.cityId),stats=passportStats(passport),isNew=journey?journeyIsNew(passport,journey):false;
 return <div className={`city-reveal ${city?'reveal-has-city':'reveal-ink'}`}>
  <div className="reveal-topline"><span>{privatePlay?'Private trip':'Your thought landed'}</span></div>
  {city?<><div className={`reveal-art ${journey?.shared===3?'reveal-perfect':''}`}><span className="reveal-orbit"/><span className="reveal-confetti confetti-one">✦</span><span className="reveal-confetti confetti-two">✳</span><span className="reveal-confetti confetti-three">✧</span><Stamp city={city} passport={passport} large/><span className="arrival-mark"><Icon name="check" size={22}/></span></div><div className="reveal-caption"><h1 className="page-heading" tabIndex={-1}><em>{city.name}</em>{isNew?' unlocked.':' again.'}</h1><span>{city.flag} {city.country}</span><div className="reveal-match-score" aria-label={privatePlay?'Virtual destination':`${journey?.shared??0} of 3 answers matched`}>{privatePlay?<Icon name="shield" size={16}/>:<>{[0,1,2].map(i=><i key={i} className={i<(journey?.shared??0)?'shared':''}/>)}<strong>{journey?.shared}/3</strong></>}</div></div></>:<><div className="ink-reveal-art"><svg viewBox="0 0 150 180" aria-hidden="true"><path d="M75 7C61 39 18 74 18 112a57 57 0 0 0 114 0C132 74 89 39 75 7Z" fill="#D0DEC3"/><path d="M40 109c0 19 10 32 28 35" stroke="#F1F5EB" strokeWidth="9" strokeLinecap="round"/></svg><strong>+1</strong><span>✦</span></div><div className="reveal-caption"><h1 className="page-heading" tabIndex={-1}>Fresh <em>ink.</em></h1><span>No shared answers this time.</span><small>{stats.ink<3?`${stats.ink}/3 · Lilac skies`:'Your next city is out there.'}</small></div></>}
  <div className="reveal-footer"><button className="button" onClick={onPassport}>Open passport<Icon name="stamp"/></button><button className="text-button" onClick={onMatches}>Show my Kymzis<Icon name="arrow" size={18}/></button></div>
 </div>;
}

export function CrewView({passport,profile,now}:{passport:PassportState;profile:Profile;now:Date}){
 const rows=weeklyCrew(passport,profile,now),stats=passportStats(passport);
 if(profile.ageBand==='10-12')return <div className="solo-crew"><h1 className="page-heading" tabIndex={-1}>Your own <em>orbit.</em></h1><WorldMap passport={passport}/><div className="solo-score"><Icon name="stamp" size={30}/><strong>{stats.cities}</strong><span>cities explored</span></div><p className="small">Private play · no public rankings</p></div>;
 const top=rows.slice(0,3),podium=[top[1],top[0],top[2]];
 return <div className="crew-page"><div className="crew-heading"><h1 className="page-heading" tabIndex={-1}>World <em>crew.</em></h1><span className="crew-week">This week <i/> Demo</span></div><div className="crew-podium">{podium.map((person,i)=>person&&<div key={person.id} className={`podium-person podium-${i} ${person.you?'podium-you':''}`}><div className="podium-avatar">{i===1&&<Icon name="crown" size={26}/>}<img src={publicCdnImage(`/avatars/${person.avatar}.webp`)} alt=""/><b>{person.rank}</b></div><strong>{person.name}</strong><span><Icon name="stamp" size={13}/>{person.cities}</span></div>)}</div><div className="crew-list" role="list" aria-label="Weekly demo leaderboard">{rows.map(person=><div key={person.id} role="listitem" className={`crew-row ${person.you?'crew-you':''}`}><span className="crew-rank">{person.rank}</span><img src={publicCdnImage(`/avatars/${person.avatar}.webp`)} alt=""/><strong>{person.name}</strong><span>{person.cities}<Icon name="stamp" size={17}/></span></div>)}</div><p className="crew-footnote">Unique cities · same 5-play limit</p></div>;
}

export function PassportWelcome(){const empty:PassportState={version:1,journeys:[],cover:'midnight'};return <div className="passport-welcome-art" aria-hidden="true"><WorldMap passport={empty}/><div className="welcome-stamp welcome-stamp-one"><Stamp city={CITIES[0]} passport={empty}/></div><div className="welcome-stamp welcome-stamp-two"><Stamp city={CITIES[1]} passport={empty}/></div><span className="welcome-plane"><Icon name="plane" size={30}/></span></div>;}
