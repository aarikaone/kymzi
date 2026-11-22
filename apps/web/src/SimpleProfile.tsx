import {useId,useState,type ReactNode} from 'react';
import {invitedFriends,readTravelProfile,profileDisplayName,palFindingProgress,type PreviewState} from '@rymzi/core';
import {ProfileIdentities} from './ProfileIdentities';
import {ClearLocalData} from './ClearLocalData';
import {Icon} from './icons';
import './simple-profile.css';
export type ProfileMenuItem={label:string;icon:string;onClick:()=>void};
type Props={state:PreviewState;onEdit:()=>void;items:ProfileMenuItem[];travel?:ReactNode;onTravel?:()=>void;roamies?:ReactNode;onInvite?:()=>void;onFeed?:()=>void;onClear?:()=>void|Promise<void>};
function MenuGlyph({name}:{name:string}){return <i className="profile-menu-glyph"><Icon name={name} size={18}/></i>;}
function ProfileDrawer({label,icon,children}:{label:string;icon:string;children:ReactNode}){
 const [open,setOpen]=useState(false),id=useId();return <div className="simple-profile-drawer"><button className="simple-profile-row" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><MenuGlyph name={icon}/><span>{label}</span><Icon name="back" size={16} className={open?'profile-drawer-up':'profile-drawer-down'}/></button><div id={id} hidden={!open}>{open&&<div className="simple-profile-detail">{children}</div>}</div></div>;
}
export function SimpleProfile({state,onEdit,items,travel,onTravel,roamies,onInvite,onFeed,onClear}:Props){
 const profile=state.profile!,circle=palFindingProgress(state),friends=invitedFriends(state).length,cities=readTravelProfile(profile.travel).visited.length;
 return <div className="simple-profile"><header className="simple-profile-identity"><ProfileIdentities profile={profile} onEdit={onEdit}/><div className="profile-identity-copy"><h1 className="page-heading" tabIndex={-1} title={profileDisplayName(profile)}>{profileDisplayName(profile)}</h1><div className="profile-identity-facts"><span><Icon name="people" size={13}/>{friends} {friends===1?'friend':'friends'}</span><i/><span><Icon name="globe" size={13}/>{cities} {cities===1?'city':'cities'} visited</span></div><button className="profile-edit-pill" onClick={onEdit}>Edit profile<Icon name="palette" size={14}/></button></div></header>
 {state.launch&&circle.eligible&&<section className={'simple-profile-global'+(circle.canPlay?' is-unlocked':'')} aria-label="Friend invites"><span className="profile-global-orbit" aria-hidden="true"><Icon name="globe" size={86}/></span><header><h2><Icon name="globe" size={17}/>Global play</h2><span className={circle.canPlay?'is-on':''}><Icon name={circle.canPlay?'check':'lock'} size={11}/>{circle.canPlay?'Unlocked':'Locked'}</span></header><div className="profile-global-main"><p>{circle.canPlay?'Explore with your Roamies.':`${circle.count}/5 friends joined`}</p><div className="simple-profile-global-actions">{circle.canPlay?onFeed&&<button onClick={onFeed}>Explore the world<Icon name="arrow" size={14}/></button>:onInvite&&<button onClick={onInvite}>{circle.count?'Invite next friend':'Invite a friend'}<Icon name="arrow" size={14}/></button>}</div></div>{!circle.canPlay&&<div className="simple-profile-progress" role="progressbar" aria-label="Friend invite progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={circle.count}>{Array.from({length:5},(_,i)=><i className={i<circle.count?'complete':''} key={i}/>)}</div>}</section>}
 {onTravel&&travel&&<div className="profile-travel-lists">{travel}</div>}
 <nav className="simple-profile-menu" aria-label="Profile menu">{onTravel?<button className="simple-profile-row" onClick={onTravel}><MenuGlyph name="globe"/><span>My travel list</span><Icon name="back" size={16} className="profile-row-chevron"/></button>:travel&&<ProfileDrawer label="My travel list" icon="globe">{travel}</ProfileDrawer>}{roamies&&<ProfileDrawer label="Your Roamies" icon="people">{roamies}</ProfileDrawer>}{items.map(item=><button className="simple-profile-row" key={item.label} onClick={item.onClick}><MenuGlyph name={item.icon}/><span>{item.label}</span><Icon name="back" size={16} className="profile-row-chevron"/></button>)}</nav>
 {onClear&&<div className="simple-profile-reset"><ClearLocalData onClear={onClear}/></div>}
 </div>;
}
