import {useMemo,useState} from 'react';
import {AVATARS,type AvatarId} from '@rymzi/core';
import {Icon} from './icons';
const FAMILIES=['All','Fuzzy','Critters','Cosmic','Oddballs'];
export function AvatarPicker({value,onDone}:{value:AvatarId;onDone:(id:AvatarId)=>void}){
 const [selected,setSelected]=useState(value),[query,setQuery]=useState(''),[family,setFamily]=useState('All');
 const chosen=AVATARS.find(a=>a.id===selected)!;
 const filtered=useMemo(()=>AVATARS.filter(a=>(family==='All'||a.family===family)&&`${a.name} ${a.tag} ${a.family}`.toLowerCase().includes(query.trim().toLowerCase())),[query,family]);
 return <div className="avatar-picker">
  <div className="avatar-picker-spotlight"><span className="avatar-preview-halo"/><img src={`/avatars/${selected}.webp`} alt={`${chosen.name} character preview`}/><div><h1 tabIndex={-1}>{chosen.name}</h1><p>{chosen.tag}</p></div></div>
  <label className="avatar-search"><Icon name="search" size={20}/><input aria-label="Find a character" placeholder="Find your character…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Clear character search" onClick={()=>setQuery('')}><Icon name="close" size={18}/></button>}</label>
  <div className="avatar-family-filters" role="group" aria-label="Character families">{FAMILIES.map(f=><button key={f} type="button" aria-pressed={family===f} onClick={()=>setFamily(f)}>{f}</button>)}</div>
  <div className="avatar-grid-heading"><span>{filtered.length} {filtered.length===1?'character':'characters'}</span><span>Made for your next adventure</span></div>
  <div className="avatar-character-grid" role="group" aria-label="Choose your character">{filtered.map(a=><button type="button" key={a.id} aria-label={`Choose ${a.name}`} aria-pressed={a.id===selected} onClick={()=>setSelected(a.id)}><span className="avatar-tile-art"><img src={`/avatars/${a.id}.webp`} alt="" loading="lazy" decoding="async" draggable="false"/>{a.id===selected&&<i><Icon name="check" size={12}/></i>}</span><strong>{a.name}</strong></button>)}{!filtered.length&&<div className="avatar-no-results"><Icon name="search" size={28}/><p>No characters found.</p><button className="text-button" onClick={()=>{setQuery('');setFamily('All');}}>See all 44</button></div>}</div>
  <button className="button avatar-use-button" onClick={()=>onDone(selected)}>Use {chosen.name}<Icon name="check" size={20}/></button>
 </div>;
}
