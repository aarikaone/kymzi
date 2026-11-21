import {publicCdnImage} from '@rymzi/core';
import {PalVisitCard} from './PalVisitCard';
import {PalRail} from './ExploreExperience';
import {palForMoment,dailyStatus,countdownParts} from '@rymzi/core';
import {JOURNEY_COPY} from '@rymzi/core';
import {useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent} from 'react';
import {
  attractionById,countryById,galleryPhotoFeed,isCityPhotoSaved,isAdult,photoMonthProgress,
  publicCityPals,worldPlaces,type CityPhotoItem,type CountryId,type PreviewState,
} from '@rymzi/core';
import {Icon} from './icons';
import {AttractionImage} from './AttractionImage';

type GalleryProps={
  state:PreviewState;now:Date;countryId?:CountryId;initialPhotoId?:string;ownOnly?:boolean;explore?:boolean;onPal?:(id:string)=>void;onPlan:(id:CountryId)=>void;onCities:()=>void;
  onCapture:(id?:CountryId)=>void;onCity:(id:CountryId)=>void;
  onVisits:()=>void;onPlay:()=>void;onRemove:(id:string)=>void;
  onHide:(id:string)=>void;onSave:(id:string)=>void;onSeen:(id:string)=>void;
};

function MomentImage({photo,thumbnail=false}:{photo:CityPhotoItem;thumbnail?:boolean}){
  const city=countryById(photo.countryId)!;
  return photo.image
    ? <img src={photo.image} alt={`City scene in ${city.city}`} loading={thumbnail?'lazy':'eager'} decoding="async" draggable={false}/>
    : <AttractionImage id={photo.artworkId!}/>;
}

