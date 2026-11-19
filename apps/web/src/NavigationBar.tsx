import type {AvatarId} from '@rymzi/core';
import {Icon} from './icons';
export function NavigationBar({path,onNavigate,taskCount}:{path:string;avatar:AvatarId;privatePhotos:boolean;count:number;taskCount:number;onNavigate:(path:string)=>void}){
 const completed=Math.min(3,Math.max(0,taskCount)),items=[{path:'/home',label:'Explore',icon:'compass'},{path:'/passport',label:'Cities',icon:'globe'},{path:'/tasks',label:'Task',icon:'camera'},{path:'/favorites',label:'Favs',icon:'heart'},{path:'/profile',label:'Profile',icon:'user'}];
 return <nav className="standard-bottom-nav" aria-label="Main navigation">{items.map(item=><button key={item.path} aria-label={item.label} aria-describedby={item.path==='/tasks'?'task-tab-progress':undefined} aria-current={path===item.path?'page':undefined} onClick={()=>onNavigate(item.path)}><span className="standard-tab-icon"><Icon name={item.icon} size={23}/>{item.path==='/tasks'&&<span id="task-tab-progress" className={`task-tab-progress ${completed===3?'complete':''}`} aria-label={`Monthly task progress: ${completed} of 3 photos`}>{completed}/3</span>}</span><span>{item.label}</span></button>)}</nav>;
}
