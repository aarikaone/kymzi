import {useEffect,useId,useRef,useState} from 'react';
import {Icon} from './icons';
import './place-favorite.css';

type Props={id:string;name:string;saved:boolean;onFavorite:(id:string)=>void;onSaved?:()=>void;variant?:'icon'|'primary';compact?:boolean;className?:string;accessibleLabel?:string};
export function PlaceFavoriteButton({id,name,saved,onFavorite,onSaved,variant='icon',compact=false,className='',accessibleLabel}:Props){
 const [open,setOpen]=useState(false),[pop,setPop]=useState(0),[error,setError]=useState(''),dialog=useRef<HTMLDialogElement>(null),removing=useRef(false),titleId=useId(),nameId=useId();
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close();},[open]);
 useEffect(()=>{if(!saved){setOpen(false);setPop(0);}},[saved]);
 useEffect(()=>{if(!pop)return;const timer=setTimeout(()=>setPop(0),850);return()=>clearTimeout(timer);},[pop]);
 function change(){setError('');if(saved){removing.current=false;setOpen(true);return;}try{onFavorite(id);setPop(n=>n+1);onSaved?.();}catch(e){setError(e instanceof Error?e.message:'Couldn’t save this place. Try again.');}}
 function dismiss(){setOpen(false);setError('');}
 function remove(){if(!saved||removing.current)return;removing.current=true;try{onFavorite(id);setOpen(false);setError('');}catch(e){removing.current=false;setError(e instanceof Error?e.message:'Couldn’t remove this favourite. Try again.');}}
 return <>
  <button type="button" className={`${variant==='primary'?'place-primary place-favorite-primary':'place-heart'} ${className}`} aria-label={accessibleLabel??(variant==='primary'?(saved?'Saved to Favs':'Save this place'):`${saved?'Unfavorite':'Favorite'} ${name}`)} aria-pressed={saved} onClick={change}>
   <span key={pop} className={pop?'place-heart-glyph favorite-pop':'place-heart-glyph'}><Icon name="heart"/></span>{variant==='primary'&&(compact?(saved?'Saved':'Save'):(saved?'Saved to Favs':'Save this place'))}
  </button>
  {!open&&error&&<span role="alert" className="place-favorite-error">{error}</span>}
  <dialog ref={dialog} className="place-unfavorite-sheet" aria-labelledby={titleId} aria-describedby={nameId} onCancel={e=>{e.preventDefault();dismiss();}} onClose={dismiss} onClick={e=>{if(e.target===e.currentTarget)dismiss();}}>
   {open&&<><div className="place-unfavorite-handle"/>
   <span className="place-unfavorite-symbol" aria-hidden="true"><Icon name="heart" size={30}/></span>
   <h2 id={titleId}>Remove from Favs?</h2><p id={nameId}>{name}</p>
   {error&&<p role="alert" className="place-favorite-error">{error}</p>}
   <button type="button" className="place-primary" autoFocus onClick={dismiss}>Keep saved</button>
   <button type="button" className="place-unfavorite-confirm" onClick={remove}>Yes, unfavourite</button></>}
  </dialog>
 </>;
}
export function PlaceFavoriteBurst({token}:{token:number}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{setVisible(!!token);if(!token)return;const timer=setTimeout(()=>setVisible(false),850);return()=>clearTimeout(timer);},[token]);
 if(!visible)return null;
 return <span key={token} className="place-save-burst" aria-hidden="true"><span className="place-save-halo"/><span className="place-save-ring"/><span className="place-save-heart"><Icon name="heart" size={66}/></span>{Array.from({length:6},(_,i)=><span key={i} className={`place-save-spark spark-${i}`}><Icon name={i%2?'plus':'heart'} size={i%2?13:17}/></span>)}</span>;
}
