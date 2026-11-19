import { questionBank } from './questions.ts';
/** Local preview allowance. Weeks start Monday at 00:00 UTC. */
export const WEEKLY_IDEA_LIMIT=3;
export type WeeklyIdeas={week:string;used:number;revealed:Record<string,string>};
const answers:Record<string,string>={K0001:'Popcorn',K0101:'Cat',K0301:'Teleportation'};
const nudges:Record<string,string>={
 'Food and flavour':'Picture a snack you’d pick right now.',
 'Animals and imaginary pets':'Picture an animal you know really well.',
 'Nature and weather':'Think of a tiny detail from outdoors.',
 'Magic and impossible worlds':'Give an everyday problem a magical fix.',
 'Objects with personalities':'Imagine that object talking to you.',
 'Making and creating':'Start with one colour, shape or sound.',
 'Games and playful challenges':'Picture playing it with a friend.',
 'Journeys and places':'Picture a place you’d love to explore.',
 'School and learning adventures':'Change one tiny thing in a normal day.',
 'Quick associations and tiny mysteries':'Say your first thought out loud.',
 'Music and entertainment':'Think of something in your playlist.',
 'Digital life and inventions':'Imagine making your favourite app better.',
 'Friendship and belonging':'Think of a small moment with a friend.',
 'Style and self expression':'Choose something that feels like you.',
 'Future skills and possibilities':'Picture a future day you’d look forward to.',
 'College and study communities':'Imagine making an ordinary day easier.',
 'First jobs and teamwork':'Think of a tiny way to help a team.',
 'Independent living and home':'Picture a room that feels like you.',
 'Weekends and everyday choices':'Think of a small thing you enjoy doing.',
 'Projects and personal growth':'Start small, then make the idea bigger.',
};
const ideas=Object.fromEntries(questionBank.map(q=>[q.id,answers[q.id]??nudges[q.category]??'Say your first thought out loud.']));
export function ideaWeek(date=new Date()):string {const monday=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));return monday.toISOString().slice(0,10);}
export function weeklyIdeas(value:unknown,date=new Date()):WeeklyIdeas {const week=ideaWeek(date),source=value as Partial<WeeklyIdeas>|null;if(!source||source.week!==week)return {week,used:0,revealed:{}};const revealed:Record<string,string>={};if(source.revealed&&typeof source.revealed==='object'){for(const [id,idea]of Object.entries(source.revealed)){if(ideas[id]===idea&&Object.keys(revealed).length<WEEKLY_IDEA_LIMIT)revealed[id]=idea;}}const used=Number.isInteger(source.used)?Math.max(0,Math.min(WEEKLY_IDEA_LIMIT,source.used!)):0;return {week,used:Math.max(used,Object.keys(revealed).length),revealed};}
export function hasIdea(id:string):boolean{return !!ideas[id];}
export function requestIdea(value:unknown,id:string,date=new Date()):{usage:WeeklyIdeas;idea?:string}{const usage=weeklyIdeas(value,date);if(usage.revealed[id])return {usage,idea:usage.revealed[id]};if(!ideas[id]||usage.used>=WEEKLY_IDEA_LIMIT)return {usage};const idea=ideas[id];return {idea,usage:{...usage,used:usage.used+1,revealed:{...usage.revealed,[id]:idea}}};}
