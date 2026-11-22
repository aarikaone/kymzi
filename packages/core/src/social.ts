import {questionById} from './question-library.ts';
import {attractionById,attractionsForCountry} from './attractions.ts';
import {demoPeers,questionBank} from './index.ts';
import {COUNTRIES,COUNTRY_PEOPLE_TARGET,countryById,countryByName,countryForCity,publicVenue,type CountryId,type VenueId} from './countries.ts';
import {passportWeek,type PassportState} from './passport.ts';
import type {AgeBand,DemoPeer,Match,Profile,AvatarId} from './types.ts';
import type {DailyGame} from './daily.ts';

export type MatchProof={playId:string;peerId:string;countryId:CountryId;at:string;questionIds:string[];simulated?:true;demoAnswers?:Record<string,string>};
export type ChatMessage={id:string;from:'you'|'demo';body:string;at:string};
export type ChatThread={peerId:string;active:boolean;messages:ChatMessage[]};
export type Meetup={id:string;peerId:string;countryId:CountryId;venueId:VenueId;when:string;youAccepted:boolean;peerAccepted:boolean;status:'proposed'|'confirmed'|'declined'|'cancelled';createdAt:string;spotId?:string};
export type SocialState={version:1;dmReadIds?:Record<string,string[]>;proofs:MatchProof[];threads:Record<string,ChatThread>;meetups:Meetup[];focusCountryId:CountryId|null;exploredAttractionIds?:string[];revealedPeerIds?:string[]};
export type Connection={peer:DemoPeer;countryId:CountryId;matches:number;firstAt:string;lastAt:string;chatUnlocked:boolean;simulated:boolean};
export function emptySocial():SocialState{return {version:1,proofs:[],threads:{},meetups:[],focusCountryId:null,exploredAttractionIds:[],revealedPeerIds:[]};}
const validDate=(value:unknown):value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value));
function peerFor(id:string,band:AgeBand,blocked:string[]=[]){return band!=='10-12'&&!blocked.includes(id)?demoPeers.find(p=>p.id===id&&p.ageBand===band):undefined;}
export function readSocial(value:unknown):SocialState{
 const raw=value as Partial<SocialState>|null;if(!raw||typeof raw!=='object')return emptySocial();
 const result=emptySocial(),seen=new Set<string>();result.focusCountryId=countryById(raw.focusCountryId)?.id??null;
 for(const p of Array.isArray(raw.proofs)?raw.proofs:[]){
  if(!p||typeof p.playId!=='string'||!p.playId||typeof p.peerId!=='string'||!validDate(p.at)||!Array.isArray(p.questionIds)||p.questionIds.length!==3||new Set(p.questionIds).size!==3||!p.questionIds.every(id=>typeof id==='string'&&!!questionById(id)))continue;
  const peer=demoPeers.find(peer=>peer.id===p.peerId),country=countryByName(peer?.country),key=`${p.playId}:${p.peerId}`;
  if(!peer||!country||country.id!==p.countryId||seen.has(key))continue;
  if(Object.hasOwn(p,'simulated')&&p.simulated!==true)continue;const demoAnswers=p.simulated===true?Object.fromEntries(p.questionIds.map(id=>[id,p.demoAnswers?.[id]])):undefined;if(demoAnswers&&Object.values(demoAnswers).some(a=>typeof a!=='string'||!a.trim()||a.length>40))continue;result.proofs.push({playId:p.playId,peerId:peer.id,countryId:country.id,at:p.at,questionIds:[...p.questionIds],...(p.simulated===true?{simulated:true as const,demoAnswers:demoAnswers as Record<string,string>}:{})});seen.add(key);
 }
 for(const [id,thread]of Object.entries(raw.threads??{})){
  if(!demoPeers.some(p=>p.id===id)||!thread||typeof thread!=='object')continue;
  const messageIds=new Set<string>();const messages:ChatMessage[]=[];
  for(const m of Array.isArray(thread.messages)?thread.messages:[]){if(m&&typeof m.id==='string'&&!messageIds.has(m.id)&&(m.from==='you'||m.from==='demo')&&typeof m.body==='string'&&m.body.trim()&&m.body.length<=280&&validDate(m.at)){messages.push({id:m.id,from:m.from,body:m.body,at:m.at});messageIds.add(m.id);}}
  result.threads[id]={peerId:id,active:thread.active===true,messages};
 }
 if(raw.dmReadIds&&typeof raw.dmReadIds==='object'){
  result.dmReadIds={};for(const [id,values]of Object.entries(raw.dmReadIds)){
   const incoming=new Set(result.threads[id]?.messages.filter(m=>m.from==='demo').map(m=>m.id)??[]);
   if(Array.isArray(values)&&demoPeers.some(p=>p.id===id))result.dmReadIds[id]=[...new Set(values.filter((id):id is string=>typeof id==='string'&&incoming.has(id)))].slice(-300);
  }
 }
 const plans=new Set<string>();
 for(const m of Array.isArray(raw.meetups)?raw.meetups:[]){const peer=m&&typeof m.peerId==='string'?demoPeers.find(p=>p.id===m.peerId):undefined;
  if(!peer||!isAdult(peer.ageBand)||typeof m.id!=='string'||plans.has(m.id)||countryByName(peer.country)?.id!==m.countryId||!publicVenue(m.venueId)||!validDate(m.when)||!validDate(m.createdAt)||!['proposed','confirmed','declined','cancelled'].includes(m.status))continue;
  const you=m.youAccepted===true,other=m.peerAccepted===true;
  result.meetups.push({id:m.id,peerId:peer.id,countryId:countryByName(peer.country)!.id,venueId:m.venueId,when:m.when,createdAt:m.createdAt,...(attractionById(m.spotId??'')?.countryId===m.countryId?{spotId:m.spotId}:{}),youAccepted:you,peerAccepted:other,status:m.status==='confirmed'&&!(you&&other)?'proposed':m.status});plans.add(m.id);
 }
 result.exploredAttractionIds=[...new Set((Array.isArray(raw.exploredAttractionIds)?raw.exploredAttractionIds:[]).filter(id=>typeof id==='string'&&attractionById(id)))];
 result.revealedPeerIds=[...new Set((Array.isArray(raw.revealedPeerIds)?raw.revealedPeerIds:[]).filter(id=>typeof id==='string'&&demoPeers.some(p=>p.id===id)))];
 return result;
}
export function knownConnectionIds(social:SocialState,band:AgeBand,blocked:string[]=[]):string[]{return [...new Set(social.proofs.filter(p=>peerFor(p.peerId,band,blocked)).map(p=>p.peerId))];}
export function connections(social:SocialState,band:AgeBand,blocked:string[]=[]):Connection[]{return knownConnectionIds(social,band,blocked).map(id=>{const proofs=social.proofs.filter(p=>p.peerId===id),fixture=peerFor(id,band,blocked)!,simulated=proofs.some(p=>p.simulated===true),demoAnswers=Object.assign({},...proofs.filter(p=>p.simulated===true).map(p=>p.demoAnswers)),peer=simulated?{...fixture,answers:{...fixture.answers,...demoAnswers}}:fixture,matches=new Set(proofs.map(p=>p.playId)).size;return {peer,countryId:countryByName(peer.country)!.id,matches,firstAt:proofs[0].at,lastAt:proofs.at(-1)!.at,chatUnlocked:matches>=5,simulated};}).sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)||a.peer.id.localeCompare(b.peer.id));}
export function connectionFor(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[]):Connection|undefined{return connections(social,band,blocked).find(c=>c.peer.id===peerId);}
export function recordConnections(social:SocialState,game:DailyGame,band:AgeBand,matches:Match[]):SocialState{
 if(band==='10-12'||game.active||!game.lastCompletedAt||!validDate(game.lastCompletedAt)||game.lastQuestionIds.length!==3||game.played<1)return social;
 const playId=`${game.played}:${game.lastCompletedAt}:${game.lastQuestionIds.join('.')}`,existing=new Set(social.proofs.map(p=>`${p.playId}:${p.peerId}`)),proofs=[...social.proofs];
 for(const m of matches){const peer=peerFor(m.peer.id,band),country=countryByName(peer?.country),key=`${playId}:${m.peer.id}`;
  if(new Set(proofs.filter(p=>p.peerId===m.peer.id).map(p=>p.playId)).size>=5)continue;
  if(!peer||!country||m.shared!==3||m.total!==3||m.sharedIds.length!==3||new Set(m.sharedIds).size!==3||!m.sharedIds.every(id=>game.lastQuestionIds.includes(id))||existing.has(key))continue;
  const demoAnswers=m.simulated===true?Object.fromEntries(game.lastQuestionIds.map(id=>[id,m.peer.answers[id]])):undefined;if(demoAnswers&&Object.values(demoAnswers).some(a=>typeof a!=='string'||!a.trim()||a.length>40))continue;proofs.push({playId,peerId:peer.id,countryId:country.id,at:game.lastCompletedAt,questionIds:[...game.lastQuestionIds],...(m.simulated===true?{simulated:true as const,demoAnswers}:{})});existing.add(key);
 }
 return proofs.length===social.proofs.length?social:{...social,proofs};
}
export function countryProgress(social:SocialState,passport:PassportState,band:AgeBand,countryId:CountryId){
 const people=connections(social,band).filter(c=>c.countryId===countryId),privateVisits=passport.journeys.filter(j=>j.source==='private-trip'&&countryForCity(j.cityId)?.id===countryId).length;
 const count=band==='10-12'?privateVisits:people.length;
 return {country:countryById(countryId)!,count,target:COUNTRY_PEOPLE_TARGET,unlocked:count>=COUNTRY_PEOPLE_TARGET,people};
}
export function countryCollection(social:SocialState,passport:PassportState,band:AgeBand){return COUNTRIES.map(c=>countryProgress(social,passport,band,c.id));}
export function socialStats(social:SocialState,passport:PassportState,band:AgeBand,blocked:string[]=[]){const all=countryCollection(social,passport,band),friends=connections(social,band,blocked);return {countries:all.filter(c=>c.count>0).length,passports:all.filter(c=>c.unlocked).length,friends:friends.length,chatReady:friends.filter(f=>f.chatUnlocked).length,totalCountries:COUNTRIES.length};}
export function latestPlayConnections(social:SocialState,game:DailyGame,band:AgeBand,blocked:string[]=[]){const playId=`${game.played}:${game.lastCompletedAt}:${game.lastQuestionIds.join('.')}`;const ids=new Set(social.proofs.filter(p=>p.playId===playId).map(p=>p.peerId));return connections(social,band,blocked).filter(c=>ids.has(c.peer.id));}
export function canChat(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[]):boolean{return !!connectionFor(social,peerId,band,blocked)?.chatUnlocked;}
export function startDemoChat(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[],now=new Date()):SocialState{
 if(!canChat(social,peerId,band,blocked))throw new Error('Match with this Roamie five times to chat.');
 if(social.threads[peerId]?.active)return social;
 const message:ChatMessage={id:`hello:${peerId}`,from:'demo',body:connectionFor(social,peerId,band,blocked)?.simulated?`Hi! Welcome to ${countryById(connectionFor(social,peerId,band,blocked)!.countryId)!.city}. Ask me about a place you’d like to explore.`:'Five matches. A new conversation. ✨',at:now.toISOString()};
 return {...social,threads:{...social.threads,[peerId]:{peerId,active:true,messages:social.threads[peerId]?.messages.length?social.threads[peerId].messages:[message]}}};
}
export function sendDemoMessage(social:SocialState,peerId:string,band:AgeBand,body:string,blocked:string[]=[],now=new Date()):SocialState{
 if(!canChat(social,peerId,band,blocked)||!social.threads[peerId]?.active)throw new Error('This conversation is unavailable.');
 const text=body.trim();if(!text||text.length>280)throw new Error('Write a message of 1–280 characters.');
 const thread=social.threads[peerId],sequence=thread.messages.length,friend=connectionFor(social,peerId,band,blocked)!,places=attractionsForCountry(friend.countryId),place=places.find(p=>text.toLocaleLowerCase().includes(p.name.toLocaleLowerCase()))??places[Math.floor(sequence/2)%places.length],replies=friend.simulated?[`City tip: ${place.fact}`.slice(0,280)]:['Same brain again 😄','What was your favourite question?','That’s a good one! ✨'];
 const messages=[...thread.messages,{id:`${now.getTime()}:${sequence}:you`,from:'you' as const,body:text,at:now.toISOString()},{id:`${now.getTime()}:${sequence}:demo`,from:'demo' as const,body:replies[Math.floor(sequence/2)%replies.length],at:now.toISOString()}];
 return {...social,threads:{...social.threads,[peerId]:{...thread,messages}}};
}
export function isAdult(band:AgeBand):boolean{return band==='18-20'||band==='21-24'||band==='25-30';}
export function canPlanMeetup(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[]):boolean{return isAdult(band)&&canChat(social,peerId,band,blocked)&&social.threads[peerId]?.active===true;}
export function localDateValue(date:Date):string{return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function meetingDateTime(day:string,time:string,timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Choose a date and time.');
 const [year,month,date]=day.split('-').map(Number),[hour,minute]=time.split(':').map(Number),wanted=Date.UTC(year,month-1,date,hour,minute),check=new Date(wanted);
 if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==date)throw new Error('Choose a valid date.');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=(at:number)=>Object.fromEntries(formatter.formatToParts(new Date(at)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 let cursor=wanted;for(let i=0;i<4;i++){const p=parts(cursor),offset=wanted-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);if(!offset)break;cursor+=offset;}
 const p=parts(cursor);if(p.year!==year||p.month!==month||p.day!==date||p.hour!==hour||p.minute!==minute)throw new Error('This local time does not exist. Choose another time.');
 return new Date(cursor).toISOString();
}
export function proposeDemoMeetup(social:SocialState,peerId:string,band:AgeBand,venueId:VenueId,when:string,blocked:string[]=[],now=new Date()):SocialState{
 if(!canPlanMeetup(social,peerId,band,blocked))throw new Error('Meetup planning is available to connected adults.');
 if(!publicVenue(venueId))throw new Error('Choose a public meeting place.');
 const date=Date.parse(when);if(!Number.isFinite(date)||date<now.getTime()+5*60_000||date>now.getTime()+366*86400_000)throw new Error('Choose a future time within one year.');
 if(social.meetups.some(m=>m.peerId===peerId&&m.venueId===venueId&&m.when===new Date(date).toISOString()&&m.status==='proposed'))return social;
 const countryId=connectionFor(social,peerId,band,blocked)!.countryId,id=`plan:${peerId}:${now.getTime()}:${social.meetups.length}`;
 const meeting:Meetup={id,peerId,countryId,venueId,when:new Date(date).toISOString(),youAccepted:true,peerAccepted:false,status:'proposed',createdAt:now.toISOString()};
 return {...social,meetups:[...social.meetups,meeting]};
}
export function respondToDemoMeetup(social:SocialState,id:string,band:AgeBand,accepted:boolean,blocked:string[]=[]):SocialState{
 const plan=social.meetups.find(m=>m.id===id);if(!plan||!canPlanMeetup(social,plan.peerId,band,blocked)||plan.status!=='proposed')throw new Error('This plan is unavailable.');
 return {...social,meetups:social.meetups.map(m=>m.id===id?{...m,peerAccepted:accepted,status:accepted&&m.youAccepted?'confirmed':'declined'}:m)};
}
export function cancelDemoMeetup(social:SocialState,id:string,band:AgeBand,blocked:string[]=[]):SocialState{
 const plan=social.meetups.find(m=>m.id===id);if(!plan||!canPlanMeetup(social,plan.peerId,band,blocked))throw new Error('This plan is unavailable.');
 return {...social,meetups:social.meetups.map(m=>m.id===id?{...m,status:'cancelled',youAccepted:false,peerAccepted:false}:m)};
}
export function weeklyNewRymzis(social:SocialState,band:AgeBand,now=new Date()):number{const first=new Map<string,string>();for(const p of social.proofs){if(peerFor(p.peerId,band)&&(!first.has(p.peerId)||Date.parse(p.at)<Date.parse(first.get(p.peerId)!)))first.set(p.peerId,p.at);}return [...first.values()].filter(at=>Date.parse(at)<=now.getTime()&&passportWeek(new Date(at))===passportWeek(now)).length;}
export type SocialCrewRow={id:string;name:string;avatar:AvatarId;rymzis:number;rank:number;you:boolean};
export function socialCrew(social:SocialState,profile:Profile,now=new Date()):SocialCrewRow[]{
 if(profile.ageBand==='10-12')return [];
 const seed=[...`${passportWeek(now)}:${profile.ageBand}`].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
 const rows:Omit<SocialCrewRow,'rank'>[]=demoPeers.filter(p=>p.ageBand===profile.ageBand&&/^\d+-\d+-\d+$/.test(p.id)).slice(0,6).map((p,i)=>({id:p.id,name:p.name,avatar:p.avatar,rymzis:3+(seed+i*11)%24,you:false}));
 rows.push({id:'you',name:'You',avatar:profile.avatar,rymzis:weeklyNewRymzis(social,profile.ageBand,now),you:true});
 return rows.sort((a,b)=>b.rymzis-a.rymzis||Number(b.you)-Number(a.you)||a.id.localeCompare(b.id)).map(row=>({...row,rank:1+rows.filter(other=>other.rymzis>row.rymzis).length}));
}

export function disconnectPeer(social:SocialState,peerId:string):SocialState{
 return {...social,threads:social.threads[peerId]?{...social.threads,[peerId]:{...social.threads[peerId],active:false}}:social.threads,meetups:social.meetups.map(plan=>plan.peerId===peerId&&(plan.status==='proposed'||plan.status==='confirmed')?{...plan,status:'cancelled',youAccepted:false,peerAccepted:false}:plan)};
}
