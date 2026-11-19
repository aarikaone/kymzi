import {JOURNEY_COPY} from '@rymzi/core';
import {useState} from 'react';
import {palUpdates,isAdult,countryById,type PreviewState,type PalUpdate} from '@rymzi/core';
import {Icon} from './icons';
import {AttractionImage} from './AttractionImage';

function UpdateArt({note}:{note:PalUpdate}){
  if(note.artworkId)return <span className="update-photo-stack" aria-hidden="true"><i/><i/><span className="update-photo-front"><AttractionImage id={note.artworkId}/></span><span className="update-art-badge"><Icon name="camera" size={12}/></span></span>;
  return <span className="update-visit-art" aria-hidden="true"><span>{countryById(note.countryId)!.code}</span><Icon name={note.kind==='check-in'?'pin':note.kind==='meetup'?'people':'plane'} size={25}/><i/></span>;
}
const kindName=(note:PalUpdate)=>note.kind==='photo'?'Photo drop':note.kind==='visit'?'Travel update':note.kind==='check-in'?'Check-in':'Meetup';

export function HomePalPreview({state,now,onOpen}:{state:PreviewState;now:Date;onOpen:(n:PalUpdate)=>void}){
  const note=palUpdates(state,now).find(n=>!n.read&&!n.id.startsWith('local:'));
  if(!note)return null;
  return <button className="home-pal-preview update-preview-card" aria-label={`Open update: ${note.title}`} onClick={()=>onOpen(note)}>
    <UpdateArt note={note}/><span className="update-preview-copy"><span className="update-preview-kicker"><i/>{JOURNEY_COPY.updates} </span><strong>{note.title}</strong></span><span className="update-preview-arrow"><Icon name="arrow" size={17}/></span>
  </button>;
}

export function PalUpdatesInbox({state,now,onOpen,onRead}:{state:PreviewState;now:Date;onOpen:(n:PalUpdate)=>void;onRead:()=>void}){
  const [tab,setTab]=useState('all'),notes=palUpdates(state,now),visible=notes.filter(n=>tab==='all'||(tab==='photos'?n.kind==='photo':n.kind!=='photo'));
  return <div className="pal-inbox update-inbox"><div className="explore-heading"><h1 tabIndex={-1}>City updates.</h1>{notes.some(n=>!n.read)&&<button className="inbox-read" onClick={onRead}><Icon name="check" size={15}/><span>Mark all read</span></button>}</div>
    <div className="update-filters" role="group" aria-label="Update filters">{[{id:'all',name:'All',icon:'bell'},{id:'photos',name:'Photos',icon:'camera'},...(isAdult(state.profile!.ageBand)?[{id:'visits',name:'Visits',icon:'plane'}]:[])].map(t=><button key={t.id} aria-pressed={tab===t.id} onClick={()=>setTab(t.id)}><Icon name={t.icon} size={16}/>{t.name}</button>)}</div>
    <div className="pal-inbox-list">{visible.map(note=><button key={note.id} className={`pal-update-item update-message-card ${note.read?'':'unread'}`} onClick={()=>onOpen(note)} aria-label={`Open update: ${note.title}`}>
      <UpdateArt note={note}/><span className="pal-update-text"><small className="update-message-kind">{kindName(note)} </small><strong>{note.title}</strong><span className="update-message-city">{countryById(note.countryId)!.flag} {countryById(note.countryId)!.city}</span><span className="update-message-detail">{note.detail}</span></span>{!note.read&&<i className="pal-unread-dot"/>}<span className="update-message-arrow"><Icon name="arrow" size={16}/></span>
    </button>)}{!visible.length&&<div className="visits-empty"><Icon name="bell" size={53}/><h2>You’re up to date.</h2></div>}</div><p className="small center">Updates stay on this device</p>
  </div>;
}
