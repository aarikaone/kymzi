import {readTravelProfile} from './travel-profile.ts';
import {countryById} from './countries.ts';
import {demoPeers} from './index.ts';
import {palSummaries} from './pal-loop.ts';
import {travelQuestionBank} from './travel-question-bank.ts';
import {questionById,TRAVEL_INTRO_IDS,dayCardPicks,isTravelInviteSet} from './question-library.ts';
import {hasDailyProgress,localDay,remainingDailyPlays,type DailyGame} from './daily.ts';
import {beginLaunchPlay,beginInvitePreparation,palFindingProgress,hasInviteAnswers} from './launch.ts';
import type {PreviewState} from './preview.ts';
import type {AgeBand,Question} from './types.ts';
import type {PlayCategoryId} from './categories.ts';
const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function travelQuestionsForDay(day:string,band:AgeBand,exclude:string[]=[],topic?:string,play=0){
 const pool=travelQuestionBank.filter(q=>q.min_age<=Number(band.split('-')[0])&&!exclude.includes(q.id)),preferred=topic?pool.filter(q=>q.topicId===topic):pool,source=preferred.length>=3?preferred:pool;
 if(!topic&&play===0&&TRAVEL_INTRO_IDS.every(id=>!exclude.includes(id)))return TRAVEL_INTRO_IDS.map(id=>questionById(id)!);
 const ordered=source.slice().sort((a,b)=>hash(`${day}:${band}:${play}:${a.id}`)-hash(`${day}:${band}:${play}:${b.id}`)||a.id.localeCompare(b.id)),picked:Question[]=[];
 for(const phase of ['start','wander','afterglow']){const next=ordered.find(q=>q.phase===phase&&!picked.some(p=>p.familyId===q.familyId));if(next)picked.push(next);}
 for(const q of ordered){if(picked.length===3)break;if(!picked.some(p=>p.id===q.id||p.familyId===q.familyId))picked.push(q);}
 return picked.slice(0,3);
}
/** Keep paid/resumable games, surprise destinations and pal limits. Only untouched drafts switch catalogues. */
export function withTravelQuestions(game:DailyGame,band:AgeBand,now=new Date(),topic?:PlayCategoryId):DailyGame{
 if(!game.active||hasDailyProgress(game))return game;
 const used=game.usageDay===localDay(now)?game.usedQuestionIds:[],questions=travelQuestionsForDay(localDay(now),band,[...used,...game.lastQuestionIds],topic,5-remainingDailyPlays(game,now));
 if(questions.length!==3)throw new Error('Try a different kind of day.');
 return {...game,active:{...game.active,categoryId:topic??'what-if',ids:questions.map(q=>q.id),answers:{},submittedIds:[]}};
}
export function beginPerfectDayPlay(state:PreviewState,now=new Date(),peerId?:string,topic?:PlayCategoryId){
 const next=beginLaunchPlay(state,now,peerId);let daily=withTravelQuestions(next.daily,next.profile!.ageBand,now,topic);
 if(!peerId&&!hasDailyProgress(daily)){const known=palSummaries(next),travel=readTravelProfile(next.profile?.travel),wishes=travel.wishlist.flatMap(w=>{const city=countryById(w.cityId);if(!city||travel.arrivals.some(a=>a.cityId===w.cityId&&a.wishFulfilled)||!demoPeers.some(p=>p.ageBand===next.profile!.ageBand&&p.country===city.name&&!next.blocked.includes(p.id)&&(known.find(k=>k.id===p.id)?.matches??0)<5))return [];return [city.id];});const target=wishes[daily.played%wishes.length];if(target&&daily.active)daily={...daily,active:{...daily.active,countryId:target}};}

 return {...next,daily};
}
export function beginDayCard(state:PreviewState,now=new Date()){const old=state.launch?.preparation,base=old&&!isTravelInviteSet(old.ids)?{...state,launch:{...state.launch!,preparation:null}}:state;return beginInvitePreparation(base,now,true);}
export function hasDayCard(state:PreviewState){return !!state.launch?.tickets.some(t=>isTravelInviteSet(t.ids)&&t.answers.every((a,i)=>questionById(t.ids[i])?.choices?.some(c=>c.label===a)));}
export function perfectDayPicks(state:PreviewState){const ticket=state.launch?.tickets.slice().reverse().find(t=>isTravelInviteSet(t.ids));if(ticket)return dayCardPicks(ticket.ids,ticket.answers);return dayCardPicks(state.daily.lastQuestionIds,state.daily.lastQuestionIds.map(id=>state.answers[id]??''));}
export function founderJourney(state:PreviewState){const p=palFindingProgress(state);return {...p,ready:hasDayCard(state),member:state.profile?.name??'',title:'Founding Explorer',earned:p.unlocked,stage:!hasDayCard(state)?'make-day':p.canPlay?'world-open':'build-circle'};}
