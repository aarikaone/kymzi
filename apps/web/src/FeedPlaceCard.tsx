import {useState,type ReactNode} from 'react';
import {isPlaceFavorite,palFor,placeCategory,receivedPlaceFavs,type PreviewState,type PlaceFeedItem} from '@rymzi/core';
import {PlaceFavoriteButton,PlaceFavoriteBurst} from './PlaceFavorite';
import {Icon} from './icons';
import './feed-cards.css';
type Props={place:PlaceFeedItem;state:PreviewState;art:ReactNode;onFavorite:(id:string)=>void;onOpen:(id:string)=>void;onPal?:(id:string)=>void};
export function FeedPlaceCard({place,state,art,onFavorite,onOpen,onPal}:Props){
 const [burst,setBurst]=useState(0),saved=isPlaceFavorite(state,place.id),pal=place.peerId?palFor(state,place.peerId):null,avatar=pal?.imageAvatar??place.authorAvatar??(place.you?state.profile?.avatar:undefined),author=place.you?'You shared':`${place.alias}’s find`,checkin=!place.maps;
 const identity=<>{avatar&&<img src={`/avatars/${avatar}.webp`} alt=""/>}<span><strong>{checkin?(place.you?'You':place.alias):author}</strong><small>{place.location.city}</small></span></>;
 const favorite=<PlaceFavoriteButton id={place.id} name={place.name} saved={saved} onFavorite={onFavorite} onSaved={()=>setBurst(n=>n+1)}/>;
 if(checkin)return <article className="feed-checkin" data-feed-kind="check-in" aria-label={`${place.alias} · ${place.name} · ${place.location.city}`}>
  <span className="feed-checkin-rail" aria-hidden="true"><Icon name="pin" size={19}/><i/></span>
  <div className="feed-checkin-content"><div className="feed-event-label"><span>CHECKED IN</span><time dateTime={place.checkedInAt}>{new Date(place.checkedInAt).toLocaleDateString('en',{month:'short',day:'numeric'})}</time></div>
   <button className="feed-checkin-place" onClick={()=>onOpen(place.id)} aria-label={`Explore ${place.name}, ${place.location.city}`}><span><h2>{place.name}</h2><small>{place.location.city} · {placeCategory(place.categoryId)!.label}</small></span><span className="feed-checkin-thumb">{art}<PlaceFavoriteBurst token={saved?burst:0}/></span></button>
   {place.tip&&<p className="feed-checkin-tip">{place.tip}</p>}
   <div className="feed-checkin-bottom"><span>{avatar&&<img src={`/avatars/${avatar}.webp`} alt=""/>}{place.you?'You':place.alias}</span>{favorite}</div>
  </div>
 </article>;
 return <article className="feed-gem" data-feed-kind="gem" aria-label={`${place.alias} · ${place.name} · ${place.location.city}`}>
  <header>{pal&&onPal?<button className="feed-author" onClick={()=>onPal(pal.id)}>{identity}</button>:<span className="feed-author">{identity}</span>}<span className="feed-gem-label"><Icon name="spark" size={13}/>SHARED GEM</span></header>
  <button className="feed-gem-cover" onClick={()=>onOpen(place.id)} aria-label={`Explore ${place.name}, ${place.location.city}`}>{art}<PlaceFavoriteBurst token={saved?burst:0}/></button>
  <div className="feed-gem-caption"><div><h2>{place.name}</h2><small>{placeCategory(place.categoryId)!.label}</small></div>{favorite}</div>
  {place.tip&&<p className="feed-gem-tip">{place.tip}</p>}
  {(place.preview||place.you)&&<footer>{place.preview&&<small>Illustrated preview</small>}{place.you&&<small aria-label={`${receivedPlaceFavs(state,place.id)} favourites received`}>{receivedPlaceFavs(state,place.id)} saves</small>}</footer>}
 </article>;
}
