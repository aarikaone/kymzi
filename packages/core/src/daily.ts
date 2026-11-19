import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import { DAILY_IDS, dailyQuestions, eligibleQuestions } from './index.ts';
import { questionBank } from './questions.ts';
import type { AgeBand, Question } from './types.ts';
import { categoryQuestions, PLAY_CATEGORIES } from './categories.ts';

export const DAILY_PLAY_LIMIT=5;

export type DailyGame = {
  playTime: string | null;
  nextUnlockAt: string | null;
  lastCompletedAt: string | null;
  lastCompletedDay: string | null;
  lastQuestionIds: string[];
  lastCountryId?: CountryId;
  played: number;
  usageDay: string | null;
  playsToday: number;
  usedQuestionIds: string[];
  active: { ids: string[]; answers: Record<string,string>; startedAt: string; categoryId?:string; countryId?:CountryId; peerId?:string; submittedIds:string[]; countedAt:string|null } | null;
};
export type DailyStatus = { kind:'ready'|'choose-time'|'waiting'; remainingMs:number };
export function localDay(date=new Date()):string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function emptyDaily():DailyGame { return {playTime:null,nextUnlockAt:null,lastCompletedAt:null,lastCompletedDay:null,lastQuestionIds:[],played:0,usageDay:null,playsToday:0,usedQuestionIds:[],active:null}; }
export function remainingDailyPlays(game:DailyGame,now=new Date()):number{return (game.usageDay??game.lastCompletedDay)===localDay(now)?Math.max(0,DAILY_PLAY_LIMIT-game.playsToday):DAILY_PLAY_LIMIT;}
export function hasDailyProgress(game:DailyGame):boolean{return !!game.active&&(!!game.active.countedAt||!!game.active.submittedIds?.length||Object.values(game.active.answers).some(answer=>answer.trim()));}
export function resumeDailyIndex(game:DailyGame):number{if(!game.active)return 0;const index=game.active.ids.findIndex(id=>!game.active!.submittedIds?.includes(id)||!game.active!.answers[id]?.trim());return index<0?2:index;}
const validDate=(value:unknown):value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export const validPlayTime=(value:unknown):value is string=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validIds=(value:unknown):value is string[]=>Array.isArray(value)&&value.length===3&&new Set(value).size===3&&value.every(id=>questionBank.some(q=>q.id===id));
export function readDaily(value:unknown,legacyCompleted=false,now=new Date()):DailyGame {
  const data=value as Partial<DailyGame>|null;
  if(!data||typeof data!=='object')return legacyCompleted?{...emptyDaily(),lastCompletedAt:now.toISOString(),lastCompletedDay:localDay(now),usageDay:localDay(now),lastQuestionIds:[...DAILY_IDS],usedQuestionIds:[...DAILY_IDS],played:1,playsToday:1}:emptyDaily();
  const completed=validDate(data.lastCompletedAt)?data.lastCompletedAt:null;
  if(!completed&&legacyCompleted)return readDaily(null,true,now);
  const playTime=validPlayTime(data.playTime)?data.playTime:null;
  const ids=validIds(data.lastQuestionIds)?data.lastQuestionIds:completed?[...DAILY_IDS]:[];
  const completedDay=completed&&typeof data.lastCompletedDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(data.lastCompletedDay)?data.lastCompletedDay:completed?localDay(new Date(completed)):null;
  const usageDay=typeof data.usageDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(data.usageDay)?data.usageDay:completedDay;
  const oldActive=!!data.active&&!Array.isArray(data.active.submittedIds)&&!Object.hasOwn(data.active,'countedAt');
  let active:DailyGame['active']=data.active&&validIds(data.active.ids)&&validDate(data.active.startedAt)?{ids:data.active.ids,startedAt:data.active.startedAt,countryId:countryById(data.active.countryId)?.id,...(typeof data.active.peerId==='string'?{peerId:data.active.peerId}:{}),categoryId:PLAY_CATEGORIES.some(c=>c.id===data.active?.categoryId)?data.active.categoryId:undefined,answers:Object.fromEntries(Object.entries(data.active.answers??{}).filter(([id,v])=>data.active!.ids.includes(id)&&typeof v==='string'&&v.length<=40)) as Record<string,string>,submittedIds:Array.isArray(data.active.submittedIds)?[...new Set(data.active.submittedIds.filter(id=>data.active!.ids.includes(id)))]:[],countedAt:validDate(data.active.countedAt)?data.active.countedAt:null}:null;
  if(active&&!active.categoryId&&!active.countedAt&&!Object.values(active.answers).some(answer=>answer.trim()))active=null;
  let result:DailyGame={playTime,nextUnlockAt:validDate(data.nextUnlockAt)?data.nextUnlockAt:null,lastCompletedAt:completed,lastCompletedDay:completedDay,lastQuestionIds:ids,lastCountryId:countryById(data.lastCountryId)?.id,played:completed?Math.max(1,Number.isInteger(data.played)?data.played!:1):0,usageDay,playsToday:usageDay?Math.max(completedDay===usageDay?1:0,Math.min(DAILY_PLAY_LIMIT,Number.isInteger(data.playsToday)?data.playsToday!:completed?1:0)):0,usedQuestionIds:Array.isArray(data.usedQuestionIds)?data.usedQuestionIds.filter(id=>typeof id==='string'&&questionBank.some(q=>q.id===id)).slice(0,15):ids,active};
  if(completed&&playTime&&!result.nextUnlockAt)result={...result,nextUnlockAt:nextCalendarTime(new Date(completed),playTime).toISOString()};
  if(oldActive&&active&&Object.values(active.answers).some(answer=>answer.trim())&&remainingDailyPlays(result,now)>0){result=countActive(result,now);result={...result,active:{...result.active!,submittedIds:active.ids.filter(id=>active!.answers[id]?.trim())}};}
  return result;
}
function nextCalendarTime(date:Date,time:string):Date {
  const next=new Date(date);next.setDate(next.getDate()+1);const [hour,minute]=time.split(':').map(Number);next.setHours(hour,minute,0,0);return next;
}
export function dailyStatus(game:DailyGame,now=new Date()):DailyStatus {
  // The fifth paid play can still be finished and resumed even when no new plays remain.
  if(game.active?.countedAt)return {kind:'ready',remainingMs:0};
  const left=remainingDailyPlays(game,now);
  if(left>0&&hasDailyProgress(game))return {kind:'ready',remainingMs:0};
  if(!game.playTime||!game.nextUnlockAt)return {kind:game.lastCompletedAt||left===0?'choose-time':'ready',remainingMs:0};
  const remainingMs=Math.max(0,Date.parse(game.nextUnlockAt)-now.getTime());
  if((game.usageDay??game.lastCompletedDay)===localDay(now))return left>0?{kind:'ready',remainingMs:0}:{kind:'waiting',remainingMs:Math.max(remainingMs,nextCalendarTime(now,game.playTime).getTime()-now.getTime())};
  return {kind:remainingMs>0?'waiting':'ready',remainingMs};
}
export function scheduleDaily(game:DailyGame,time:string,now=new Date()):DailyGame {
  if(!validPlayTime(time))throw new Error('Choose a valid time.');
  if(!game.lastCompletedAt&&!game.usageDay)throw new Error('Answer your first question before choosing a time.');
  // An already-open round stays open. The new preference is used after it finishes.
  if(dailyStatus(game,now).kind==='ready')return {...game,playTime:time};
  let target=game.nextUnlockAt?new Date(game.nextUnlockAt):nextCalendarTime(now,time);
  if(localDay(target)<localDay(now))target=new Date(now);
  if(game.usageDay===localDay(now)||!game.playTime)target=nextCalendarTime(now,time);
  const [hour,minute]=time.split(':').map(Number);target.setHours(hour,minute,0,0);
  return {...game,playTime:time,nextUnlockAt:target.toISOString()};
}
function hash(text:string):number { let value=2166136261;for(const char of text)value=Math.imul(value^char.charCodeAt(0),16777619);return value>>>0; }
export function questionsForDay(day:string,band:AgeBand,exclude:string[]=[],categoryId?:string,play=0):Question[] {
  const pool=(categoryId?categoryQuestions(categoryId,band):eligibleQuestions(band)).filter(q=>!exclude.includes(q.id));
  // Intro questions provide a curated demo for each category. Later plays vary without repeats.
  const category=PLAY_CATEGORIES.find(c=>c.id===categoryId),intro=category?.introIds.map(id=>pool.find(q=>q.id===id)).filter((q):q is Question=>!!q);
  if(intro?.length===3)return intro;
  // Deterministic per date and age group. Reopening cannot shuffle a play.
  const ordered=[...pool].sort((a,b)=>hash(`${day}:${band}:${play}:${a.id}`)-hash(`${day}:${band}:${play}:${b.id}`)||a.id.localeCompare(b.id));if(categoryId)return ordered.slice(0,3);const selected:Question[]=[];for(const q of ordered){if(!selected.some(v=>v.category===q.category))selected.push(q);if(selected.length===3)break;}return selected;
}
export function activeQuestions(game:DailyGame,band:AgeBand):Question[] {
  if(!game.active)return dailyQuestions;
  const pool=eligibleQuestions(band);return game.active.ids.map(id=>pool.find(q=>q.id===id)).filter((q):q is Question=>!!q);
}
export function completedQuestions(game:DailyGame):Question[] { return game.lastQuestionIds.map(id=>questionBank.find(q=>q.id===id)).filter((q):q is Question=>!!q); }
export function beginDaily(game:DailyGame,band:AgeBand,now=new Date(),categoryId?:string,countryId?:CountryId):DailyGame {
  game=readDaily(game,false,now);
  if(dailyStatus(game,now).kind!=='ready')throw new Error('Your next round is not open yet.');
  if(hasDailyProgress(game)&&activeQuestions(game,band).length===3)return game;
  if(countryId&&!countryById(countryId))throw new Error('Choose a country.');
  if(categoryId&&!PLAY_CATEGORIES.some(c=>c.id===categoryId))throw new Error('Choose a category.');
  const used=game.usageDay===localDay(now)?game.usedQuestionIds:[];
  const questions=!categoryId&&game.played===0?dailyQuestions:questionsForDay(localDay(now),band,[...new Set([...used,...game.lastQuestionIds])],categoryId,game.usageDay===localDay(now)?game.playsToday:0);
  if(questions.length!==3)throw new Error('Choose another category.');
  return {...game,active:{ids:questions.map(q=>q.id),answers:{},startedAt:now.toISOString(),categoryId,countryId,submittedIds:[],countedAt:null}};
}
export function answerDaily(game:DailyGame,id:string,answer:string,now=new Date()):DailyGame {
  if(dailyStatus(game,now).kind!=='ready'||!game.active||!game.active.ids.includes(id))throw new Error('Start your daily round first.');
  return {...game,active:{...game.active,answers:{...game.active.answers,[id]:answer.slice(0,40)}}};
}
function countActive(game:DailyGame,now:Date):DailyGame{
  if(!game.active)throw new Error('Start a game first.');
  if(game.active.countedAt)return game;
  if(remainingDailyPlays(game,now)===0)throw new Error('Your five plays are already used.');
  const sameDay=game.usageDay===localDay(now);
  return {...game,usageDay:localDay(now),playsToday:(sameDay?game.playsToday:0)+1,usedQuestionIds:[...new Set([...(sameDay?game.usedQuestionIds:[]),...game.active.ids])],nextUnlockAt:game.playTime?nextCalendarTime(now,game.playTime).toISOString():game.nextUnlockAt,active:{...game.active,countedAt:now.toISOString()}};
}
export function submitDaily(game:DailyGame,id:string,now=new Date()):DailyGame{
  game=readDaily(game,false,now);
  if(dailyStatus(game,now).kind!=='ready'||!game.active||!game.active.ids.includes(id)||!game.active.answers[id]?.trim())throw new Error('Write your answer first.');
  const index=game.active.ids.indexOf(id);
  if(game.active.ids.slice(0,index).some(previous=>!game.active!.submittedIds.includes(previous)||!game.active!.answers[previous]?.trim()))throw new Error('Finish the previous answer first.');
  const counted=countActive(game,now);
  return {...counted,active:{...counted.active!,submittedIds:[...new Set([...counted.active!.submittedIds,id])]}};
}
export function completeDaily(game:DailyGame,now=new Date()):DailyGame {
  game=readDaily(game,false,now);
  if(dailyStatus(game,now).kind!=='ready'||!game.active||game.active.ids.length!==3||game.active.ids.some(id=>!game.active!.answers[id]?.trim()))throw new Error('Answer all three questions to finish.');
  let submitted=game;for(const id of game.active.ids)submitted=submitDaily(submitted,id,now);
  const paidToday=localDay(new Date(submitted.active!.countedAt!))===localDay(now);
  return {...submitted,lastCompletedAt:now.toISOString(),lastCompletedDay:localDay(now),lastQuestionIds:[...submitted.active!.ids],lastCountryId:submitted.active!.countryId??COUNTRIES[game.played%COUNTRIES.length].id,played:game.played+1,active:null,nextUnlockAt:game.playTime&&paidToday?nextCalendarTime(now,game.playTime).toISOString():submitted.nextUnlockAt};
}
export function countdownParts(milliseconds:number):{hours:string;minutes:string;seconds:string} {const total=Math.max(0,Math.ceil(milliseconds/1000));return {hours:String(Math.floor(total/3600)).padStart(2,'0'),minutes:String(Math.floor(total/60)%60).padStart(2,'0'),seconds:String(total%60).padStart(2,'0')};}
export function displayPlayTime(time:string):string {if(!validPlayTime(time))return 'Choose a time';const [hour,minute]=time.split(':').map(Number);const date=new Date(2000,0,1,hour,minute);return new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(date);}
export function nextPlayLabel(game:DailyGame,now=new Date()):string {if(!game.nextUnlockAt)return 'Choose your daily time';const date=new Date(game.nextUnlockAt),tomorrow=new Date(now);tomorrow.setDate(tomorrow.getDate()+1);const day=localDay(date)===localDay(now)?'Today':localDay(date)===localDay(tomorrow)?'Tomorrow':new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric'}).format(date);return `${day} · ${new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(date)}`;}
