import {cityPhotoMonth,countryById,photoMonthProgress,type PreviewState} from '@rymzi/core';
import {Icon} from './icons';

type Props={state:PreviewState;now:Date;onCapture:()=>void};
function currentShots(state:PreviewState,now:Date){return state.photos.photos.filter(p=>p.ageBand===state.profile?.ageBand&&cityPhotoMonth(new Date(p.capturedAt))===cityPhotoMonth(now)).slice(0,3);}

export function MonthlyPhotoGoal({state,now,onCapture}:Props){
 const p=photoMonthProgress(state,now),shots=currentShots(state,now);
 return <button className={`home-monthly-goal ${p.done?'is-done':''}`} aria-label={`Monthly photo task: ${Math.min(p.count,3)} of 3. View tasks`} onClick={onCapture}>
  <span className="home-monthly-copy"><small>Your monthly task</small><strong>{p.done?'Profile active.':'3 shots. Stay active.'}</strong><span className="home-monthly-bars" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={i<p.count?'filled':''}/>)}</span></span>
  <span className="home-monthly-frames" aria-hidden="true">{[0,1,2].map(i=><span key={i}>{shots[i]?<img src={shots[i].image} alt=""/>:<Icon name={i<p.count?'check':'camera'} size={18}/>}</span>)}</span>
  <span className="home-monthly-total" aria-label={`${Math.min(p.count,3)} of 3 photos this month`}>{Math.min(p.count,3)}<small>/3</small></span>
 </button>;
}

export function ProfileActivity({state,now,onTasks}:{state:PreviewState;now:Date;onTasks:()=>void}){
 const p=photoMonthProgress(state,now);
 return <button className={`profile-activity ${p.active?'is-active':'is-paused'}`} onClick={onTasks}><span><i/>{p.active?'Profile active':'Profile paused'}</span><small>{p.done?'Monthly task complete':`${p.remaining} ${p.remaining===1?'photo':'photos'} ${p.active?'due '+p.dueLabel:'to reactivate'}`}</small><Icon name="arrow" size={17}/></button>;
}

export function MonthlyTasks({state,now,onCapture}:Props){
 const p=photoMonthProgress(state,now),shots=currentShots(state,now),privateOnly=state.profile?.ageBand==='10-12';
 return <div className="monthly-tasks">
  <div className="task-topline"><span>{p.monthLabel} mission</span><span className={`task-profile-status ${p.active?'is-active':'is-paused'}`}><i/>{p.active?'Profile active':'Profile paused'}</span></div>
  <div className="task-intro"><h1 tabIndex={-1}>Your city.<br/><em>Your lens.</em></h1><p>Shoot 3 city photos each month to keep your profile active.</p></div>
  <div className="task-photo-slots" aria-label="Your three monthly city photos">{[0,1,2].map(i=><div className={`task-photo-slot slot-${i} ${i<p.count?'is-shot':''}`} key={i}>{shots[i]?<img src={shots[i].image} alt={`Your monthly photo ${i+1} in ${countryById(shots[i].countryId)!.city}`}/>:<Icon name={i<p.count?'check':'camera'} size={30}/>}<span>{String(i+1).padStart(2,'0')}</span></div>)}</div>
  <div className="task-progress"><span aria-label={`${Math.min(p.count,3)} of 3 photos this month`}><strong>{Math.min(p.count,3)}</strong><small>/3 photos</small></span><span>{p.done?`Next task ${p.nextLabel}`:`Due ${p.dueLabel}`}</span></div>
  <div className="task-progress-bars" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={i<p.count?'is-filled':''}/>)}</div>
  <p className="task-status-note" role="status">{p.done?'You’re all set. Keep the city moments coming.':p.active?'Three fresh shots keep your profile active next month.':'Your profile is paused. Three fresh shots reactivate it.'}</p>
  <div className="footer-actions"><button className="button task-camera-button" onClick={onCapture}><Icon name="camera"/>{p.done?'Take another photo':`Take photo ${Math.min(p.count+1,3)} of 3`}<Icon name="arrow"/></button><p className="small center">{privateOnly?'Camera only · Private collection':'Camera only · City scenes, no faces'}</p></div>
 </div>;
}
