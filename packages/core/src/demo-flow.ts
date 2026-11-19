import {demoPeers} from './index.ts';
import {completeDaily,dailyStatus,scheduleDaily,type DailyGame} from './daily.ts';
import {countryById} from './countries.ts';
import {playCountry,rankPlayMatches} from './encounters.ts';
import {connectionFor,connections,knownConnectionIds,recordConnections} from './social.ts';
import {recordJourney} from './passport.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand,Match} from './types.ts';

/** Demo-only answers. The fixed fixture catalog and exact matcher are unchanged. */
export function demoPlayMatches(answers:Record<string,string>,band:AgeBand,game:DailyGame,blocked:string[]=[]):Match[]{
 const ids=game.active?.ids??game.lastQuestionIds;
 if(band==='10-12'||ids.length!==3||ids.some(id=>!answers[id]?.trim()||answers[id].length>40))return [];
 const country=countryById(playCountry(game))!,eligible=demoPeers.filter(p=>p.ageBand===band&&!blocked.includes(p.id));
 const peer=eligible.find(p=>p.country===country.name)??eligible[0];
 if(!peer)return [];
 return [{peer:{...peer,answers:{...peer.answers,...Object.fromEntries(ids.map(id=>[id,answers[id].trim()]))}},shared:3,total:3,score:100,sharedIds:[...ids],simulated:true}];
}

/** Time is optional setup in the demo; keep all existing play accounting. */
export function prepareDemoPlay(game:DailyGame,now=new Date()):DailyGame{
 return dailyStatus(game,now).kind==='choose-time'?scheduleDaily(game,game.playTime??'19:00',now):game;
}

export function completeDemoPlay(state:PreviewState,now=new Date()):PreviewState{
 if(state.launch&&(!state.launch.globalPlay||state.profile?.ageBand==='10-12'))throw new Error('Activate global play before finding a preview pal.');
 if(!state.profile||!state.daily.active)throw new Error('Start a play first.');
 const answers=Object.fromEntries(state.daily.active.ids.map(id=>[id,(state.daily.active!.answers[id]??'').trim()]));
 const daily=prepareDemoPlay(completeDaily(state.daily,now),now);let matches=demoPlayMatches(answers,state.profile.ageBand,daily,state.blocked);
 const target=state.daily.active.peerId;
 if(state.profile.ageBand!=='10-12'){
  const all=connections(state.social,state.profile.ageBand,state.blocked),base=matches[0];
  const peer=target?connectionFor(state.social,target,state.profile.ageBand,state.blocked)?.peer:demoPeers.find(p=>p.ageBand===state.profile!.ageBand&&!state.blocked.includes(p.id)&&p.country===base?.peer.country&&(all.find(c=>c.peer.id===p.id)?.matches??0)<5);
  if(!peer||(all.find(c=>c.peer.id===peer.id)?.matches??0)>=5)throw new Error('Five games complete with this pal. Find someone new.');
  matches=[{peer:{...peer,answers:{...peer.answers,...answers}},shared:3,total:3,score:100,sharedIds:[...daily.lastQuestionIds],simulated:true}];
 }
 if(state.profile.ageBand!=='10-12'&&!matches.length)throw new Error('No demo pals are available in this age group.');
 return {...state,daily,answers,passport:recordJourney(state.passport,daily,state.profile.ageBand,matches),social:recordConnections(state.social,daily,state.profile.ageBand,matches),completed:true,rounds:state.rounds+1};
}

/** Rebuild the displayed result from its saved demo proof, including answer comparisons. */
export function completedPreviewMatches(state:PreviewState):Match[]{
 const band=state.profile?.ageBand??'16-17',game={...state.daily,active:null},playId=`${game.played}:${game.lastCompletedAt}:${game.lastQuestionIds.join('.')}`;
 const simulated=state.social.proofs.filter(p=>p.playId===playId&&p.simulated===true);
 if(simulated.length)return simulated.flatMap(proof=>{
  const peer=demoPeers.find(p=>p.id===proof.peerId&&p.ageBand===band&&!state.blocked.includes(p.id));
  return peer&&band!=='10-12'?[{peer:{...peer,answers:{...peer.answers,...proof.demoAnswers}},shared:3,total:3,score:100,sharedIds:[...proof.questionIds],simulated:true as const}]:[];
 });
 return rankPlayMatches(state.answers,band,game,state.blocked,knownConnectionIds(state.social,band,state.blocked));
}
