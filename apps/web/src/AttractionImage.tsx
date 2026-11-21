import {useEffect,useState} from 'react';
import {attractionArtwork,attractionById} from '@rymzi/core';
import {Icon} from './icons';
import './attraction-image.css';

type Props={id:string;className?:string;showLoader?:boolean};
export function AttractionImage({id,className='',showLoader=false}:Props) {
  const art=attractionArtwork(id),a=attractionById(id);if(!art||!a)return null;
  return <AttractionFrame key={`${art.file}:${showLoader}`} art={art} name={a.name} className={className} showLoader={showLoader}/>;
}
function AttractionFrame({art,name,className,showLoader}:{art:NonNullable<ReturnType<typeof attractionArtwork>>;name:string;className:string;showLoader:boolean}) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>(showLoader?'loading':'ready');
  useEffect(()=>{if(status!=='loading')return;const timer=setTimeout(()=>setStatus('error'),20000);return()=>clearTimeout(timer);},[status]);
  return <span className={`attraction-image ${showLoader?'has-image-loader':''} ${status==='ready'?'image-ready':''} ${className}`} role="img" aria-label={status==='error'?`Illustration unavailable: ${name}`:`Illustration of ${name}`} aria-busy={showLoader?status==='loading':undefined}>
    <svg width="100%" height="100%" viewBox={`${art.column*512} ${art.row*384} 512 384`} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={`/attractions/${art.file}.webp`} width="1024" height="1536" onLoad={()=>setStatus('ready')} onError={()=>{if(showLoader)setStatus('error');}}/></svg>
    {status==='loading'&&<span className="artwork-loading-cover" aria-hidden="true"><i/></span>}
    {status==='error'&&<span className="artwork-loading-cover artwork-unavailable" aria-hidden="true"><Icon name="globe" size={22}/></span>}
  </span>;
}
