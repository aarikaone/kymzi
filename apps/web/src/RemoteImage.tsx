import {useEffect,useRef,useState,type ReactNode} from 'react';
import './attraction-image.css';

type Props={url?:string;label:string;unavailableLabel?:string;className?:string;loading?:boolean;error?:boolean;onRetry?:()=>void;placeholder?:ReactNode;showLoader?:boolean;lazy?:boolean};
const IMAGE_TIMEOUT_MS=15000;
export function RemoteImage(props:Props){
 const [attempt,setAttempt]=useState(0);
 // A new request gets fresh state before its load event; no effect resets a cached success.
 return <ImageAttempt key={`${props.url??'metadata'}:${attempt}`} {...props} onRetry={()=>{props.onRetry?.();setAttempt(value=>value+1);}}/>;
}
function ImageAttempt({url,label,unavailableLabel,className='',loading=false,error=false,onRetry,placeholder,showLoader=true,lazy=true}:Props){
 const frame=useRef<HTMLSpanElement>(null),bitmap=useRef<HTMLImageElement>(null);
 const [visible,setVisible]=useState(()=>!lazy||typeof IntersectionObserver==='undefined');
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  if(visible||!frame.current)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'200px 0px'});
  observer.observe(frame.current);return()=>observer.disconnect();
 },[visible]);
 useEffect(()=>{
  if(!url||!visible||status!=='loading')return;
  // Cached images can complete before React attaches a load listener.
  if(bitmap.current?.complete&&bitmap.current.naturalWidth>0){setStatus('ready');return;}
  let alive=true;
  // Decode completion is reliable even if a cached image's load event was missed.
  const image=bitmap.current;
  if(image&&typeof image.decode==='function')void image.decode().then(()=>{if(alive&&image.naturalWidth>0)setStatus('ready');},()=>{});
  const timer=setTimeout(()=>setStatus(bitmap.current?.complete&&bitmap.current.naturalWidth>0?'ready':'error'),IMAGE_TIMEOUT_MS);
  return()=>{alive=false;clearTimeout(timer);};
 },[url,visible,status]);
 const failed=error||status==='error',busy=!failed&&(loading||!!url&&visible&&status==='loading'),ready=!failed&&(!url&&!loading||status==='ready');
 return <span ref={frame} className={`remote-image-frame ${className} ${showLoader?'has-image-loader':''} ${ready?'image-ready':''}`} role="img" aria-label={failed?unavailableLabel??label:label} aria-busy={busy}>
  {url&&visible&&!failed?<img ref={bitmap} className="remote-bitmap" src={url} alt="" loading="eager" decoding="async" onLoad={()=>setStatus('ready')} onError={()=>setStatus('error')}/>:placeholder}
  {busy&&showLoader&&<span className="artwork-loading-cover" aria-hidden="true"><i/></span>}
  {failed&&<button type="button" className="artwork-loading-cover artwork-unavailable" aria-label={`Retry image: ${label}`} onClick={event=>{event.stopPropagation();onRetry?.();}}>↻</button>}
 </span>;
}
