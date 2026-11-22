import type {AvatarId} from '@rymzi/core';
import {Icon} from './icons';
export function NavigationBar({path,onNavigate,unreadCount}:{path:string;avatar:AvatarId;privatePhotos:boolean;count:number;unreadCount:number;onNavigate:(path:string)=>void}){
 const items=[{path:'/home',label:'Home',icon:'home'},{path:'/pals',label:'Roamies',icon:'chat'},{path:'/passport',label:'Places',icon:'globe'},{path:'/tasks',label:'Postcard',icon:'stamp'}];
 return <nav className="standard-bottom-nav" aria-label="Main navigation">{items.map(item=><button key={item.path} aria-label={item.label} aria-current={path===item.path||(item.path==='/passport'&&(path==='/favorites'||path==='/world'))?'page':undefined} onClick={()=>onNavigate(item.path)}><span className="standard-tab-icon"><Icon name={item.icon} size={23}/>{item.path==='/pals'&&unreadCount>0&&<span className="pal-tab-count" aria-label={`${unreadCount} unread messages`}>{unreadCount>99?'99+':unreadCount}</span>}</span><span>{item.label}</span></button>)}</nav>;
}
