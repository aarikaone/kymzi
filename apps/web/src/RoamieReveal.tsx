import {publicCdnImage} from '@rymzi/core';
import {attractionsForCountry,canUseCityBoard,countryById,dayCardPicks,latestPlayConnections,palFor,playCountry,type CountryId,type PreviewState} from '@rymzi/core';
import {AttractionImage} from './AttractionImage';
import {Icon} from './icons';
import './roamie-reveal.css';

type Props={
  state:PreviewState;
  onPal?:(id:string)=>void;
  onCountry:(id:CountryId)=>void;
  onBoard:(id:CountryId)=>void;
  onAttraction:(id:string)=>void;
  onPhotos:(id:CountryId)=>void;
  onPlan:(id:CountryId)=>void;
};

export function RoamieReveal({state,onPal,onCountry,onAttraction,onPhotos,onPlan}:Props){
  const found=latestPlayConnections(state.social,state.daily,state.profile!.ageBand,state.blocked);
  const connection=found[0],country=countryById(connection?.countryId??playCountry(state.daily))!;
  const pal=connection?palFor(state,connection.peer.id):undefined;
  const privateOnly=state.profile?.ageBand==='10-12',places=attractionsForCountry(country.id);
  const ids=state.daily.lastQuestionIds,picks=dayCardPicks(ids,ids.map(id=>state.answers[id]??''));
  const openPal=()=>onPal&&connection?onPal(connection.peer.id):onPhotos(country.id);
  const cityPreview=<>
    <AttractionImage id={places[0].id} showLoader/>
    <span className="reveal-city-copy"><small>{privateOnly?'YOUR NEW CITY':'THEIR CITY'}</small><strong>{country.city}</strong><span>{country.flag} {country.name}</span></span>
    {!privateOnly&&<Icon name="arrow" size={20}/>}
  </>;

  return <div className="roamie-reveal">
    <div className="reveal-body">
      <header className="reveal-heading">
        <span className="reveal-status"><Icon name={privateOnly?'globe':'check'} size={14}/>{privateOnly?'Virtual city':'3/3 answers matched'}</span>
        <h1 tabIndex={-1}>{privateOnly?`${country.city}.`:'You found a roamie.'}</h1>
      </header>

      {!privateOnly&&<section className="reveal-person" aria-label="Your new roamie">
        <span className="reveal-character"><img src={publicCdnImage(`/avatars/${pal?.imageAvatar??'cloud'}.webp`)} alt="Your roamie’s character"/></span>
        <div><small>A NEW CONNECTION</small><h2>{pal?.alias??'Your roamie'}</h2><span className="reveal-private"><Icon name="lock" size={13}/>Identity private</span></div>
        <Icon name="spark" size={20} className="reveal-person-spark"/>
      </section>}

      {picks.length===3&&<section className="reveal-common" aria-label={privateOnly?'Your kind of day':'Your shared kind of day'}>
        <h2>{privateOnly?'Your kind of day':'You both picked'}</h2>
        <ul>{picks.map(p=><li key={p.id}><Icon name="check" size={12}/>{p.label}</li>)}</ul>
      </section>}

      <section className="reveal-destination" aria-label={privateOnly?'Your new city':'Their city'}>
        {privateOnly?<div className="reveal-city-preview">{cityPreview}</div>:<button className="reveal-city-preview" aria-label={`Explore ${country.city}`} onClick={()=>onCountry(country.id)}>{cityPreview}</button>}
        <div className="reveal-place-links" aria-label="Places to discover">
          {places.slice(0,2).map(a=><button key={a.id} aria-label={`Discover ${a.name}`} onClick={()=>onAttraction(a.id)}><span>{a.name}</span><Icon name="arrow" size={16}/></button>)}
        </div>
      </section>
    </div>

    <footer className="reveal-actions">
      <button className="reveal-primary" onClick={privateOnly?()=>onCountry(country.id):openPal}>{privateOnly?`Explore ${country.city}`:'Meet my roamie'}<Icon name="arrow" size={21}/></button>
      {canUseCityBoard(state,country.id)&&<button className="reveal-plan" onClick={()=>onPlan(country.id)}><Icon name="calendar" size={17}/>Plan a visit</button>}
    </footer>
  </div>;
}
