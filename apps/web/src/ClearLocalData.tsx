import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Icon} from './icons';
import './clear-local-data.css';

export function ClearLocalData({onClear}:{onClear:()=>void|Promise<void>}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const dialog=useRef<HTMLDialogElement>(null),locked=useRef(false),alive=useRef(true),title=useId(),description=useId();
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close();},[open]);
  function dismiss(){if(locked.current)return;setOpen(false);setError('');}
  async function clear() {
    if(locked.current)return;
    locked.current=true;setBusy(true);setError('');
    try{await onClear();if(alive.current)setOpen(false);}
    catch(error){if(alive.current)setError(error instanceof Error?error.message:'Could not clear data. Try again.');}
    finally{locked.current=false;if(alive.current)setBusy(false);}
  }
  return <>
    <button type="button" className="profile-clear-data" onClick={()=>{setError('');setOpen(true);}}><Icon name="trash"/><span>Clear local data</span><Icon name="arrow" size={18}/></button>
    {createPortal(<dialog ref={dialog} className="clear-data-dialog" aria-labelledby={title} aria-describedby={description} onCancel={event=>{event.preventDefault();dismiss();}} onClose={()=>{if(!locked.current)setOpen(false);}} onClick={event=>{if(event.target===event.currentTarget)dismiss();}}>
      {open&&<><h2 className="page-heading" id={title}>Clear local data?</h2><p id={description}>Your profile, Roamies, saved places, and progress will be deleted.</p>{error&&<p className="clear-data-error" role="alert">{error}</p>}<button className="clear-data-cancel" autoFocus disabled={busy} onClick={dismiss}>Cancel</button><button className="clear-data-confirm" disabled={busy} onClick={()=>void clear()}>{busy?'Clearing…':'Clear data'}</button></>}
    </dialog>,document.body)}
  </>;
}
