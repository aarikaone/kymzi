import {useContext,useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent} from 'react';
import {usePlaceAddFeedback} from '../../../packages/shared/usePlaceAddFeedback';
import {PlaceStack,PlaceStackContext} from './PlaceStack';
import type {TravelCity,TravelPlace} from '@rymzi/core';
import {GuidePlaceArt} from './TravelArt';
import {Icon} from './icons';
import {PlaceFavoriteButton} from './PlaceFavorite';
import {SubpageBar} from './AppBar';
import {CityPlaceDetails} from './CityPlaceDetails';
import {CityPlayCards,CityPlayContext} from './CityPlayCards';
import './city-attraction-reel.css';

export type AttractionOrigin={left:number;top:number;width:number;height:number};
type Props={city:TravelCity;places:TravelPlace[];initialId:string;origin:AttractionOrigin|null;selected:string[];onToggle?:(id:string)=>void;onBack:()=>void;onPlayExit?:()=>void;closing?:boolean};
const reduceMotion=()=>typeof window.matchMedia!=='function'||window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One city, one full-screen place at a time. Only nearby images are mounted. */
export function CityAttractionReel({city,places,initialId,origin,selected,onToggle,onBack,onPlayExit,closing=false}:Props){
 const playContext=useContext(CityPlayContext),stack=useContext(PlaceStackContext);
 const start=Math.max(0,places.findIndex(place=>place.id===initialId));
 const [index,setIndex]=useState(start),[shared,setShared]=useState(''),[moved,setMoved]=useState(false),[details,setDetails]=useState(false),[barHeight,setBarHeight]=useState(76);
 const picked=onToggle?selected:playContext?.savedPlaces??[],feedback=usePlaceAddFeedback(picked,!details),hasStack=feedback.ids.length>0;
 function toggle(id:string){const adding=!picked.includes(id);onToggle?.(id);if(adding)feedback.added(id);}
 const viewport=useRef<HTMLDivElement>(null),back=useRef<HTMLButtonElement>(null),hero=useRef<HTMLDivElement>(null),current=useRef(start),shareTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const place=places[index];
 useLayoutEffect(()=>{
  const element=viewport.current;if(!element)return;
  const resize=()=>{element.scrollTop=current.current*element.clientHeight;};
  resize();back.current?.focus({preventScroll:true});
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(element);
  return()=>observer?.disconnect();
 },[]);
 useEffect(()=>{
  if(reduceMotion()||!origin)return;
  const frame=requestAnimationFrame(()=>{
   const image=hero.current;if(!image||typeof image.animate!=='function')return;
   const target=image.getBoundingClientRect();if(!target.width||!target.height)return;
   image.animate([{transform:`translate(${origin.left-target.left}px,${origin.top-target.top}px) scale(${origin.width/target.width},${origin.height/target.height})`,borderRadius:'18px',opacity:.65},{transform:'none',borderRadius:'0',opacity:1}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
  });return()=>cancelAnimationFrame(frame);
 },[origin]);
 useEffect(()=>()=>{if(shareTimer.current)clearTimeout(shareTimer.current);},[]);
 function go(next:number){const el=viewport.current;if(!el)return;const value=Math.max(0,Math.min(places.length-1,next));el.scrollTo({top:value*el.clientHeight,behavior:reduceMotion()?'instant':'smooth'});if(!el.clientHeight){current.current=value;setIndex(value);setMoved(true);}}
 function keys(event:KeyboardEvent){
  if(details)return;
  const next=event.key==='ArrowDown'||event.key==='PageDown'?index+1:event.key==='ArrowUp'||event.key==='PageUp'?index-1:event.key==='Home'?0:event.key==='End'?places.length-1:null;
  if(next!==null){event.preventDefault();go(next);}
 }
 async function share(){
  if(!place)return;
  try{
   const text=`${place.name} · ${city.city}\n${place.fact}\nDiscovered with Kymzi`;
   if(typeof navigator.share==='function')await navigator.share({title:`${place.name} · ${city.city}`,text});
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setShared('Place copied');}
   else setShared('Sharing is unavailable here');
  }catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShared('Couldn’t share. Try again.');}
  if(shareTimer.current)clearTimeout(shareTimer.current);shareTimer.current=setTimeout(()=>setShared(''),2400);
 }
 if(!place)return null;
 return <section className={`city-reel${playContext?.profileReady?' has-play-cards':''}${hasStack?' has-place-stack':''}`} data-closing={closing||undefined} aria-label={`Explore ${city.city} places`} onKeyDown={keys}>
  <div className="city-reel-viewport" style={{top:barHeight}} ref={viewport} role="feed" aria-label={`${city.city} attractions feed`} onScroll={event=>{const el=event.currentTarget;if(!el.clientHeight)return;const next=Math.max(0,Math.min(places.length-1,Math.round(el.scrollTop/el.clientHeight)));if(next!==current.current){current.current=next;setIndex(next);setMoved(true);setShared('');}}}>
   {places.map((item,i)=><article key={item.id} className="city-reel-card" aria-label={`${item.name}, place ${i+1} of ${places.length}`} aria-posinset={i+1} aria-setsize={places.length} aria-hidden={i!==index} inert={i!==index} data-active={i===index||undefined}>
    <div className="city-reel-art" ref={i===start?hero:undefined}>{Math.abs(i-index)<=1&&<GuidePlaceArt place={item} eager/>}</div>
    <div className="city-reel-shade"/>
    <div className="city-reel-copy"><span className="city-reel-kind">{item.kind}</span><h2 className="page-heading">{item.name}</h2><p>{item.details?.description||item.fact}</p>
     {Math.abs(i-index)<=1&&<CityPlayCards category={item.categoryId} onStart={onPlayExit??onBack} onExplore={onBack}/> }
     <div className="city-reel-actions">{onToggle&&<button className="city-reel-primary" aria-label={`Select ${item.name}`} aria-pressed={selected.includes(item.id)} onClick={()=>toggle(item.id)}><Icon name={selected.includes(item.id)?'check':'plus'} size={20}/>{selected.includes(item.id)?'Added':'Add place'}</button>}{!onToggle&&playContext?.onTogglePlace&&<PlaceFavoriteButton id={item.id} name={item.name} saved={playContext.savedPlaces?.includes(item.id)??false} onFavorite={playContext.onTogglePlace} onSaved={()=>feedback.added(item.id)} variant="primary" glyph="plus" compact className="city-reel-primary" accessibleLabel={`Select ${item.name}`}/>}
      <button className="city-reel-more" aria-label={`About ${item.name}`} onClick={()=>setDetails(true)}>Read more<Icon name="arrow" size={16}/></button>
      <button className="city-reel-circle" aria-label={`Share ${item.name}`} onClick={()=>void share()}><Icon name="share" size={21}/></button>
     </div>
    </div>
   </article>)}
  </div>
  <SubpageBar className="city-reel-header" title={city.city} backRef={back} backLabel={`Back to ${city.city} places`} onBack={onBack} onHeightChange={setBarHeight} right={<span aria-label={`Place ${index+1} of ${places.length}`}>{index+1} / {places.length}</span>}/>
  <nav className="city-reel-paging" aria-label="Browse city attractions"><button aria-label="Previous attraction" disabled={index===0} onClick={()=>go(index-1)}><Icon name="back" size={19} style={{transform:'rotate(90deg)'}}/></button><span><i style={{height:`${(index+1)/places.length*100}%`}}/></span><button aria-label="Next attraction" disabled={index===places.length-1} onClick={()=>go(index+1)}><Icon name="back" size={19} style={{transform:'rotate(-90deg)'}}/></button></nav>
  {!moved&&<span className="city-reel-hint"><Icon name="arrow" size={14} style={{transform:'rotate(-90deg)'}}/>Swipe up. Stay curious.</span>}
  <span role="status" aria-live="polite" className={shared?'city-reel-toast':'visually-hidden'}>{shared||`${place.name}. ${index+1} of ${places.length}.`}</span>
  {feedback.visible&&<PlaceStack bottom={14} fading={feedback.fading} onOpenChange={feedback.setPaused} selection={{ids:feedback.ids,kind:stack?.kind??(onToggle?'visited':'saved'),onRemove:id=>onToggle?onToggle(id):stack?stack.onRemove(id):playContext?.onTogglePlace?.(id)}}/>}
  {details&&<CityPlaceDetails place={place} city={city} onClose={()=>setDetails(false)}/>}
 </section>;
}
