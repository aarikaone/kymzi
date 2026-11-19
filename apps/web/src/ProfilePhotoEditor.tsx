import {useEffect,useRef,useState} from 'react';
import type {AgeBand,ProfilePhoto} from '@rymzi/core';
import {prepareProfilePhoto} from './profilePhoto';
import {Icon} from './icons';
export function ProfilePhotoEditor({value,band,onChange,onBusy}:{value?:ProfilePhoto;band:AgeBand;onChange:(photo:ProfilePhoto|undefined)=>void;onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),input=useRef<HTMLInputElement>(null),operation=useRef(0),latestBand=useRef(band);latestBand.current=band;
 useEffect(()=>()=>{operation.current++;onBusy(false);},[]);
 async function pick(file?:File){if(!file)return;const token=++operation.current;setBusy(true);onBusy(true);setError('');try{const photo=await prepareProfilePhoto(file,band);if(token===operation.current&&band===latestBand.current)onChange(photo);}catch(e){if(token===operation.current)setError((e as Error).message);}finally{if(token===operation.current){setBusy(false);onBusy(false);}}}
 return <div className="setup-identity">
  <button type="button" className="setup-portrait personal" disabled={busy} aria-label={value?'Replace photo':'Add photo'} onClick={()=>input.current?.click()}>
   {value?<img src={value.image} alt="Your private profile photo preview"/>:<><Icon name="user" size={42}/><span>{busy?'Preparing…':'Add photo'}</span></>}
   <span className="setup-portrait-action" aria-hidden="true"><Icon name="camera" size={18}/></span>
  </button>
  {value&&<button type="button" className="setup-photo-remove" disabled={busy} aria-label="Remove photo" onClick={()=>{setError('');onChange(undefined);}}><Icon name="close" size={18}/></button>}
  <strong>Real photo</strong><small>Optional · On this device</small>
  <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" aria-label="Upload profile photo" className="visually-hidden" tabIndex={-1} disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';void pick(file);}}/>
  {error&&<p role="alert" className="setup-photo-error">{error}</p>}
 </div>;
}
