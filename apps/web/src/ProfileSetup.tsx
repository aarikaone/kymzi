import {useEffect,useRef,useState} from 'react';
import {publicCdnImage,AVATARS,PROFILE_SETUP_COPY,type Profile,type PreviewState} from '@rymzi/core';
import {useUsernameAvailability} from '../../../packages/shared/useUsernameAvailability';
import {prepareProfilePhoto} from './profilePhoto';
import {RemoteImage} from './RemoteImage';
import {Icon} from './icons';
type Props={profile:Profile;state:PreviewState;editing:boolean;busy:boolean;error:string;onChange:(profile:Profile)=>void;onAvatar:()=>void;onSave:()=>void};
export function ProfileSetup({profile,state,editing,busy,error,onChange,onAvatar,onSave}:Props){
 const character=AVATARS.find(a=>a.id===profile.avatar)!,availability=useUsernameAvailability(profile.username??'',profile.name,state),[photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState(''),input=useRef<HTMLInputElement>(null),alive=useRef(true),latest=useRef(profile);latest.current=profile;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const canSave=availability.available&&profile.age13Confirmed===true&&profile.ageBand!=='10-12'&&!busy&&!photoBusy;
 async function pick(file?:File){if(!file||photoBusy||busy)return;setPhotoBusy(true);setPhotoError('');try{const photo=await prepareProfilePhoto(file,profile.ageBand);if(alive.current)onChange({...latest.current,avatarPhoto:photo});}catch(e){if(alive.current)setPhotoError((e as Error).message);}finally{if(alive.current)setPhotoBusy(false);}}
 return <form className={'profile-setup public-profile-setup'+(editing?' is-editing':'')} onSubmit={e=>{e.preventDefault();if(canSave)onSave();}}>
  <div className="identity-form-body">
   {!editing&&<div className="setup-heading"><h1 className="page-heading" tabIndex={-1}>{PROFILE_SETUP_COPY.title}</h1></div>}
   <div className="public-profile-image"><button type="button" className={'public-avatar-preview'+(profile.avatarPhoto?' has-photo':'')} aria-label="Change character" onClick={onAvatar} disabled={busy||photoBusy}>{profile.avatarPhoto?<RemoteImage url={profile.avatarPhoto.image} label="Your profile photo" lazy={false} allowRetry={false}/>:<RemoteImage url={publicCdnImage(`/avatars/${profile.avatar}.webp`)} label={`${character.name} avatar`} lazy={false} allowRetry={false}/>}<i aria-hidden="true"><Icon name="palette" size={15}/></i></button><div className="public-avatar-actions"><button type="button" onClick={onAvatar} disabled={busy||photoBusy}><Icon name="palette" size={16}/>Choose avatar</button><button type="button" onClick={()=>input.current?.click()} disabled={busy||photoBusy||profile.ageBand==='10-12'}><Icon name="camera" size={16}/>{photoBusy?'Preparing…':profile.avatarPhoto?'Change photo':'Upload photo'}</button></div><input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" aria-label="Upload profile photo" hidden onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void pick(file);}}/></div>
   <div className="username-field"><label htmlFor="profile-username">Username</label><div className={'username-input is-'+availability.status}><span aria-hidden="true">@</span><input id="profile-username" aria-describedby="username-availability" value={profile.username??''} onChange={e=>onChange({...profile,username:e.target.value.replace(/^@/,'')})} placeholder="yourname" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={20} disabled={busy||photoBusy}/>{availability.status==='checking'?<i className="username-checking" aria-hidden="true"/>:availability.available?<span className="username-ready" aria-hidden="true"><Icon name="check" size={18}/></span>:null}</div><p id="username-availability" role="status" className={'username-status is-'+availability.status}>{availability.message}</p></div>
   <label className="profile-age-consent"><input type="checkbox" checked={profile.age13Confirmed===true} disabled={busy||photoBusy||profile.ageBand==='10-12'} onChange={e=>onChange({...profile,age13Confirmed:e.target.checked})}/><span aria-hidden="true"><Icon name="check" size={16}/></span><strong>I’m 13 or older.</strong></label>
   {profile.ageBand==='10-12'&&<p className="profile-identity-error" role="alert">You must be 13 or older to create a public profile.</p>}
  </div>
  <div className="setup-footer">{(photoError||error)&&<p role="alert">{photoError||error}</p>}<button type="submit" className="button" disabled={!canSave}>{busy?'Saving…':editing?'Save changes':'Next'}</button></div>
 </form>;
}
