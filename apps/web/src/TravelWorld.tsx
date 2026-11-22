import {useWishStopFeed} from '../../../packages/shared/useWishStopFeed';
import {galleryIndex} from '../../../packages/shared/photoGallery';
import {RoamieWishlists,type RoamieWishlistsProps} from './RoamieWishlists';
import {RemoteImage} from './RemoteImage';
import './visited-photos.css';
import {publicCdnImage} from '@rymzi/core';
import {TravelCityArt,GuidePlaceArt} from './TravelArt';
import {useCityPlaces} from './useCityPlaces';
import {useEffect,useRef,useState} from 'react';
import {travelCityById,readTravelProfile,roamieTravels,previewCityEvidence,type PreviewState,type TravelCityId,type CityEvidence,type RoamieWishStop,type RoamieWishGroup} from '@rymzi/core';
import {AttractionImage} from './AttractionImage';
import {CitySheet} from './TravelSetup';
import {Icon} from './icons';
import {requestTravelLocation} from './travelLocation';
import './travel-world.css';
import './feed-cards.css';
type Arrival=(id:TravelCityId,evidence:CityEvidence)=>void|Promise<void>;
export function TravelWishlist({state,onArrival,onEdit}:{state:PreviewState;onArrival:Arrival;onEdit:(section:'visited'|'wishlist')=>void}){
 const [section,setSection]=useState<'visited'|'wishlist'>('wishlist');
 const travel=readTravelProfile(state.profile?.travel),[city,setCity]=useState<TravelCityId|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),operation=useRef(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;operation.current++;};},[]);
 function close(){operation.current++;setCity(null);setError('');setBusy(false);}
 async function arrive(demo=false){if(!city||busy)return;const id=city,token=++operation.current;setBusy(true);setError('');try{const evidence=demo?previewCityEvidence(id):await requestTravelLocation();if(token!==operation.current||!alive.current)return;await onArrival(id,evidence);}catch(e){if(token===operation.current&&alive.current)setError((e as Error).message);}finally{if(token===operation.current&&alive.current)setBusy(false);}}
 const arrival=travel.arrivals.find(a=>a.cityId===city&&a.wishFulfilled);
 return <section className="travel-wishlist" aria-label="Your travel lists"><header><div className="travel-list-switch" role="group" aria-label="Travel lists">{(['wishlist','visited'] as const).map(value=><button key={value} aria-pressed={section===value} onClick={()=>{close();setSection(value);}}>{value==='wishlist'?'Wishlist':'Visited'}<small>{travel[value].length}</small></button>)}</div><button onClick={()=>onEdit(section)} aria-label={section==='wishlist'?'Edit travel wishlist':'Edit visited places'}>Edit<Icon name="arrow" size={14}/></button></header><div className="travel-list-rail">{travel[section].map(w=>{const c=travelCityById(w.cityId)!,done=travel.arrivals.some(a=>a.cityId===w.cityId&&a.wishFulfilled);return <button key={w.cityId} aria-label={`Open my ${c.city} ${section==='wishlist'?'wish':'visit'}`} onClick={()=>{operation.current++;setCity(w.cityId);setError('');}}>{section==='visited'&&travel.memories?.some(p=>p.cityId===c.id)?<RemoteImage url={travel.memories.filter(p=>p.cityId===c.id).at(-1)!.image} label={`${c.city} memory`} className="travel-city-art"/>:<TravelCityArt cityId={c.id}/>}<span><strong>{c.city}</strong><small>{section==='visited'?'Visited':done?'Visited':'Wishlist'}</small></span>{done&&<i><Icon name="check" size={13}/></i>}</button>;})}{!travel[section].length&&<button className="travel-empty-wishes" onClick={()=>onEdit(section)}><Icon name="plus"/><span>{section==='visited'?'Add a memory':'Pick your next places'}</span></button>}</div><CitySheet selected={section==='visited'?travel.visited.find(v=>v.cityId===city)?.attractionIds:[]} cityId={city} onClose={close}>{section==='visited'?<button className="place-primary" onClick={()=>{close();onEdit('visited');}}>Add photos<Icon name="plus"/></button>:arrival?<><div className="travel-arrival-done" role="status"><Icon name="check"/><strong>You’re here</strong><small>{arrival.source==='demo'?'Preview check-in':'Device location checked'}</small></div><>{arrival.source==='demo'&&<button className="place-primary" disabled={busy} onClick={()=>void arrive()}>{busy?'Checking your city…':'Confirm with location'}</button>}{error&&<p role="alert" className="place-error">{error}</p>}</><button className="place-primary" onClick={close}>Keep exploring<Icon name="arrow"/></button></>:<><p className="travel-checkin-copy">Arrived? Check in to fulfil this wish.</p>{error&&<p role="alert" className="place-error">{error}</p>}<button className="place-primary" disabled={busy} onClick={()=>void arrive()}>{busy?'Checking your city…':'Check in here'}<Icon name="pin" size={20}/></button><button className="travel-quiet" disabled={busy} onClick={()=>void arrive(true)}>Preview check-in</button></>}</CitySheet></section>;
}
export function RoamieWorlds(props:RoamieWishlistsProps){return <RoamieWishlists {...props}/>;}
export function WishMilestones({state,cityFilter='all'}:{state:PreviewState;cityFilter?:string}){
 const matches=(id:TravelCityId)=>cityFilter==='all'||travelCityById(id)!.city===cityFilter,groups=useWishStopFeed(state,cityFilter),arrivals=readTravelProfile(state.profile?.travel).arrivals.filter(a=>matches(a.cityId)),[selection,setSelection]=useState<{cityId:TravelCityId;placeId?:string}|null>(null);if(!groups.length&&!arrivals.length)return null;
 return <>{groups.length>0&&<section className="wish-milestones" aria-label="Roamie wishes">{groups.map(group=>group.wishes.length>1?<WishStopCarousel key={group.id} group={group} onOpen={setSelection}/>:<WishfulStopCard key={group.id} event={group.wishes[0]} onOpen={()=>setSelection(group.wishes[0])}/>)}</section>}
 {arrivals.length>0&&<section className="feed-city-arrivals" aria-label="City check-ins">{arrivals.slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,5).map(arrival=>{const c=travelCityById(arrival.cityId)!;return <article data-feed-kind="check-in" key={arrival.id}><button className="feed-city-arrival" aria-label={`Explore checked-in city ${c.city}`} onClick={()=>setSelection({cityId:c.id})}><span className="feed-arrival-pin"><Icon name="pin" size={25}/></span><span><small>YOU CHECKED IN</small><strong>{c.city}</strong><em>{arrival.source==='demo'?'Preview check-in':'Device location checked'}</em></span><TravelCityArt cityId={c.id}/></button></article>;})}</section>}<CitySheet cityId={selection?.cityId??null} initialPlaceId={selection?.placeId} onClose={()=>setSelection(null)}/></>;
}
function WishStopCarousel({group,onOpen}:{group:RoamieWishGroup;onOpen:(wish:RoamieWishStop)=>void}){
 const [index,setIndex]=useState(0),track=useRef<HTMLDivElement>(null),current=useRef(0),pending=useRef<number|null>(null),city=travelCityById(group.cityId)!,active=galleryIndex(index,group.wishes.length);current.current=active;
 function align(i:number){const el=track.current,card=el?.firstElementChild;if(!el||!card)return;pending.current=i;const left=i*(card.getBoundingClientRect().width+12);if(typeof el.scrollTo==='function')el.scrollTo({left,behavior:'instant'});else el.scrollLeft=left;}
 function select(i:number){const next=galleryIndex(i,group.wishes.length);setIndex(next);align(next);}
 useEffect(()=>{const el=track.current;if(!el||typeof ResizeObserver!=='function')return;let width=el.clientWidth;const observer=new ResizeObserver(()=>{if(el.clientWidth!==width){width=el.clientWidth;align(current.current);}});observer.observe(el);return()=>observer.disconnect();},[]);
 return <div className="wish-stop-group" role="group" aria-roledescription="carousel" aria-label={`${group.name}’s wishes in ${city.city}`}>
  <div ref={track} className="wish-stop-rail" tabIndex={0} aria-label={`${city.city} wish cards`} onPointerDown={()=>{pending.current=null;}} onWheel={()=>{pending.current=null;}} onKeyDown={event=>{const next=event.key==='ArrowRight'?active+1:event.key==='ArrowLeft'?active-1:event.key==='Home'?0:event.key==='End'?group.wishes.length-1:null;if(next!==null){event.preventDefault();select(next);}}} onScroll={event=>{const el=event.currentTarget,card=el.firstElementChild;if(!card)return;const step=card.getBoundingClientRect().width+12;if(pending.current!==null){if(Math.abs(el.scrollLeft-pending.current*step)>1)align(pending.current);return;}setIndex(galleryIndex(Math.round(el.scrollLeft/step),group.wishes.length));}}>
   {group.wishes.map(wish=><WishfulStopCard key={wish.id} event={wish} compact onOpen={()=>onOpen(wish)}/>)}
  </div>
  <div className="wish-stop-controls"><span role="status" aria-label={`Wish ${active+1} of ${group.wishes.length}`}>{active+1}/{group.wishes.length}</span><div role="group" aria-label="Choose a wish">{group.wishes.map((wish,i)=><button type="button" key={wish.id} aria-label={`Show wish ${i+1} of ${group.wishes.length}`} aria-pressed={i===active} onClick={()=>select(i)}><i/></button>)}</div></div>
 </div>;
}

