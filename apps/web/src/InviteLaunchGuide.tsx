import {publicCdnImage,type Profile} from '@rymzi/core';
import {INVITE_LAUNCH_STEPS} from '../../../packages/shared/inviteLaunchFlow';
import {BottleIcon} from './PostcardBottle';
import {Icon} from './icons';
import './invite-launch-guide.css';
export function InviteLaunchGuide({profile}:{profile:Profile}){
 const other=profile.avatar==='sprout'?'cloud':'sprout';
 return <section className="invite-launch-guide" aria-label="Start exploring with friends"><h1>Meet Roamies<br/><em>worldwide.</em></h1><ol aria-label="How global play works">{INVITE_LAUNCH_STEPS.map(step=><li key={step.id}><span className={'invite-flow-art is-'+step.id} aria-hidden="true">{step.id==='friends'?<><Icon name="people" size={29}/><b>5</b></>:step.id==='world'?<><Icon name="globe" size={33}/><i><Icon name="lock" size={11}/></i></>:step.id==='bottle'?<BottleIcon/>:<><img src={profile.avatarPhoto?.image??publicCdnImage('/avatars/'+profile.avatar+'.webp')} className={profile.avatarPhoto?'has-photo':''} alt=""/><img src={publicCdnImage('/avatars/'+other+'.webp')} alt=""/><i><Icon name="link" size={11}/></i></>}</span><div><h2>{step.title}</h2>{step.detail&&<p>{step.detail}</p>}</div></li>)}</ol></section>;
}
