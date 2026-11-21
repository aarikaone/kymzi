import {palFor,palSummaries,type PalSummary} from './pal-loop.ts';
import {connectionFor,type ChatMessage,type ChatThread} from './social.ts';
import {attractionsForCountry} from './attractions.ts';
import type {PreviewState} from './preview.ts';
export const PAL_DM_QUESTIONS=[
 {id:'restaurants',label:'Best restaurants',group:'Eat',question:'Which restaurants would you recommend in {city}?'},
 {id:'food',label:'Must-try food',group:'Eat',question:'What local food should I try first in {city}?'},
 {id:'coffee',label:'Good coffee',group:'Eat',question:'Where is your favourite café in {city}?'},
 {id:'hidden',label:'Hidden gems',group:'Explore',question:'What is a hidden gem most visitors miss in {city}?'},
 {id:'day',label:'One-day plan',group:'Explore',question:'How would you spend one perfect day in {city}?'},
 {id:'sunset',label:'Sunset spots',group:'Explore',question:'Where is the best place to watch the sunset in {city}?'},
 {id:'views',label:'Best views',group:'Explore',question:'Where can I find your favourite view of {city}?'},
 {id:'weekend',label:'This weekend',group:'Explore',question:'What is happening in {city} this weekend?'},
 {id:'markets',label:'Local markets',group:'Explore',question:'Which local markets are worth exploring in {city}?'},
 {id:'art',label:'Art & museums',group:'Explore',question:'Which museum or art space do you love in {city}?'},
 {id:'walk',label:'Parks & walks',group:'Explore',question:'Where do you go for a peaceful walk in {city}?'},
 {id:'rain',label:'Rainy-day picks',group:'Visit',question:'What would you do on a rainy day in {city}?'},
 {id:'transport',label:'Getting around',group:'Visit',question:'What is the easiest way to get around {city}?'},
 {id:'season',label:'When to visit',group:'Visit',question:'When is your favourite time of year to visit {city}?'},
 {id:'customs',label:'Local know-how',group:'Visit',question:'What should a first-time visitor know about {city}?'},
] as const;
export function palDMQuestion(id:string,city:string){const q=PAL_DM_QUESTIONS.find(q=>q.id===id);if(!q)throw new Error('Choose a question.');return q.question.replaceAll('{city}',city);}
function greeting(state:PreviewState,pal:PalSummary):ChatMessage[]{
 const connection=connectionFor(state.social,pal.id,state.profile!.ageBand,state.blocked);
 if(!connection?.simulated)return [];
 return [{id:`city-hello:${pal.id}`,from:'demo',body:`Hey! Ask me about the little places I love in ${pal.city}.`,at:connection.lastAt}];
}
export function palDMMessages(state:PreviewState,id:string):ChatMessage[]{const pal=palFor(state,id);return pal?(state.social.threads[id]?.messages??greeting(state,pal)):[];}
export function palDMUnread(state:PreviewState,id:string){const seen=new Set(state.social.dmReadIds?.[id]??[]);return palDMMessages(state,id).filter(m=>m.from==='demo'&&!seen.has(m.id)).length;}
export function palConversations(state:PreviewState){return palSummaries(state).map(pal=>{const messages=palDMMessages(state,pal.id),last=messages.at(-1);return {pal,messages,last,unread:palDMUnread(state,pal.id)};}).sort((a,b)=>Number(b.unread>0)-Number(a.unread>0)||(Date.parse(b.last?.at??'')||0)-(Date.parse(a.last?.at??'')||0));}
export function pendingPalMessages(state:PreviewState){return palConversations(state).reduce((sum,c)=>sum+c.unread,0);}
export function markPalDMRead(state:PreviewState,id:string):PreviewState{
 const pal=palFor(state,id);if(!pal)throw new Error('This pal is unavailable.');
 const messages=palDMMessages(state,id),seen=messages.filter(m=>m.from==='demo').map(m=>m.id).slice(-300),thread=state.social.threads[id];
 if(thread?.active&&JSON.stringify(seen)===JSON.stringify(state.social.dmReadIds?.[id]??[]))return state;
 return {...state,social:{...state.social,threads:{...state.social.threads,[id]:{peerId:id,active:true,messages}},dmReadIds:{...state.social.dmReadIds,[id]:seen}}};
}
export function sendPalDM(state:PreviewState,id:string,body:string,now=new Date()):PreviewState{
 const pal=palFor(state,id);if(!pal)throw new Error('This pal is unavailable.');
 const text=body.trim();if(!text||text.length>280)throw new Error('Write a message of 1–280 characters.');
 const current=markPalDMRead(state,id),thread=current.social.threads[id],sequence=thread.messages.length;
 const messages:ChatMessage[]=[...thread.messages,{id:`dm:${now.getTime()}:${sequence}:you`,from:'you',body:text,at:now.toISOString()}];
 const connection=connectionFor(state.social,id,state.profile!.ageBand,state.blocked);
 if(connection?.simulated){const place=attractionsForCountry(pal.countryId)[Math.floor(sequence/2)%4];messages.push({id:`dm:${now.getTime()}:${sequence}:pal`,from:'demo',body:`City tip: ${place.fact} Want to explore more around ${place.name}?`.slice(0,280),at:now.toISOString()});}
 const next:ChatThread={...thread,messages:messages.slice(-300)};
 return markPalDMRead({...current,social:{...current.social,threads:{...current.social.threads,[id]:next}}},id);
}