function WishfulStopCard({event,onOpen,compact=false}:{event:RoamieWishStop;onOpen:()=>void;compact?:boolean}){
 const city=travelCityById(event.cityId)!,guide=useCityPlaces(event.placeId?city.id:null),place=guide.places.find(p=>p.id===event.placeId),title=place?.name??city.city;
 return <article className="feed-wish" data-feed-kind="wish" aria-label={`${event.name}’s wish in ${city.city}`}>
  <button className="feed-wish-main" aria-label={`Explore ${compact?title+', ':''}${event.name}’s wish in ${city.city}`} onClick={onOpen}>
   <span className="feed-wish-image">{place?<GuidePlaceArt place={place}/>:<TravelCityArt cityId={city.id}/>}</span>
   <span className="feed-wish-body">
    <span className="feed-wish-label"><Icon name="bookmark" size={12}/>TRAVEL WISHLIST</span>
    <span className="feed-wish-copy"><strong>{title}</strong><em>{place?city.city+' · ':''}{city.name}</em></span>
    <span className="feed-wish-footer"><img src={publicCdnImage(`/avatars/${event.avatar}.webp`)} alt=""/><strong>{event.name} made this wish.</strong><Icon name="arrow" size={15}/></span>
   </span>
  </button>
 </article>;
}

export function TravelFootprints({state,onEdit}:{state:PreviewState;onEdit?:()=>void}){const travel=readTravelProfile(state.profile?.travel),[city,setCity]=useState<TravelCityId|null>(null);if(!travel.visited.length)return null;return <section className="travel-footprints"><header><h2 className="page-heading">Visited</h2>{onEdit&&<button aria-label="Edit visited cities" onClick={onEdit}>Edit<Icon name="arrow" size={14}/></button>}</header><div>{travel.visited.map(v=><button key={v.cityId} onClick={()=>setCity(v.cityId)}>{travelCityById(v.cityId)!.flag} {travelCityById(v.cityId)!.city}</button>)}</div><CitySheet cityId={city} selected={travel.visited.find(v=>v.cityId===city)?.attractionIds} onClose={()=>setCity(null)}/></section>;}
