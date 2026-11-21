import {sharedMapPlaces} from './place-contributions.ts';
import {placeCheckInFeed,type PlaceFavoriteAction} from './place-checkins.ts';
import {palSummaries} from './pal-loop.ts';
import type {PreviewState} from './preview.ts';
export function leaderboardDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function leaderboardDayOffset(now:Date,offset:number){return leaderboardDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset));}
function parseDay(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;const [y,m,d]=day.split('-').map(Number),date=new Date(y,m-1,d);return leaderboardDay(date)===day?date:null;}
export type DailyPlaceRank={id:string;alias:string;city:string;avatar:NonNullable<PreviewState['profile']>['avatar'];you:boolean;favs:number;rank:number;movement:number|null};
/** One first favourite per person/place. Closing a day preserves its result. */
export function dailyPlaceLeaderboard(state:PreviewState,day=leaderboardDay(),now=new Date()):DailyPlaceRank[]{
 const date=parseDay(day);if(!date||day>leaderboardDay(now)||!state.profile||state.profile.ageBand==='10-12')return [];
 const people=palSummaries(state),peerIds=new Set(people.map(p=>p.id)),own=new Set(sharedMapPlaces(state).map(p=>p.id)),feed=placeCheckInFeed(state,undefined,now),cutoff=Math.min(now.getTime(),new Date(date.getFullYear(),date.getMonth(),date.getDate()+1).getTime()-1);
 const actions=[...(state.placeJournal?.favHistory??[])];
 // Older received favourites have a known date. Untimestamped saved places never get a fabricated daily score.
 for(const e of state.placeJournal?.receivedFavs??[])if(!actions.some(a=>a.ownerId==='you'&&a.placeId===e.placeId&&a.actorId===e.palId))actions.push({placeId:e.placeId,ownerId:'you',actorId:e.palId,active:e.active,at:e.at});
 const grouped=new Map<string,PlaceFavoriteAction[]>();
 for(const a of actions){const at=Date.parse(a.at);if(!Number.isFinite(at)||at>cutoff)continue;
  if(a.ownerId==='you'){if(!peerIds.has(a.actorId)||!own.has(a.placeId))continue;}else if(a.actorId!=='you'||!peerIds.has(a.ownerId)||!feed.some(p=>p.id===a.placeId&&p.peerId===a.ownerId))continue;
  const key=JSON.stringify([a.ownerId,a.placeId,a.actorId]);grouped.set(key,[...(grouped.get(key)??[]),a]);
 }
 const points=new Map<string,number>();
 for(const events of grouped.values()){events.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));const first=events[0],last=events.at(-1)!;if(!first.active||!last.active||leaderboardDay(new Date(first.at))!==day)continue;points.set(first.ownerId,(points.get(first.ownerId)??0)+1);}
 const rows=[{id:'you',alias:'You',city:state.profile.city??'',avatar:state.profile.avatar,you:true},...people.map(p=>({id:p.id,alias:p.alias,city:p.city,avatar:p.imageAvatar,you:false}))].map(p=>({...p,favs:points.get(p.id)??0})).filter(p=>p.favs>0).sort((a,b)=>b.favs-a.favs||a.id.localeCompare(b.id));
 return rows.map(r=>({...r,rank:1+rows.filter(p=>p.favs>r.favs).length,movement:null}));
}
export function dailyPlaceBoard(state:PreviewState,day=leaderboardDay(),now=new Date()){
 const date=parseDay(day)??new Date(now.getFullYear(),now.getMonth(),now.getDate()),validDay=leaderboardDay(date),today=leaderboardDay(now),previous=dailyPlaceLeaderboard(state,leaderboardDayOffset(date,-1),now),rows=dailyPlaceLeaderboard(state,validDay,now).map(r=>({...r,movement:previous.some(p=>p.id===r.id)?previous.find(p=>p.id===r.id)!.rank-r.rank:null})),you=rows.find(r=>r.you),until=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime(),seconds=Math.max(0,Math.floor(until/1000));
 return {day:validDay,rows,yourRank:you?.rank??null,yourFavs:you?.favs??0,isToday:validDay===today,label:validDay===today?'Today':validDay===leaderboardDayOffset(now,-1)?'Yesterday':date.toLocaleDateString('en',{month:'short',day:'numeric',...(date.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})}),countdown:[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(x=>String(x).padStart(2,'0')).join(':')};
}
