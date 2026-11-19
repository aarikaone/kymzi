import {AVATARS,type Profile} from '@rymzi/core';
import {Icon} from './icons';

export function ProfileIdentities({profile,onEdit}:{profile:Profile;onEdit:()=>void}){
 const character=AVATARS.find(a=>a.id===profile.avatar)!,privateOnly=profile.ageBand==='10-12';
 return <div className="profile-identities" role="group" aria-label="Your two avatars">
  <button className="profile-identity anonymous" onClick={onEdit} aria-label="Edit anonymous character">
   <span className="profile-identity-art"><img src={`/avatars/${profile.avatar}.webp`} alt={`${character.name} anonymous character`} draggable="false"/><i aria-hidden="true"><Icon name="shield" size={15}/></i></span>
   <strong>Anonymous</strong><small>{privateOnly?'Only you':'Always visible'}</small>
  </button>
  <button className={`profile-identity personal ${profile.photo?'has-photo':''}`} onClick={onEdit} aria-label={profile.photo?'Edit my avatar':'Add my avatar'}>
   <span className="profile-identity-art">{profile.photo?<img src={profile.photo.image} alt="Your personal avatar" draggable="false"/>:<Icon name="user" size={40}/>}<i aria-hidden="true"><Icon name={profile.photo?'camera':'plus'} size={15}/></i></span>
   <strong>My avatar</strong><small>{profile.photo?(privateOnly?'Only you':'Reveals at 3 matches'):'Add your photo'}</small>
  </button>
 </div>;
}