function MomentFeed({state,items,mode,setMode,onCity,onSave,onSeen,onRemove,onHide,onCapture,onPlay,initialPhotoId,ownOnly=false,onPlan,onPal,explore=false}:GalleryProps&{
  items:CityPhotoItem[];mode:'feed'|'grid';setMode:(mode:'feed'|'grid')=>void;
}){
  const [index,setIndex]=useState(()=>Math.max(0,items.findIndex(p=>p.id===initialPhotoId))),[flash,setFlash]=useState('');
  const viewport=useRef<HTMLDivElement>(null),pendingPhoto=useRef<number|null>(null),seen=useRef(state.photos.seenIds),seenAction=useRef(onSeen);
  seen.current=state.photos.seenIds;seenAction.current=onSeen;
  const current=index<items.length?items[index]:undefined;
  const signature=items.map(p=>p.id).join(',');
  const privateOnly=state.profile?.ageBand==='10-12';

  useEffect(()=>{
    if(!explore&&mode==='feed'&&current&&!state.photos.seenIds.includes(current.id))onSeen(current.id);
  },[current?.id,mode]);
  useEffect(()=>{
    if(!flash)return;
    const timer=setTimeout(()=>setFlash(''),650);
    return()=>clearTimeout(timer);
  },[flash]);
  useLayoutEffect(()=>{
    if(mode!=='feed')return;
    if(explore){if(pendingPhoto.current!==null){viewport.current?.querySelectorAll<HTMLElement>('.moment-slide')[pendingPhoto.current]?.scrollIntoView?.({block:'start',behavior:'auto'});pendingPhoto.current=null;}return;}
    const at=Math.min(index,items.length);
    setIndex(at);
    viewport.current?.scrollTo({top:at*(viewport.current.clientHeight||1),behavior:'auto'});
  },[mode,signature,explore]);
  useEffect(()=>{
    if(!explore||mode!=='feed'||!viewport.current||typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||entry.intersectionRatio<.4)continue;const at=Number((entry.target as HTMLElement).dataset.momentIndex),photo=items[at];if(!photo)continue;setIndex(at);if(!seen.current.includes(photo.id)){seen.current=[...seen.current,photo.id];seenAction.current(photo.id);}}},{root:viewport.current.closest('.app-main'),threshold:.4});
    viewport.current.querySelectorAll('.moment-slide').forEach(card=>observer.observe(card));return()=>observer.disconnect();
  },[explore,mode,signature]);

  function move(at:number){
    const target=Math.min(items.length,Math.max(0,at));
    setIndex(target);
    if(explore){viewport.current?.querySelectorAll<HTMLElement>('.moment-slide')[target]?.scrollIntoView?.({block:'start',behavior:'smooth'});return;}
    viewport.current?.scrollTo({
      top:target*(viewport.current.clientHeight||1),
      behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
    });
  }
  function keys(event:KeyboardEvent<HTMLDivElement>){
    if(explore||(event.target as HTMLElement).closest('button,a,input'))return;
    if(['ArrowDown','PageDown','ArrowUp','PageUp','Home','End'].includes(event.key)){
      event.preventDefault();
      move(event.key==='Home'?0:event.key==='End'?items.length:event.key==='ArrowUp'||event.key==='PageUp'?index-1:index+1);
    }
  }
  function save(photo:CityPhotoItem,onlyAdd=false){
    const saved=isCityPhotoSaved(state,photo);
    if(!onlyAdd||!saved)onSave(photo.id);
    if(!saved||onlyAdd)setFlash(photo.id);
  }

  if(!items.length)return <div className="gallery-empty"><Icon name="camera" size={62}/><h2>{privateOnly||ownOnly?'Your next moment.':'Your first roamie is out there.'}</h2><p>{privateOnly||ownOnly?'Your city, through your lens.':'Match 3 answers. See their world.'}</p><button className="button" onClick={privateOnly||ownOnly?()=>onCapture():onPlay}>{privateOnly||ownOnly?'Shoot your city':JOURNEY_COPY.start}<Icon name={privateOnly||ownOnly?'camera':'arrow'}/></button></div>;

  if(mode==='grid')return <div className="moment-grid-scroll" role="region" aria-label="City photo gallery"><div className="moment-masonry">
    {items.map((photo,i)=>{
      const city=countryById(photo.countryId)!;
      return <article key={photo.id} className="masonry-moment"><button className="masonry-open" aria-label={`Open photo ${i+1} in ${city.city}`} onClick={()=>{pendingPhoto.current=i;setIndex(i);setMode('feed');}}>
        <MomentImage photo={photo} thumbnail/>
        <span className="masonry-caption"><strong>{city.city}</strong><small>{photo.you?'Your lens':photo.alias}</small></span>
        </button><button className={`photo-favorite ${isCityPhotoSaved(state,photo)?'is-favorite':''}`} aria-label={isCityPhotoSaved(state,photo)?'Remove from favorites':'Favorite photo'} aria-pressed={isCityPhotoSaved(state,photo)} onClick={()=>save(photo)}><Icon name="heart" size={21}/></button>
      </article>;
    })}
  </div></div>;

  return <div className="moment-feed-shell">
    <div className={`moment-snap-feed ${explore?'page-moments':''}`} ref={viewport} role="region" aria-label="City photo feed" tabIndex={0} onKeyDown={keys} onScroll={e=>{
      if(explore)return;
      const height=e.currentTarget.clientHeight;
      if(height)setIndex(Math.max(0,Math.min(items.length,Math.round(e.currentTarget.scrollTop/height))));
    }}>
      {items.map((photo,i)=>{
        const city=countryById(photo.countryId)!,saved=isCityPhotoSaved(state,photo),active=explore||i===index,owner=palForMoment(state,photo);
        return <article key={photo.id} className="moment-slide" data-moment-index={i} aria-label={`${photo.you?'Your photo':photo.alias+' city moment'} in ${city.city}`} aria-hidden={!active} inert={!active}>
          <div className="moment-cover" onDoubleClick={()=>save(photo,true)}>
            {(explore||Math.abs(i-index)<=1)&&<MomentImage photo={photo} thumbnail={explore}/>}
          </div>
          {active&&<>
            <div className="moment-shade"/>
            <span className="moment-postcard-edge" aria-hidden="true"/><div className="moment-topline"><button className="moment-author" aria-label={owner?`Open ${owner.alias} in ${owner.city}`:'Your photo'} onClick={()=>owner&&onPal?.(owner.id)} disabled={!owner||!onPal}><span className="moment-author-symbol">{photo.you?<Icon name="camera" size={15}/>:owner?<img src={publicCdnImage(`/avatars/${owner.imageAvatar}.webp`)} alt=""/>:<Icon name="people" size={15}/>}</span><span className="moment-author-copy"><strong>{photo.alias}</strong><small>{photo.source==='demo'?'Illustrated preview':privateOnly?'Only you':'Camera shot'}</small></span></button><button className="moment-round" aria-label={photo.you?'Delete my photo':'Hide this photo'} onClick={()=>photo.you?onRemove(photo.id):onHide(photo.id)}><Icon name={photo.you?'trash':'close'} size={20}/></button></div>
            <div className="moment-story"><span className="moment-country">{city.flag} {city.name}</span><h2 aria-label={`${city.city}.`}>{city.city}<i>.</i></h2><p>{photo.artworkId?attractionById(photo.artworkId)?.name:'Through your lens.'}</p>{worldPlaces(state).some(p=>p.country.id===photo.countryId&&p.uncovered)&&<button className="moment-city-link" onClick={()=>explore&&owner&&onPal?onPal(owner.id):onCity(photo.countryId)}>{explore&&owner?'View roamie & city':photo.you?'Explore city':'Explore their city'}<Icon name="arrow" size={17}/></button>}</div>
            <div className="moment-actions"><button className={`moment-round moment-save ${saved?'is-saved':''}`} aria-label={saved?'Remove from favorites':'Favorite photo'} aria-pressed={saved} onClick={()=>save(photo)}><Icon name="heart" size={25}/><span>{saved?'Faved':'Fav'}</span></button>{isAdult(state.profile!.ageBand)&&!photo.you?<button className="moment-round" aria-label={`Plan visit to ${city.city}`} onClick={()=>onPlan(photo.countryId)}><Icon name="calendar" size={24}/><span>Visit</span></button>:<button className="moment-round" aria-label="Take a city photo" onClick={()=>onCapture(photo.countryId)}><Icon name="camera" size={24}/></button>}</div>
            {flash===photo.id&&<div className="moment-save-flash" role="status"><Icon name="heart" size={51}/><span>Added to Favs</span></div>}
          </>}
        </article>;
      })}
      <div className="moment-end" aria-hidden={!explore&&index!==items.length} inert={!explore&&index!==items.length}>
        <Icon name="globe" size={56}/><h2>{privateOnly||ownOnly?'Your city moments.':JOURNEY_COPY.galleryEnd}</h2><p>{privateOnly||ownOnly?'Your camera collection.':JOURNEY_COPY.galleryEndHint}</p><button className="button" onClick={()=>setMode('grid')}>See the gallery<Icon name="grid"/></button>{!explore&&<button className="text-button" onClick={privateOnly||ownOnly?()=>onCapture():onPlay}>{privateOnly||ownOnly?'Add a city moment':JOURNEY_COPY.start}<Icon name="arrow"/></button>}
      </div>
    </div>
    {!explore&&<div className="moment-navigation"><span role="status" aria-live="polite">{index<items.length?`${index+1} / ${items.length}`:'All caught up'}</span><button className="moment-nav-button" aria-label="Previous photo" disabled={index===0} onClick={()=>move(index-1)}><Icon name="back" size={19}/></button><button className="moment-nav-button" aria-label="Next photo" disabled={index===items.length} onClick={()=>move(index+1)}><Icon name="arrow" size={19}/></button></div>}
  </div>;
}

