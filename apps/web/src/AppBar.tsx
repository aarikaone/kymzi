import {useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Icon} from './icons';
import './app-bar.css';

export function AppBar({children,standard=true,safeArea=true,className='',onHeightChange}:{children:ReactNode;standard?:boolean;safeArea?:boolean;className?:string;onHeightChange?:(height:number)=>void}){
 const ref=useRef<HTMLElement>(null),[scrolled,setScrolled]=useState(false);
 useLayoutEffect(()=>{
  const header=ref.current,host=header?.parentElement;if(!header||!host||!standard)return;
  const root=host.classList.contains('app-shell'),active=new Set<HTMLElement>();let frame=0;
  const update=()=>{frame=0;for(const el of active)if(!el.isConnected||!host.contains(el)||el.scrollTop<=8)active.delete(el);setScrolled(active.size>0);};
  const scroll=(event:Event)=>{const el=event.target;if(!(el instanceof HTMLElement)||el===header)return;if(el.scrollTop>8)active.add(el);else active.delete(el);if(!frame)frame=requestAnimationFrame(update);};
  const measure=()=>{const height=Math.ceil(header.getBoundingClientRect().height||parseFloat(getComputedStyle(header).height)||76);if(root)host.style.setProperty('--app-bar-height',height+'px');};
  measure();const resize=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;resize?.observe(header);
  const mutations=typeof MutationObserver==='function'?new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(update);}):null;mutations?.observe(host,{childList:true,subtree:true});
  host.addEventListener('scroll',scroll,true);const main=host.querySelector<HTMLElement>('.app-main');if(main&&main.scrollTop>8)active.add(main);update();
  return()=>{host.removeEventListener('scroll',scroll,true);resize?.disconnect();mutations?.disconnect();if(frame)cancelAnimationFrame(frame);if(root)host.style.removeProperty('--app-bar-height');setScrolled(false);};
 },[standard]);
 useLayoutEffect(()=>{if(!onHeightChange||!ref.current)return;const el=ref.current,resize=()=>{const height=el.getBoundingClientRect().height;if(height)onHeightChange(height);};resize();const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(el);return()=>observer?.disconnect();},[onHeightChange]);
 return <header ref={ref} className={`app-header creative-app-header${standard?' standard-app-bar':''}${safeArea?'':' no-safe-area'}${scrolled?' is-scrolled':''} ${className}`}>{children}</header>;
}
export function SubpageBar({title,onBack,backLabel='Go back',right,backRef,safeArea=true,className='',onHeightChange}:{title:string;onBack:()=>void;backLabel?:string;right?:ReactNode;backRef?:RefObject<HTMLButtonElement|null>;safeArea?:boolean;className?:string;onHeightChange?:(height:number)=>void}){
 return <AppBar safeArea={safeArea} className={`standard-subpage-bar ${className}`} onHeightChange={onHeightChange}><button ref={backRef} className="icon-button back" aria-label={backLabel} onClick={onBack}><Icon name="back"/></button><span className="header-title">{title}</span><span className="standard-bar-right">{right}</span></AppBar>;
}
