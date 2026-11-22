import {useId,useState,type ReactNode} from 'react';
import {palFindingProgress,type PreviewState} from '@rymzi/core';
import {ProfileIdentities} from './ProfileIdentities';
import {ClearLocalData} from './ClearLocalData';
import {Icon} from './icons';
import './simple-profile.css';

export type ProfileMenuItem={label:string;icon:string;onClick:()=>void};
type Props={state:PreviewState;onEdit:()=>void;items:ProfileMenuItem[];travel?:ReactNode;onTravel?:()=>void;roamies?:ReactNode;onInvite?:()=>void;onFeed?:()=>void;onClear?:()=>void|Promise<void>};

function ProfileDrawer({label,icon,children}:{label:string;icon:string;children:ReactNode}){
  const [open,setOpen]=useState(false),id=useId();
  return <div className="simple-profile-drawer">
    <button className="simple-profile-row" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><Icon name={icon} size={20}/><span>{label}</span><Icon name={open?'back':'arrow'} size={17} className={open?'profile-drawer-up':'profile-drawer-down'}/></button>
    <div id={id} hidden={!open}>{open&&<div className="simple-profile-detail">{children}</div>}</div>
  </div>;
}

export function SimpleProfile({state,onEdit,items,travel,onTravel,roamies,onInvite,onFeed,onClear}:Props){
  const profile=state.profile!,circle=palFindingProgress(state);
  return <div className="simple-profile">
    <header className="simple-profile-identity">
      <ProfileIdentities profile={profile} onEdit={onEdit}/>
      <div><h1 className="page-heading" tabIndex={-1}>#{profile.name}</h1><button onClick={onEdit}>Edit profile<Icon name="arrow" size={15}/></button></div>
    </header>

    {state.launch&&circle.eligible&&<section className="simple-profile-global" aria-label="Your circle">
      <header><h2 className="page-heading">Global play</h2><span className={circle.canPlay?'is-on':''}><Icon name={circle.canPlay?'globe':'lock'} size={12}/>Global {circle.canPlay?'ON':'OFF'}</span></header>
      <p>{circle.canPlay?(circle.count?`${circle.count} friends`:'Ready to explore.') :circle.count?`${circle.count} added · ${circle.remaining} left`:'Five friends open the world.'}</p>
      {!circle.canPlay&&<div className="simple-profile-progress" role="progressbar" aria-label="Global unlock progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={circle.count}>{Array.from({length:5},(_,i)=><i className={i<circle.count?'complete':''} key={i}/>)}</div>}
      <div className="simple-profile-global-actions">
        {circle.canPlay?onFeed&&<button onClick={onFeed}>Explore the world<Icon name="arrow" size={16}/></button>:onInvite&&<button onClick={onInvite}>{circle.count?'Invite next friend':'Invite an explorer'}<Icon name="arrow" size={16}/></button>}
        {!circle.canPlay&&circle.count>0&&onFeed&&<button className="profile-feed-link" onClick={onFeed}>See your feed</button>}
      </div>
    </section>}

    <nav className="simple-profile-menu" aria-label="Profile menu">
      {onTravel?<button className="simple-profile-row" onClick={onTravel}><Icon name="globe" size={20}/><span>My travel list</span><Icon name="arrow" size={17}/></button>:travel&&<ProfileDrawer label="My travel list" icon="globe">{travel}</ProfileDrawer>}
      {roamies&&<ProfileDrawer label="Your roamies" icon="people">{roamies}</ProfileDrawer>}
      {items.map(item=><button className="simple-profile-row" key={item.label} onClick={item.onClick}><Icon name={item.icon} size={20}/><span>{item.label}</span><Icon name="arrow" size={17}/></button>)}
    </nav>
    {onClear&&<div className="simple-profile-reset"><ClearLocalData onClear={onClear}/></div>}
  </div>;
}
