import {createContext,useContext,useEffect,useId,useRef,useState,type CSSProperties} from 'react';
import {attractionById,travelCityForPlace,validPlaceStack,type PlaceStackKind} from '@rymzi/core';
import {useCatalogueImage} from '@rymzi/cloud';
import {RemoteImage} from './RemoteImage';
import {useCityPlaces} from './useCityPlaces';
import {Icon} from './icons';
import './place-stack.css';
export type PlaceStackValue={ids:string[];kind:PlaceStackKind;onRemove:(id:string)=>void|Promise<void>;enabled?:boolean};
export const PlaceStackContext=createContext<PlaceStackValue|null>(null);
function Artwork({id,preview=false,label='Place illustration'}:{id:string;preview?:boolean;label?:string}){const art=useCatalogueImage('place',id);return <RemoteImage className="place-stack-image" url={art.image?.url} label={label} allowRetry={!preview} loading={art.loading} error={art.error} onRetry={art.retry} lazy={false}/>;}
export function PlaceStack({selection,bottom=14,fading=false,onOpenChange}:{selection?:PlaceStackValue;bottom?:number;fading?:boolean;onOpenChange?:(open:boolean)=>void}){
 const context=useContext(PlaceStackContext),value=selection??context,ids=validPlaceStack(value?.ids??[]).reverse(),label=value?.kind==='wishlist'?'Wishlist':value?.kind==='visited'?'Visited places':'Saved places';
 const [open,setOpen]=useState(false),[limit,setLimit]=useState(30),[pending,setPending]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const root=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null),panelId=useId(),alive=useRef(true),enabled=value?.enabled!==false;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{onOpenChange?.(open);},[open,onOpenChange]);
 useEffect(()=>()=>onOpenChange?.(false),[onOpenChange]);
 useEffect(()=>{setPending(null);setError('');},[value?.kind]);
 useEffect(()=>{if(!ids.length){setOpen(false);setPending(null);setError('');}},[ids.length]);
 useEffect(()=>{if(!open)return;const dismiss=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node)){setOpen(false);setPending(null);}};document.addEventListener('pointerdown',dismiss);return()=>document.removeEventListener('pointerdown',dismiss);},[open]);
 async function remove(id:string){if(!value||busy)return;if(value.kind==='saved'&&pending!==id){setPending(id);return;}setBusy(true);setError('');try{await value.onRemove(id);if(alive.current)setPending(null);}catch(e){if(alive.current)setError((e as Error).message||'Couldn’t remove this place. Try again.');}finally{if(alive.current)setBusy(false);}}
 if(!ids.length||!enabled)return null;
 return <aside ref={root} className={`place-stack place-stack-transient${fading?' is-fading':''}`} style={{bottom:`calc(${bottom}px + env(safe-area-inset-bottom,0px))`,'--stack-bottom':`${bottom}px`} as CSSProperties} aria-label={label+' collection'} onKeyDown={event=>{if(open&&event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);setPending(null);trigger.current?.focus();}else if(open&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key))event.stopPropagation();}}>
  {open&&<div className="place-stack-panel" id={panelId}><header><strong>{label}</strong><span>{ids.length}</span><button aria-label="Close place collection" onClick={()=>{setOpen(false);trigger.current?.focus();}}><Icon name="close" size={18}/></button></header><div className="place-stack-list" tabIndex={0} aria-label={label+' list'}>{ids.slice(0,limit).map(id=><StackRow key={id} id={id} pending={pending===id} busy={busy} label={label} onKeep={()=>setPending(null)} onRemove={()=>void remove(id)}/>)}{ids.length>limit&&<button className="place-stack-more" onClick={()=>setLimit(n=>n+30)}>More places</button>}</div>{error&&<p role="alert" className="place-stack-error">{error}</p>}<small>{value?.kind==='saved'?'Added while exploring':'Changes save with your list'}</small></div>}
  <button ref={trigger} type="button" className="place-stack-trigger" aria-label={`Review ${label.toLowerCase()}, ${ids.length} ${ids.length===1?'place':'places'}`} aria-expanded={open} aria-controls={open?panelId:undefined} onClick={()=>{setOpen(!open);setLimit(30);setPending(null);setError('');}}><span className="place-stack-previews" aria-hidden="true">{ids.slice(0,3).reverse().map((id,i)=><span className="place-stack-circle" key={id} style={{zIndex:i,marginLeft:i?-29:0}}><Artwork id={id} preview/></span>)}</span><span className="place-stack-count">{ids.length}</span><span className={`place-stack-chevron${open?' expanded':''}`} aria-hidden="true"><Icon name="back" size={14} style={{transform:'rotate(90deg)'}}/></span></button>
 </aside>;
}
function StackRow({id,pending,busy,label,onKeep,onRemove}:{id:string;pending:boolean;busy:boolean;label:string;onKeep:()=>void;onRemove:()=>void}){
 const city=travelCityForPlace(id)!,guide=useCityPlaces(city.id),place=guide.places.find(p=>p.id===id),name=place?.name??attractionById(id)?.name??(guide.loading?'Loading place…':'Saved place');
 return <div className="place-stack-row"><div className={`place-stack-bubble${pending?' confirming':''}`}>{pending?<><strong>Remove this place?</strong><div><button disabled={busy} onClick={onKeep}>Keep</button><button disabled={busy} aria-label={`Confirm remove ${name}`} onClick={onRemove}>{busy?'Removing…':'Remove'}</button></div></>:<><span><strong>{name}</strong><small>{city.city}</small>{guide.error&&<button className="place-stack-retry" onClick={guide.retry}>Retry name</button>}</span><button className="place-stack-remove" disabled={busy} aria-label={`Remove ${name} from ${label.toLowerCase()}`} onClick={onRemove}><Icon name="close" size={17}/></button></>}</div><span className="place-stack-circle"><Artwork id={id} label={`Illustration of ${name}`}/></span></div>;
}
