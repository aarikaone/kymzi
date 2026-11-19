import {useEffect,useRef,useState} from 'react';
import {favoritePhotos,type FavoritePhoto,type PreviewState} from '@rymzi/core';
import {Icon} from './icons';
import {AttractionImage} from './AttractionImage';
function Photo({photo}:{photo:FavoritePhoto}){return photo.image?<img src={photo.image} alt={`City scene in ${photo.city}`} loading="lazy"/>:<AttractionImage id={photo.artworkId!}/>;}
export function Favorites({state,now,onToggle,onExplore}:{state:PreviewState;now:Date;onToggle:(id:string)=>void;onExplore:()=>void}){
 const photos=favoritePhotos(state,now),[selected,setSelected]=useState<string|null>(null),photo=photos.find(photo=>photo.id===selected),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(selected&&!photo)setSelected(null);},[selected,photo?.id]);
 useEffect(()=>{if(photo&&!dialog.current?.open)dialog.current?.showModal();else if(!photo&&dialog.current?.open)dialog.current.close();},[photo?.id]);
 return <div className="favorites-page"><header><span className="favorites-kicker">A LITTLE OF EVERYWHERE</span><h1 tabIndex={-1}>Favs<span>♥</span></h1>{!photos.length&&<p>Keep a little of their world.</p>}</header>
  {photos.length?<div className="favorites-grid">{photos.map(photo=><article className="favorite-tile" key={photo.id}><button className="favorite-open" aria-label={`Open favorite photo in ${photo.city}`} onClick={()=>setSelected(photo.id)}><Photo photo={photo}/><span><small>{photo.alias} · {photo.country}</small><strong>{photo.city}</strong></span></button><button className="photo-favorite is-favorite" aria-label={`Remove ${photo.city} photo from favorites`} onClick={()=>onToggle(photo.id)}><Icon name="heart" size={21}/></button></article>)}</div>:<div className="favorites-empty"><span><Icon name="heart" size={57}/><i>↗</i></span><h2>Love a view?<br/><em>Keep it here.</em></h2><p>Tap the heart on any city photo.</p><button className="button" onClick={onExplore}>Explore photos<Icon name="arrow"/></button></div>}
  <dialog className="favorite-viewer" ref={dialog} aria-label="Favorite photo" onCancel={()=>setSelected(null)} onClose={()=>setSelected(null)}>{photo&&<><div className="favorite-viewer-heading"><span><strong>{photo.city}</strong><small>{photo.alias} · {photo.country}</small></span><button className="icon-button" aria-label="Close photo" onClick={()=>setSelected(null)}><Icon name="close"/></button></div><Photo photo={photo}/><button className="favorite-viewer-remove" onClick={()=>{setSelected(null);onToggle(photo.id);}}><Icon name="heart" size={20}/>Remove from Favs</button></>}</dialog>
 </div>;
}
