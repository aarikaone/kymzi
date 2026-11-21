import {useLayoutEffect,useRef,type ReactNode,type RefObject} from 'react';
import {Icon} from './icons';
import './app-bar.css';

export function AppBar({children,standard=true,safeArea=true,className='',onHeightChange}:{children:ReactNode;standard?:boolean;safeArea?:boolean;className?:string;onHeightChange?:(height:number)=>void}){
 const ref=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{if(!onHeightChange||!ref.current)return;const el=ref.current,resize=()=>{const height=el.getBoundingClientRect().height;if(height)onHeightChange(height);};resize();const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(el);return()=>observer?.disconnect();},[onHeightChange]);
 return <header ref={ref} className={`app-header creative-app-header${standard?' standard-app-bar':''}${safeArea?'':' no-safe-area'} ${className}`}>{children}</header>;
}
export function SubpageBar({title,onBack,backLabel='Go back',right,backRef,safeArea=true,className='',onHeightChange}:{title:string;onBack:()=>void;backLabel?:string;right?:ReactNode;backRef?:RefObject<HTMLButtonElement|null>;safeArea?:boolean;className?:string;onHeightChange?:(height:number)=>void}){
 return <AppBar safeArea={safeArea} className={`standard-subpage-bar ${className}`} onHeightChange={onHeightChange}><button ref={backRef} className="icon-button back" aria-label={backLabel} onClick={onBack}><Icon name="back"/></button><span className="header-title">{title}</span><span className="standard-bar-right">{right}</span></AppBar>;
}
