import {questionBank} from './questions.ts';
import {travelQuestionBank} from './travel-question-bank.ts';
import type {Question,QuestionChoice} from './types.ts';
export const allQuestions=[...questionBank,...travelQuestionBank];
const byId=new Map(allQuestions.map(q=>[q.id,q]));
export const questionById=(id:string)=>byId.get(id);
export const TRAVEL_INTRO_IDS=['T0001','T0241','T0521'] as const;
export const TRAVEL_INVITE_SETS=[TRAVEL_INTRO_IDS,['T0002','T0242','T0522'],['T0003','T0243','T0523']] as const;
export const isTravelInviteSet=(ids:readonly string[])=>TRAVEL_INVITE_SETS.some(set=>set.join('.')===ids.join('.'));
export const TRAVEL_COLLECTIONS=[
 {id:'food',name:'Little stops',tag:'Bites. Sips. Good detours.',artworkId:'fr-3'},
 {id:'animals',name:'Outside days',tag:'A little closer to nature.',artworkId:'br-3'},
 {id:'what-if',name:'Wander freely',tag:'Follow your curiosity.',artworkId:'kr-3'},
 {id:'your-world',name:'Slow moments',tag:'Take the quieter turn.',artworkId:'jp-4'},
 {id:'play',name:'City stories',tag:'Streets with something to say.',artworkId:'gb-4'},
 {id:'future-you',name:'Afterglow',tag:'Stay for the light.',artworkId:'jp-3'},
] as const;
/** Older saved games and seven-day invite links keep their IDs and have six reviewed choices. */
export function questionChoices(question:Question):QuestionChoice[]{
 if(question.choices?.length===6)return question.choices;
 const pool=question.category.includes('Food')?['Popcorn','Noodles','Toast','Fries','Fruit','Dumplings']:question.category.includes('Animals')?['Cat','Owl','Fox','Goose','Dog','Rabbit']:question.category.includes('Magic')?['Teleportation','Flying','Time travel','Invisibility','Super speed','Talking to animals']:['Beach','Garden','Market','Museum','Coffee','Music'];
 const art=['br-3','jp-4','gb-4','gb-2','fr-3','kr-3'];return pool.map((label,i)=>({id:`legacy-${i}`,label,artworkId:art[i]}));
}
export function validQuestionChoice(question:Question,value:string){return !question.choices||question.choices.some(c=>c.label===value);}
export function selectedQuestionChoice(question:Question,value:string){return questionChoices(question).find(c=>c.label===value);}
export function dayCardPicks(ids:readonly string[],answers:readonly string[]){return ids.flatMap((id,i)=>{const q=questionById(id);if(!q||!answers[i])return [];const c=selectedQuestionChoice(q,answers[i]);return [{id,label:answers[i],artworkId:c?.artworkId??'jp-4'}];});}
