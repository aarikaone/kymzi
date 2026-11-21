import {createPortal} from 'react-dom';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {TRAVEL_CITIES,searchTravelCities,travelCityById,travelPlaceGroup,readTravelProfile,setTravelCity,removeTravelCity,completeTravelProfile,travelWishCount,type TravelCityId,type TravelProfile} from '@rymzi/core';
import {TravelCityArt,GuidePlaceArt} from './TravelArt';
import {useCityPlaces} from './useCityPlaces';
import {Icon} from './icons';
import {SubpageBar} from './AppBar';
import {CityPlayContext} from './CityPlayCards';
import {CityAttractionReel,type AttractionOrigin} from './CityAttractionReel';
import './travel-world.css';
import './world-library.css';
import './travel-navigation.css';
export function CitySheet({cityId,initialPlaceId,selected=[],onToggle,onConfirm,onRemove,onClose,confirmLabel,disabled=false,children,caption}:{cityId:TravelCityId|null;initialPlaceId?:string;selected?:string[];onToggle?:(id:string)=>void;onConfirm?:()=>void;onRemove?:()=>void;onClose:()=>void;confirmLabel?:string;disabled?:boolean;children?:ReactNode;caption?:string}){
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const city=travelCityById(cityId),guide=useCityPlaces(cityId),[group,setGroup]=useState('All'),[viewed,setViewed]=useState<{id:string;origin:AttractionOrigin|null}|null>(null),[closing,setClosing]=useState(false);
 const groups=[...new Set(guide.places.map(travelPlaceGroup))],active=groups.includes(group)?group:'All';
 useEffect(()=>{setGroup('All');setViewed(initialPlaceId?{id:initialPlaceId,origin:null}:null);setClosing(false);if(timer.current)clearTimeout(timer.current);if(city&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[cityId,initialPlaceId]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useLayoutEffect(()=>{
  if(!viewed){if(opener.current?.isConnected)opener.current.focus({preventScroll:true});return;}
  const el=dialog.current;if(!el)return;
  const resize=()=>{
   const shell=document.querySelector<HTMLElement>('.app-shell');if(!shell)return;
   const box=shell.getBoundingClientRect(),css=getComputedStyle(shell),border=parseFloat(css.borderLeftWidth)||0;
   if(!box.width||!box.height)return;
   const status=shell.querySelector<HTMLElement>('.device-statusbar')?.getBoundingClientRect().height??0;
   el.style.setProperty('--reel-left',`${box.left+border}px`);el.style.setProperty('--reel-top',`${box.top+border+status}px`);
   el.style.setProperty('--reel-width',`${box.width-border*2}px`);el.style.setProperty('--reel-height',`${box.height-border*2-status}px`);
   el.style.setProperty('--reel-radius',border?'0 0 35px 35px':'0px');el.style.setProperty('--reel-corner',border?'35px':'0px');
  };
  resize();window.addEventListener('resize',resize);const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;const shell=document.querySelector('.app-shell');if(shell)observer?.observe(shell);
  return()=>{window.removeEventListener('resize',resize);observer?.disconnect();for(const key of ['left','top','width','height','radius','corner'])el.style.removeProperty('--reel-'+key);};
 },[!!viewed]);
 function backToPlaces(){if(initialPlaceId){onClose();return;}if(closing)return;const finish=()=>{setViewed(initialPlaceId?{id:initialPlaceId,origin:null}:null);setClosing(false);};if(typeof window.matchMedia!=='function'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else{setClosing(true);timer.current=setTimeout(finish,180);}}
 function dismiss(){if(viewed)backToPlaces();else onClose();}
 if(!city)return null;
 return createPortal(<dialog ref={dialog} className={`travel-city-sheet world-city-sheet${viewed?' city-reel-open':''}`} aria-label={viewed?`${city.city} place viewer`:`${city.city} attractions`} onCancel={e=>{e.preventDefault();dismiss();}} onClick={e=>{const box=e.currentTarget.getBoundingClientRect();if(e.target===e.currentTarget&&(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom))dismiss();}}>
  <div className="city-sheet-overview" hidden={!!viewed}>
   <div className="travel-sheet-handle"/><SubpageBar title={city.city} onBack={onClose} backLabel="Close city" safeArea={false}/>
   <p>{caption??'Tap a place. See where it takes you.'}</p>
   <div className="world-place-filters" role="group" aria-label="Place categories">{['All',...groups].map(g=><button key={g} aria-label={g==='All'?'All places':g} aria-pressed={active===g} onClick={()=>setGroup(g)}>{g}<small>{g==='All'?city.placeIds.length:guide.places.filter(p=>travelPlaceGroup(p)===g).length}</small></button>)}</div>
   <div className="travel-attractions world-guide-places">{guide.places.filter(p=>active==='All'||travelPlaceGroup(p)===active).map(place=><article key={place.id} data-visited={selected.includes(place.id)||undefined}>
    <div className="world-place-open"><GuidePlaceArt place={place}/><span className="world-place-copy"><small>{place.kind}</small><strong>{place.name}</strong></span><button className="world-place-launch" aria-label={`Explore ${place.name}`} onClick={event=>{opener.current=event.currentTarget;const box=event.currentTarget.parentElement?.querySelector('.world-generated-art')?.getBoundingClientRect();setViewed({id:place.id,origin:box?{left:box.left,top:box.top,width:box.width,height:box.height}:null});}}/></div>
    {onToggle&&<button className="world-place-select" aria-label={`Select ${place.name}`} aria-pressed={selected.includes(place.id)} onClick={()=>onToggle(place.id)}><Icon name={selected.includes(place.id)?'check':'plus'} size={18}/></button>}
   </article>)}{guide.loading&&<p role="status" className="world-guide-loading">Loading places…</p>}{guide.error&&<div className="world-guide-loading"><p role="alert">{guide.error}</p><button onClick={guide.retry}>Retry places</button></div>}</div>
   <small className="world-data-credit">Illustrated guide · City and place data: GeoNames &amp; Wikidata</small>
   <footer>{children??<><button className="place-primary" disabled={disabled} onClick={onConfirm??onClose}>{confirmLabel??'Done'}<Icon name="arrow" size={20}/></button>{onRemove&&<button className="travel-quiet" onClick={onRemove}>Remove city</button>}</>}</footer>
  </div>
  {viewed&&guide.places.some(p=>p.id===viewed.id)&&<CityAttractionReel key={`${city.id}:${viewed.id}`} city={city} places={guide.places} initialId={viewed.id} origin={viewed.origin} selected={selected} onToggle={onToggle} onBack={backToPlaces} onPlayExit={onClose} closing={closing}/>}
 </dialog>,document.body);
}
export type TravelSetupSection='visited'|'wishlist';
export type TravelSetupPage='list'|'cities'|'places';
type SetupProps={initial?:TravelProfile;onChange?:(t:TravelProfile)=>void;onComplete:(t:TravelProfile)=>void|Promise<void>;onBack:()=>void;busy?:boolean;error?:string;editing?:boolean;section?:TravelSetupSection;onSectionChange?:(section:TravelSetupSection)=>void;showBackButton?:boolean;page?:TravelSetupPage;cityId?:TravelCityId|null;onOpenCities:()=>void;onOpenCity:(id:TravelCityId)=>void;onSelectionDone:()=>void;selectedPlaces?:string[];onSelectedPlacesChange?:(ids:string[])=>void;onOpenPlace?:(id:string,origin:AttractionOrigin|null)=>void};
export function TravelSetup({initial,onChange,onComplete,onBack,busy=false,error='',editing=false,section,onSectionChange,showBackButton=true,page='list',cityId=null,onOpenCities,onOpenCity,onSelectionDone,selectedPlaces,onSelectedPlacesChange,onOpenPlace}:SetupProps){
 const [localDraft,setDraft]=useState(()=>readTravelProfile(initial)),[localStep,setStep]=useState<TravelSetupSection>('visited'),[localError,setLocalError]=useState(''),[saving,setSaving]=useState(false),[searching,setSearching]=useState(false),lock=useRef(false);
 const draft=onChange?readTravelProfile(initial):localDraft,step=section??localStep,working=busy||saving,count=travelWishCount(draft);
 function update(next:TravelProfile){setDraft(next);onChange?.(next);setLocalError('');}
 function changeStep(next:TravelSetupSection){if(working)return;setSearching(false);setLocalError('');setStep(next);onSectionChange?.(next);}
 async function finish(){if(lock.current||busy)return;lock.current=true;setSaving(true);try{setLocalError('');await onComplete(completeTravelProfile(draft));}catch(e){setLocalError((e as Error).message);}finally{lock.current=false;setSaving(false);}}
 if(page==='places')return <TravelSetupPlaces key={`${step}:${cityId}`} cityId={cityId} section={step} draft={draft} onChange={update} onDone={onSelectionDone} busy={working} selected={selectedPlaces} onSelectedChange={onSelectedPlacesChange} onOpenPlace={onOpenPlace}/>;
 if(page==='cities')return <div className={`travel-onboard standard-travel-editor${searching?' setup-search-active':''}`}>{!searching&&<header><h1>Find your next<br/>somewhere.</h1><p>Choose a city. Find your places.</p></header>}<SetupCityGrid draft={draft} section={step} busy={working} onOpen={onOpenCity} searching={searching} onSearchChange={setSearching}/></div>;
 return <div className={`travel-onboard standard-travel-editor${step==='wishlist'?' wish-list-editor':''}${searching?' setup-search-active':''}`}>
  {!(step==='visited'&&searching)&&<header>
   {showBackButton&&<button className="travel-inline-back" aria-label="Previous setup step" disabled={working} onClick={()=>!editing&&step==='wishlist'?changeStep('visited'):onBack()}><Icon name="back" size={22}/>Back</button>}
   {editing?<div className="travel-section-tabs" role="tablist" aria-label="My travel list">{(['visited','wishlist'] as const).map(value=><button key={value} role="tab" aria-selected={step===value} tabIndex={step===value?0:-1} disabled={working} onClick={()=>changeStep(value)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?'visited':e.key==='End'?'wishlist':step==='visited'?'wishlist':'visited';changeStep(next);e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next==='visited'?0:1]?.focus();}}>{value==='visited'?'Visited':'Wishlist'}<small>{value==='visited'?draft.visited.length:count}</small></button>)}</div>:<div className="travel-step-indicator" aria-label={`Step ${step==='visited'?1:2} of 2`}>{[0,1].map(i=><i key={i} className={i<=(step==='visited'?0:1)?'complete':''}/>)}</div>}
   <h1>{step==='visited'?'Where have\nyou been?':'Your someday\nlist.'}</h1>
   <p>{step==='visited'?'Add cities you’ve visited. Or skip.':'Pick at least 3 places you’d love to see.'}</p>
   {step==='wishlist'&&<div className="wish-goal" aria-label={`${count} wishlist places`}><div><strong>{count}<span> / 3</span></strong><small>{count>=3?'Ready to roam':`${3-count} more to start`}</small></div><div className="wish-goal-track" role="progressbar" aria-label="Wishlist setup" aria-valuemin={0} aria-valuemax={3} aria-valuenow={Math.min(count,3)}>{[0,1,2].map(i=><i key={i} data-filled={count>i}/>)}</div></div>}
  </header>}
  {step==='visited'?<SetupCityGrid draft={draft} section={step} busy={working} onOpen={onOpenCity} searching={searching} onSearchChange={setSearching}/>:<div className="wish-list-body"><div className="wish-spot-list">{count?draft.wishlist.filter(w=>w.attractionIds.length).map(w=><WishlistCityPlaces key={w.cityId} selection={w} busy={working} onOpen={()=>onOpenCity(w.cityId)} onRemove={id=>{const ids=w.attractionIds.filter(p=>p!==id);update(ids.length?setTravelCity(draft,'wishlist',{cityId:w.cityId,attractionIds:ids}):removeTravelCity(draft,'wishlist',w.cityId));}}/>):<div className="wish-empty"><div className="wish-empty-orbit"><Icon name="spark" size={32}/><i/><i/></div><h2>A little someday.</h2><p>A waterfall. A quiet street.<br/>Somewhere you can’t stop thinking about.</p></div>}</div><button className="wish-add" aria-label="Add wishlist places" disabled={working} onClick={onOpenCities}><Icon name="plus" size={30}/></button></div>}
  {!(step==='visited'&&searching)&&<footer>{(error||localError)&&<p role="alert" className="place-error">{error||localError}</p>}<button className="place-primary" disabled={working||((editing||step==='wishlist')&&count<3)} onClick={()=>{if(!editing&&step==='visited')changeStep('wishlist');else void finish();}}>{working?'Saving…':editing?'Save changes':step==='visited'?(draft.visited.length?'Next':'Skip for now'):'Create my profile'}<Icon name={editing?'check':'arrow'}/></button></footer>}
 </div>;
}
function SetupCityGrid({draft,section,busy,onOpen,searching,onSearchChange}:{draft:TravelProfile;section:TravelSetupSection;busy:boolean;onOpen:(id:TravelCityId)=>void;searching:boolean;onSearchChange:(value:boolean)=>void}){
 const [search,setSearch]=useState(''),[limit,setLimit]=useState(36),input=useRef<HTMLInputElement>(null),matches=searchTravelCities(search,TRAVEL_CITIES.length),visible=matches.slice(0,limit);
 useEffect(()=>{
  if(!searching)return;
  const viewport=window.visualViewport,update=()=>document.documentElement.style.setProperty('--city-search-viewport',`${viewport?.height??window.innerHeight}px`);
  update();viewport?.addEventListener('resize',update);
  return()=>{viewport?.removeEventListener('resize',update);document.documentElement.style.removeProperty('--city-search-viewport');};
 },[searching]);
 function done(){input.current?.blur();onSearchChange(false);}
 return <><div className="setup-search-row"><label className="travel-search setup-city-search"><Icon name="search" size={18}/><input ref={input} aria-label="Find a city" placeholder={`Search ${TRAVEL_CITIES.length.toLocaleString('en')} cities`} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" disabled={busy} value={search} onFocus={()=>onSearchChange(true)} onChange={e=>{setSearch(e.target.value);setLimit(36);}} onKeyDown={e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();done();}}}/></label>{searching&&<button className="setup-search-done" onClick={done}>Done</button>}</div><div className={`travel-city-grid${searching?' city-search-results':''}`}>{visible.map(c=>{const picked=draft[section].some(v=>v.cityId===c.id);return <button key={c.id} aria-label={`Choose ${c.city}${c.id.startsWith('city:')?`, ${c.name}${c.region?`, ${c.region}`:''}`:''}`} aria-pressed={picked} disabled={busy} onClick={()=>{done();onOpen(c.id);}}><TravelCityArt cityId={c.id} eager/><span className="travel-city-caption"><strong>{c.city}</strong><small>{c.flag} {c.name}{c.region?` · ${c.region}`:''}</small></span>{picked&&<i><Icon name="check" size={15}/></i>}</button>;})}{matches.length>visible.length&&<button className="world-more-cities" disabled={busy} onClick={()=>setLimit(n=>n+36)}>More cities<Icon name="plus" size={18}/></button>}{!matches.length&&<p className="world-city-empty">Try a city, region or country.</p>}</div></>;
}
function WishlistCityPlaces({selection,busy,onOpen,onRemove}:{selection:{cityId:TravelCityId;attractionIds:string[]};busy:boolean;onOpen:()=>void;onRemove:(id:string)=>void}){
 const city=travelCityById(selection.cityId)!,guide=useCityPlaces(selection.cityId);
 return <section className="wish-city-group" aria-label={`${city.city} wishlist places`}>{selection.attractionIds.map(id=>{const place=guide.places.find(p=>p.id===id);return <article className="wish-spot" key={id}><button className="wish-spot-open" aria-label={`Edit ${place?.name??city.city} wish`} disabled={busy} onClick={onOpen}><span className="wish-spot-art">{place?<GuidePlaceArt place={place} eager/>:<TravelCityArt cityId={city.id}/>}</span><span className="wish-spot-copy"><small>{city.city} · {city.name}</small><strong>{place?.name??(guide.loading?'Loading place…':'Saved place')}</strong><em>{place?.kind??'On your list'}</em></span></button><button className="wish-remove" aria-label={`Remove ${place?.name??'saved place'} wish`} disabled={busy} onClick={()=>onRemove(id)}><Icon name="close" size={18}/></button></article>;})}{guide.error&&<button className="travel-quiet" onClick={guide.retry}>Retry places</button>}</section>;
}
function TravelSetupPlaces({cityId,section,draft,onChange,onDone,busy,selected,onSelectedChange,onOpenPlace}:{cityId:TravelCityId|null;section:TravelSetupSection;draft:TravelProfile;onChange:(t:TravelProfile)=>void;onDone:()=>void;busy:boolean;selected?:string[];onSelectedChange?:(ids:string[])=>void;onOpenPlace?:(id:string,origin:AttractionOrigin|null)=>void}){
 const city=travelCityById(cityId),guide=useCityPlaces(cityId),existing=draft[section].find(c=>c.cityId===cityId),[localPicks,setLocalPicks]=useState(existing?.attractionIds??[]),[group,setGroup]=useState('All');
 const picks=selected??localPicks;function toggle(id:string){const next=picks.includes(id)?picks.filter(p=>p!==id):[...picks,id];setLocalPicks(next);onSelectedChange?.(next);}
 if(!city)return <div className="travel-onboard"><header><h1>Choose a city.</h1></header></div>;
 const groups=[...new Set(guide.places.map(travelPlaceGroup))];
 function save(){if(busy)return;onChange(section==='wishlist'&&!picks.length?removeTravelCity(draft,section,city!.id):setTravelCity(draft,section,{cityId:city!.id,attractionIds:picks}));onDone();}
 return <div className="travel-onboard standard-travel-editor setup-place-page"><header><small className="setup-place-country">{city.flag} {city.name}</small><h1>{city.city}</h1><p>{section==='visited'?'Pick the places you’ve been.':'Which places are on your list?'}</p><div className="world-place-filters" role="group" aria-label="Place categories">{['All',...groups].map(g=><button key={g} aria-pressed={group===g} onClick={()=>setGroup(g)}>{g}</button>)}</div></header><div className="setup-place-grid">{guide.places.filter(p=>group==='All'||travelPlaceGroup(p)===group).map(place=>{const picked=picks.includes(place.id);return <article key={place.id} data-picked={picked||undefined}><div className="setup-place-image"><GuidePlaceArt place={place}/><button className="setup-place-open" aria-label={`Explore ${place.name}`} disabled={busy} onClick={event=>{const box=event.currentTarget.getBoundingClientRect();onOpenPlace?.(place.id,{left:box.left,top:box.top,width:box.width,height:box.height});}}/></div><button className="setup-place-caption" aria-label={`Select ${place.name}`} aria-pressed={picked} disabled={busy} onClick={()=>toggle(place.id)}><small>{place.kind}</small><strong>{place.name}</strong><i><Icon name={picked?'check':'plus'} size={19}/></i></button></article>;})}{guide.loading&&<p role="status" className="world-guide-loading">Loading places…</p>}{guide.error&&<div className="world-guide-loading"><p role="alert">{guide.error}</p><button onClick={guide.retry}>Retry places</button></div>}</div><footer><p className="setup-selection-count" aria-live="polite">{picks.length?`${picks.length} ${picks.length===1?'place':'places'} picked`:section==='visited'?'City only? That works too.':'Pick a place to start.'}</p><button className="place-primary" disabled={busy||(section==='wishlist'&&!picks.length&&!existing)} onClick={save}>{section==='visited'?(existing?'Save visited city':'Add visited city'):existing?'Save wishes':`Add ${picks.length||''} ${picks.length===1?'wish':'wishes'}`}<Icon name="arrow" size={21}/></button>{existing&&<button className="travel-quiet" disabled={busy} onClick={()=>{onChange(removeTravelCity(draft,section,city.id));onDone();}}>{section==='visited'?'Remove city':'Remove these wishes'}</button>}</footer></div>;
}

export function TravelSetupPlaceViewer({cityId,placeId,selected,onToggle,onBack,origin=null}:{cityId:TravelCityId|null;placeId:string;selected:string[];onToggle:(id:string)=>void;onBack:()=>void;origin?:AttractionOrigin|null}){
 const city=travelCityById(cityId),guide=useCityPlaces(cityId);
 return <div className="travel-setup-viewer">{city&&guide.places.some(p=>p.id===placeId)?<CityPlayContext.Provider value={null}><CityAttractionReel key={`${cityId}:${placeId}`} city={city} places={guide.places} initialId={placeId} origin={origin} selected={selected} onToggle={onToggle} onBack={onBack}/></CityPlayContext.Provider>:<><SubpageBar title={city?.city??'Places'} onBack={onBack}/><div className="world-guide-loading">{guide.loading?<p role="status">Loading places…</p>:<><p role="alert">{guide.error||'This place is unavailable.'}</p><button onClick={guide.retry}>Retry places</button></>}</div></>}</div>;
}
