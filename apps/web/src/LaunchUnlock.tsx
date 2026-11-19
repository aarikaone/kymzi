import {useCallback,useEffect,useRef,useState} from 'react';
import {palFindingProgress,UNLOCK_PREVIEW_AVATARS,hasInviteAnswers,dailyStatus,replyFromToken,type PreviewState,type FriendReply} from '@rymzi/core';
import {Icon} from './icons';

export function LaunchUnlock({state,now,onPrepare,onInvite,onPlay,onExplore,onCollect,onSimulate,onResetPreview,autoPreview=false}:{state:PreviewState;now:Date;onPrepare:()=>void;onInvite:()=>void;onPlay:()=>void;onExplore:()=>void;onCollect:(reply:FriendReply)=>void;onSimulate:()=>void|Promise<void>;onResetPreview:()=>void;autoPreview?:boolean}){
 const p=palFindingProgress(state),ready=hasInviteAnswers(state),waiting=dailyStatus(state.daily,now).kind==='waiting';
 const [adding,setAdding]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState('');
 const [phase,setPhase]=useState<'idle'|'adding'|'unlocking'|'complete'>(autoPreview?'adding':p.simulated?'complete':'idle'),[step,setStep]=useState(0),[run,setRun]=useState(0);
 const simulate=useRef(onSimulate);simulate.current=onSimulate;
 const finish=useCallback(async()=>{setPhase('unlocking');try{await simulate.current();setPhase('complete');}catch(e){setError((e as Error).message);setPhase('idle');}},[]);
 useEffect(()=>{
  if(phase!=='adding')return;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){setStep(5);void finish();return;}
  const timers=[0,1,2,3,4].map(i=>window.setTimeout(()=>setStep(i+1),400+i*620));
  timers.push(window.setTimeout(()=>void finish(),3650));
  return()=>timers.forEach(window.clearTimeout);
 },[phase,run,finish]);
 function preview(){setAdding(false);setError('');setStep(0);setRun(n=>n+1);setPhase('adding');}
 function reset(){try{onResetPreview();setPhase('idle');setStep(0);}catch(e){setError((e as Error).message);}}
 const previewing=phase!=='idle'||p.simulated,complete=phase==='complete',count=complete?5:step;
 if(previewing)return <div className={`launch-page unlock-page unlock-preview ${complete?'is-unlocked':''}`} key={run}>
  <header><span className="launch-eyebrow">UNLOCK PREVIEW</span><h1 tabIndex={-1}>{complete?'Your world.':'Five friends.'}<br/><em>{complete?'Unlocked.':'A whole world.'}</em></h1></header>
  <div className="unlock-scene">
   {complete&&<div className="unlock-confetti" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} style={{'--x':`${Math.cos(i*2.399)*140}px`,'--y':`${Math.sin(i*2.399)*140}px`,'--r':`${i*57}deg`,'--delay':`${i%4*35}ms`} as React.CSSProperties}/>)}</div>}
   <div className="unlock-orb" role="progressbar" aria-label="Simulated friend unlock progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={count} aria-valuetext={complete?'Global play unlocked':`${count} of 5 simulated friends added`}>
    <svg className="unlock-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88"/><circle className="unlock-ring-value" cx="100" cy="100" r="88" pathLength="100" strokeDasharray="100" strokeDashoffset={100-count*20}/></svg>
    {complete?<div className="unlock-world" aria-hidden="true"><Icon name="globe" size={106}/><span><Icon name="check" size={20}/></span></div>:<div className="unlock-counter" key={count}><strong>{count}<small>/5</small></strong><span>{count===5?'Opening your world…':'friends added'}</span></div>}
   </div>
   <div className="unlock-friends preview-friends" aria-hidden="true">{UNLOCK_PREVIEW_AVATARS.map((avatar,i)=><div className={i<count?'complete':''} key={avatar}>{i<count?<img key={`${run}-${i}`} src={`/avatars/${avatar}.webp`} alt=""/>:<Icon name="user" size={27}/>}<span>{i<count?<Icon name="check" size={12}/>:i+1}</span></div>)}</div>
  </div>
  <div className="unlock-copy" role="status" aria-live="polite"><h2>{complete?'Global play is on.':count===5?'You’re all set.':count?`${count} down. ${5-count} to go.`:'Your world starts with five.'}</h2><p>{complete?'3 answers. Someone new. Anywhere.':'Watch your first five join.'}</p><span className="unlock-simulation-note">Simulated friends · No invites sent</span></div>
  {error&&<p role="alert" className="launch-note">{error}</p>}
  <div className="launch-bottom"><button className="button" disabled={!complete||waiting} onClick={onPlay}>{complete?(waiting?'Next play at your daily time':'Find my pal'):phase==='unlocking'?'Unlocking…':'Adding friends…'}<Icon name={complete?'arrow':'globe'}/></button><div className="unlock-links">{phase==='adding'?<button className="text-button" onClick={()=>{setStep(5);void finish();}}>Skip animation</button>:complete?<button className="text-button" onClick={preview}>Replay animation</button>:null}<button className="text-button" disabled={phase==='unlocking'} onClick={reset}>{complete?'Explore':'Cancel'}</button></div></div>
 </div>;
 function add(){try{const link=new URL(url),prefix='#/challenge/result/';if(!['https:','http:'].includes(link.protocol)||!link.hash.startsWith(prefix))throw new Error();onCollect(replyFromToken(link.hash.slice(prefix.length)));setAdding(false);setUrl('');setError('');}catch{setError('Paste the postcard link your friend sent back.');}}
 return <div className="launch-page unlock-page">
  <header><span className="launch-eyebrow">{p.unlocked?'PAL FINDING UNLOCKED':'YOUR FIRST FIVE'}</span><h1 tabIndex={-1}>{p.unlocked?'Your world.':'Bring your'}<br/><em>{p.unlocked?'Unlocked.':'five.'}</em></h1></header>
  <div className="unlock-count" role="progressbar" aria-label="Friend unlock progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={p.count}><strong>{p.count}<small>/5</small></strong><span>friends played</span></div>
  <div className="unlock-friends" aria-label={`${p.count} of 5 friends completed`}>{[0,1,2,3,4].map(i=><div className={i<p.count?'complete':''} key={i}>{p.friends[i]?<img src={`/avatars/${p.friends[i].person.avatar}.webp`} alt={`Friend ${i+1} completed`}/>:<Icon name="user" size={27}/>}<span>{i<p.count?<Icon name="check" size={12}/>:i+1}</span></div>)}</div>
  <div className="unlock-copy"><h2>{p.unlocked?'Someone new is next.':'5 friends unlock pal finding.'}</h2><p>{p.unlocked?'Your friends helped open the world. Play your 3 to look for a pal.':'Share your challenge. Save their returned postcards.'}</p></div>
  {adding&&<div className="unlock-import"><label htmlFor="returned-postcard">Your friend’s postcard<input id="returned-postcard" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste postcard link" autoComplete="off"/></label><button className="button secondary" disabled={!url.trim()} onClick={add}>Add postcard</button></div>}
  {error&&<p className="launch-note" role="alert">{error}</p>}
  <div className="launch-bottom">
   <button className="button" disabled={p.unlocked&&waiting} onClick={p.unlocked?onPlay:ready?onInvite:onPrepare}>{p.unlocked?(waiting?'Next play at your daily time':'Find my pal'):ready?'Invite friends':state.launch?.preparation?'Continue my invite':'Make my invite'}<Icon name={p.unlocked?'arrow':'link'}/></button>
   {!p.unlocked&&<button className="unlock-preview-trigger" onClick={preview}><Icon name="play" size={19}/>Simulate 5 friends<Icon name="arrow" size={17}/></button>}
   <div className="unlock-links">{ready&&!p.unlocked&&<button className="text-button" onClick={()=>setAdding(!adding)}>{adding?'Close link entry':'Add postcard'}</button>}<button className="text-button" onClick={onExplore}>Explore cities</button></div>
  </div>
 </div>;
}
