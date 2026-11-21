import type {ReactNode} from 'react';
import {PlaceFavoriteButton} from './PlaceFavorite';
import {Icon} from './icons';
import './place-page.css';

type Props={children:ReactNode;id:string;name:string;saved:boolean;onFavorite:(id:string)=>void;onShare:()=>void;shareLabel?:string};

export function PlacePage({children,id,name,saved,onFavorite,onShare,shareLabel}:Props) {
  return <div className="place-detail-page">
    <div className="place-page place-detail-content">{children}</div>
    <footer className="place-action-dock" role="group" aria-label="Place actions">
      <div><PlaceFavoriteButton variant="primary" compact id={id} name={name} saved={saved} onFavorite={onFavorite}/></div>
      <button className="place-action-share" aria-label={shareLabel??"Share a place"} onClick={onShare}><Icon name="share" size={19}/>{shareLabel??'Share'}</button>
    </footer>
  </div>;
}
