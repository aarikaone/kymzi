import {AVATARS,PROFILE_SETUP_COPY,type Profile} from '@rymzi/core';
import {Icon} from './icons';
type Props={profile:Profile;editing:boolean;busy:boolean;error:string;onAvatar:()=>void;onSave:()=>void};
export function ProfileSetup({profile,editing,busy,error,onAvatar,onSave}:Props){
 const character=AVATARS.find(a=>a.id===profile.avatar)!;
 return <div className="profile-setup">
  <div className="setup-heading"><h1 tabIndex={-1}>{PROFILE_SETUP_COPY.title}</h1><p>Your ID <strong aria-label="Your assigned nickname">#{profile.name}</strong></p></div>
  <div className="setup-avatar-selection"><button type="button" className="setup-avatar-card" aria-label="Change character" onClick={onAvatar} disabled={busy}>
   <span className="setup-avatar-art"><img src={`/avatars/${profile.avatar}.webp`} alt={`${character.name} avatar`} draggable="false"/></span>
   <span className="setup-avatar-action"><Icon name="palette" size={20}/>Choose avatar<Icon name="arrow" size={18}/></span><span className="visually-hidden">{character.name}</span>
  </button></div>
  <div className="setup-footer">{error&&<p role="alert">{error}</p>}<button className="button" disabled={busy} onClick={onSave}>{editing?'Save changes':'Next'}</button></div>
 </div>;
}
