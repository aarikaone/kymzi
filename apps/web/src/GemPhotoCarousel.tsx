import {useState} from 'react';
import type {PlacePhoto} from '@rymzi/core';
import {RemoteImage} from './RemoteImage';
import {WishPhotoGallery} from './WishPhotoGallery';
import './gem-photo-carousel.css';
export function GemPhotoCarousel({photos,name,city}:{photos:readonly PlacePhoto[];name:string;city:string}){
 const [active,setActive]=useState(0),[open,setOpen]=useState<number|null>(null);
 return <div className="gem-photo-carousel" role="region" aria-label={`${name} photos`}><div className="gem-photo-track" onScroll={e=>{const el=e.currentTarget;if(el.clientWidth)setActive(Math.max(0,Math.min(photos.length-1,Math.round(el.scrollLeft/el.clientWidth))));}}>{photos.map((photo,i)=><button key={photo.id} type="button" aria-label={`View ${name} photo ${i+1}`} onClick={()=>setOpen(i)}><RemoteImage url={photo.image} label={`${name} photo ${i+1}`} lazy={i>1} allowRetry={false}/></button>)}</div>{photos.length>1&&<><span className="gem-carousel-count" aria-label={`Photo ${active+1} of ${photos.length}`}>{active+1}/{photos.length}</span><div className="gem-carousel-dots" aria-hidden="true">{photos.map((p,i)=><i key={p.id} className={i===active?'active':''}/>)}</div></>}{open!==null&&<WishPhotoGallery photos={photos} title={name} subtitle={city} eyebrow="HIDDEN GEM" fullScreen initialIndex={open} onClose={()=>setOpen(null)}/>}</div>;
}