export function PalsGallery(props:GalleryProps){
  const {state,now,countryId,onCapture,onCity,onVisits,onPlay,onCities,ownOnly=false,explore=false,onPal}=props;
  const [tab,setTab]=useState<'photos'|'pals'>('photos'),[filter,setFilter]=useState<CountryId|undefined>(countryId);
  const [savedOnly,setSavedOnly]=useState(false),[mode,setMode]=useState<'feed'|'grid'>('feed');
  const playStatus=dailyStatus(state.daily,now),wait=countdownParts(playStatus.remainingMs);
  const privateOnly=state.profile?.ageBand==='10-12',scope=countryId??filter,p=photoMonthProgress(state,now);
  const visible=(photos:CityPhotoItem[])=>privateOnly||ownOnly?photos.filter(p=>p.you):countryId?photos:photos.filter(p=>!p.you);const all=visible(galleryPhotoFeed(state,undefined,now)),items=visible(galleryPhotoFeed(state,scope,now,savedOnly));
  const cityIds=[...new Set(all.map(photo=>photo.countryId))],places=worldPlaces(state).filter(place=>place.uncovered);

  return <div className={`city-gallery-screen ${explore?'explore-feed':''}`}>
    <header className="gallery-heading"><h1 tabIndex={-1}>{explore?'Explore.':countryId?countryById(countryId)!.city:privateOnly||ownOnly?'My photos.':'Pals.'}</h1>{explore?<button className="explore-play-button" aria-label={playStatus.kind==='waiting'?(state.launch?.globalPlay?'Next play at your daily time':'Next game countdown'):'Find my roamie'} disabled={playStatus.kind==='waiting'} onClick={onPlay}><Icon name="spark" size={18}/>{playStatus.kind==='waiting'?<span role="timer" aria-label="Next game countdown">{wait.hours}:{wait.minutes}:{wait.seconds}</span>:'Play'}</button>:<button className="gallery-week-button" aria-label={privateOnly?'Take a city photo':'Shoot your city'} onClick={()=>onCapture(scope)}><Icon name="camera" size={21}/><span aria-label={`${Math.min(p.count,3)} of 3 photos this month`}>{Math.min(p.count,3)}<small>/3</small></span></button>}{!explore&&!countryId&&!privateOnly&&!ownOnly&&<button className="icon-button" aria-label="Cities" onClick={onCities}><Icon name="globe" size={22}/></button>}{!explore&&!countryId&&!ownOnly&&isAdult(state.profile!.ageBand)&&<button className="icon-button" aria-label="Visits" onClick={onVisits}><Icon name="calendar" size={22}/></button>}</header>
    {!explore&&!countryId&&!privateOnly&&!ownOnly&&<p className="pal-feed-note">Their city. Their lens. Identity private.</p>}
    {explore&&onPal&&<><PalRail state={state} now={now} onPal={onPal}/><PalVisitCard state={state} now={now} onOpen={onPal} compact/></>}{privateOnly&&<p className="gallery-private-note">Private collection · This device</p>}
    {!explore&&!countryId&&!privateOnly&&!ownOnly&&<div className="gallery-tabs" data-active={tab} role="group" aria-label="Roamies views"><span className="gallery-tab-indicator" aria-hidden="true"/>{[{id:'photos' as const,label:JOURNEY_COPY.galleryPhotos,icon:'camera'},{id:'pals' as const,label:JOURNEY_COPY.galleryPals,icon:'people'}].map(item=><button key={item.id} aria-pressed={tab===item.id} onClick={()=>setTab(item.id)}><Icon name={item.icon} size={19}/><span>{item.label}</span></button>)}</div>}
    {tab==='photos'&&<div className="gallery-controls">{!countryId&&cityIds.length>1?<div className="gallery-city-rail" aria-label="Filter city photos"><button aria-pressed={!filter} onClick={()=>setFilter(undefined)}>Everywhere</button>{cityIds.map(id=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{countryById(id)!.flag} {countryById(id)!.city}</button>)}</div>:<span className={countryId||privateOnly?'gallery-section-label':'gallery-toolbar-label'}>{countryId||privateOnly?(savedOnly?'Your favorites':privateOnly||ownOnly?'Your lens':'Their lens'):savedOnly?'':`${items.length} ${items.length===1?'moment':'moments'}`}</span>}<div className="gallery-view-buttons"><button className="icon-button" aria-label="Favorite photos" aria-pressed={savedOnly} onClick={()=>setSavedOnly(!savedOnly)}><Icon name="heart" size={20}/></button><button className="icon-button" aria-label={mode==='feed'?'Show photo grid':'Show swipe feed'} aria-pressed={mode==='grid'} onClick={()=>setMode(mode==='feed'?'grid':'feed')}><Icon name={mode==='feed'?'grid':'layers'} size={20}/></button></div></div>}

    {tab==='pals'?<div className="lens-connections">{places.map(place=><button className="lens-city-row" key={place.country.id} aria-label={`Connected roamies in ${place.country.city}`} onClick={()=>onCity(place.country.id)}><span className="lens-city-thumb"><AttractionImage id={place.attractions[0].id}/></span><span><strong>{place.country.city}</strong><small>{publicCityPals(state,place.country.id).length} roamies · Anonymous</small></span><Icon name="arrow" size={20}/></button>)}{!places.length&&<div className="gallery-empty"><Icon name="people" size={54}/><h2>New cities. New perspectives.</h2><button className="text-button" onClick={onPlay}>{JOURNEY_COPY.start}<Icon name="arrow"/></button></div>}</div>:<>
      {savedOnly&&!items.length?<div className="gallery-empty"><Icon name="heart" size={54}/><h2>Keep a little of their world.</h2><p>Tap a heart to keep a moment.</p><button className="button" onClick={()=>setSavedOnly(false)}>Browse moments<Icon name="arrow"/></button></div>:<MomentFeed key={`${scope??'all'}:${savedOnly}`} {...props} items={items} mode={mode} setMode={setMode}/>}
    </>}
  </div>;
}
