import {palsForPlace,type PlaceFeedItem,type PreviewState} from '@rymzi/core';

type Props={state:PreviewState;place:PlaceFeedItem;onPal:(id:string)=>void};
export function PlacePals({state,place,onPal}:Props) {
  if(state.profile?.ageBand==='10-12')return null;
  const pals=palsForPlace(state,place);
  return <section className="place-city-pals" aria-label={`Roamies in ${place.location.city}`}>
    <header><h2>Roamies in {place.location.city}</h2><span>{pals.length}</span></header>
    {pals.length?<div className="place-local-pals">{pals.map(pal=><button key={pal.id} aria-label={`Open ${pal.alias} in ${pal.city}`} onClick={()=>onPal(pal.id)}>
      <span className={pal.id===place.peerId?'is-author':''}><img src={`/avatars/${pal.imageAvatar}.webp`} alt=""/></span><strong>{pal.alias}</strong>
    </button>)}</div>:<p>No roamies here yet.</p>}
  </section>;
}
