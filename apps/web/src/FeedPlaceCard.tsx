import {GemPhotoCarousel} from './GemPhotoCarousel';
import {publicCdnImage} from '@rymzi/core';
import {useState,type ReactNode} from 'react';
import {isPlaceFavorite,palFor,placeCategory,receivedPlaceFavs,type PreviewState,type PlaceFeedItem} from '@rymzi/core';
import {PlaceFavoriteButton,PlaceFavoriteBurst} from './PlaceFavorite';
import {Icon} from './icons';
import './feed-cards.css';
type Props={place:PlaceFeedItem;state:PreviewState;art:ReactNode;onFavorite:(id:string)=>void;onOpen:(id:string)=>void;onPal?:(id:string)=>void};
export function FeedPlaceCard({place,state,art,onFavorite,onOpen,onPal}:Props){
 const [burst,setBurst]=useState(0),saved=isPlaceFavorite(state,place.id),pal=place.peerId?palFor(state,place.peerId):null,avatar=pal?.imageAvatar??place.authorAvatar??(place.you?state.profile?.avatar:undefined),author=place.you?'You shared':`${place.alias}’s find`,checkin=!place.maps;
 const identity=<>{avatar&&<img src={publicCdnImage(`/avatars/${avatar}.webp`)} alt=""/>}<span><strong>{checkin?(place.you?'You':place.alias):author}</strong><small>{place.location.city}</small></span></>;
 const favorite=<PlaceFavoriteButton id={place.id} name={place.name} saved={saved} onFavorite={onFavorite} onSaved={()=>setBurst(n=>n+1)}/>;
 if(checkin)return <article className="feed-checkin" data-feed-kind="check-in" aria-label={`${place.alias} · ${place.name} · ${place.location.city}`}>
  <span className="feed-checkin-rail" aria-hidden="true"><Icon name="pin" size={19}/><i/></span>
  <div className="feed-checkin-content"><div className="feed-event-label"><span>CHECKED IN</span><time dateTime={place.checkedInAt}>{new Date(place.checkedInAt).toLocaleDateString('en',{month:'short',day:'numeric'})}</time></div>
   <button className="feed-checkin-place" onClick={()=>onOpen(place.id)} aria-label={`Explore ${place.name}, ${place.location.city}`}><span><h2 className="page-heading">{place.name}</h2><small>{place.location.city} · {placeCategory(place.categoryId)!.label}</small></span><span className="feed-checkin-thumb">{art}<PlaceFavoriteBurst token={saved?burst:0}/></span></button>
   {place.tip&&<p className="feed-checkin-tip">{place.tip}</p>}
   <div className="feed-checkin-bottom"><span>{avatar&&<img src={publicCdnImage(`/avatars/${avatar}.webp`)} alt=""/>}{place.you?'You':place.alias}</span>{favorite}</div>
  </div>
 </article>;
 return <article className="feed-gem" data-feed-kind="gem" aria-label={`${place.alias} · ${place.name} · ${place.location.city}`}>
  <header>{pal&&onPal?<button className="feed-author" onClick={()=>onPal(pal.id)}>{identity}</button>:<span className="feed-author">{identity}</span>}<span className="feed-gem-label"><Icon name="spark" size={13}/>SHARED GEM</span></header>
  <div className="feed-gem-cover">{place.photos?.length?<GemPhotoCarousel photos={place.photos} name={place.name} city={place.location.city}/>:<button className="gem-cover-open" onClick={()=>onOpen(place.id)} aria-label={`Explore ${place.name}, ${place.location.city}`}>{art}</button>}<PlaceFavoriteBurst token={saved?burst:0}/></div>
  <div className="feed-gem-caption"><div><h2 className="page-heading">{place.photos?.length?<button className="gem-place-open" onClick={()=>onOpen(place.id)} aria-label={`Explore ${place.name}, ${place.location.city}`}>{place.name}</button>:place.name}</h2><small>{placeCategory(place.categoryId)!.label}</small></div>{favorite}</div>
  {place.tip&&<p className="feed-gem-tip">{place.tip}</p>}
  {(place.preview||place.you)&&<footer>{place.preview&&<small>Illustrated preview</small>}{place.you&&<small aria-label={`${receivedPlaceFavs(state,place.id)} favourites received`}>{receivedPlaceFavs(state,place.id)} saves</small>}</footer>}
 </article>;
}
