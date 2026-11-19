import {AVATARS,PROFILE_SETUP_COPY,type Profile,type ProfilePhoto} from '@rymzi/core';
import {Icon} from './icons';
import {ProfilePhotoEditor} from './ProfilePhotoEditor';

type Props={profile:Profile;editing:boolean;busy:boolean;error:string;onAvatar:()=>void;onLocation:(field:'city'|'country',value:string)=>void;onPhoto:(photo:ProfilePhoto|undefined)=>void;onBusy:(busy:boolean)=>void;onSave:()=>void};
export function ProfileSetup({profile,editing,busy,error,onAvatar,onLocation,onPhoto,onBusy,onSave}:Props){
 const character=AVATARS.find(a=>a.id===profile.avatar)!,privateOnly=profile.ageBand==='10-12';
 return <div className="profile-setup">
  <div className="setup-heading"><h1 tabIndex={-1}>{PROFILE_SETUP_COPY.title}</h1><p>Your number <strong aria-label="Your assigned nickname">#{profile.name}</strong></p></div>
  <div className="setup-identities" role="group" aria-label="Your character and real photo">
   <div className="setup-identity">
    <button type="button" className="setup-portrait anonymous" aria-label="Change character" onClick={onAvatar}>
     <img src={`/avatars/${profile.avatar}.webp`} alt={`${character.name} anonymous character`} draggable="false"/>
     <span className="setup-portrait-action" aria-hidden="true"><Icon name="palette" size={19}/></span>
     <span className="visually-hidden">{character.name}</span>
    </button>
    <strong>Anonymous</strong><small>{privateOnly?'Only you':'Shown first'}</small>
   </div>
   <ProfilePhotoEditor value={profile.photo?.ageBand===profile.ageBand?profile.photo:undefined} band={profile.ageBand} onChange={onPhoto} onBusy={onBusy}/>
  </div>
  <div className="setup-reveal"><Icon name={privateOnly?'shield':'lock'} size={20}/><p><strong>{privateOnly?'Only you can see this.':PROFILE_SETUP_COPY.revealTitle}</strong><span>{privateOnly?'Your profile stays private.':PROFILE_SETUP_COPY.revealDetail}</span></p></div>
  <div className="setup-location">
   <label htmlFor="profile-city">City<input id="profile-city" value={profile.city??''} onChange={event=>onLocation('city',event.target.value)} placeholder="Your city" autoComplete="address-level2" maxLength={60}/></label>
   <label htmlFor="profile-country">Country<input id="profile-country" value={profile.country??''} onChange={event=>onLocation('country',event.target.value)} placeholder="Your country" autoComplete="country-name" maxLength={60}/></label>
  </div>
  <div className="setup-footer">{error&&<p role="alert">{error}</p>}<button className="button" disabled={busy} onClick={onSave}>{editing?'Save changes':'Let’s go'}</button></div>
 </div>;
}
