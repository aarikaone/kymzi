import {publicCdnImage} from '@rymzi/core';
import {AVATARS,type Profile} from '@rymzi/core';
import {Icon} from './icons';
export function ProfileIdentities({profile,onEdit}:{profile:Profile;onEdit:()=>void}){
 const character=AVATARS.find(a=>a.id===profile.avatar)!;
 return <div className="profile-identities" role="group" aria-label="Your avatar"><button className="profile-identity" onClick={onEdit} aria-label="Edit avatar"><span className="profile-identity-art"><img src={publicCdnImage(`/avatars/${profile.avatar}.webp`)} alt={`${character.name} avatar`} draggable="false"/><i aria-hidden="true"><Icon name="palette" size={15}/></i></span></button></div>;
}
