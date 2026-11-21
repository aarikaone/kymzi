import {publicCdnImage} from '@rymzi/core';
import {JOURNEY_COPY} from '@rymzi/core';
import { availableCategories, remainingDailyPlays, type AgeBand, type DailyGame, type PlayCategoryId } from '@rymzi/core';
import { Icon } from './icons';
export function CategoryPicker({band,game,now,onSelect}:{band:AgeBand;game:DailyGame;now:Date;onSelect:(id:PlayCategoryId)=>void}){
  return <><div className="category-intro"><span className="eyebrow">{remainingDailyPlays(game,now)} PLAYS LEFT TODAY</span><h1 tabIndex={-1}>Pick a topic.</h1><p className="flow-note">{band==='10-12'?'3 answers to your next city.':JOURNEY_COPY.topicHint}</p></div><div className="category-grid" aria-label="Choose a category">{availableCategories(band).map(category=><button key={category.id} className="category-tile" style={{backgroundColor:'#141B15'}} onClick={()=>onSelect(category.id)} aria-label={`Choose ${category.name}`}><img src={publicCdnImage(`/categories/${category.id}.webp`)} alt="" draggable="false"/><span className="category-tile-label">{category.name}<Icon name="arrow" size={16}/></span></button>)}</div></>;
}
