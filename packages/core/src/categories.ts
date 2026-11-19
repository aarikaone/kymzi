import { questionBank } from './questions.ts';
import type { AgeBand } from './types.ts';

export const PLAY_CATEGORIES = [
  {id:'food',introIds:['K0001','K0002','K0003'],name:'Food mood',tag:'Snack thoughts',color:'#ffe2cf',themes:['Food and flavour']},
  {id:'animals',introIds:['K0101','K0102','K0103'],name:'Wild things',tag:'Wild little minds',color:'#e3ddff',themes:['Animals and imaginary pets']},
  {id:'what-if',introIds:['K0301','K0302','K0303'],name:'What if?',tag:'Make it impossible',color:'#d8efdb',themes:['Magic and impossible worlds','Objects with personalities','Quick associations and tiny mysteries']},
  {id:'your-world',introIds:['K0201','K0202','K0203'],name:'Your world',tag:'Everyday, reimagined',color:'#d8e8f3',themes:['Nature and weather','Journeys and places','Friendship and belonging','Style and self expression','Independent living and home','Weekends and everyday choices']},
  {id:'play',introIds:['K0601','K0602','K0603'],name:'Play mode',tag:'Press your fun button',color:'#f6dbdb',themes:['Games and playful challenges','Music and entertainment','Digital life and inventions']},
  {id:'future-you',introIds:['K0501','K0502','K0503'],name:'Future you',tag:'Dream a little bigger',color:'#e8dff5',themes:['Making and creating','School and learning adventures','Future skills and possibilities','College and study communities','First jobs and teamwork','Projects and personal growth']},
] as const;
export type PlayCategoryId = typeof PLAY_CATEGORIES[number]['id'];
export function categoryQuestions(id:string,band:AgeBand){const category=PLAY_CATEGORIES.find(c=>c.id===id);return category?questionBank.filter(q=>(category.themes as readonly string[]).includes(q.category)&&q.min_age<=Number(band.split('-')[0])):[];}
export function availableCategories(band:AgeBand){return PLAY_CATEGORIES.filter(c=>categoryQuestions(c.id,band).length>=3);}

const COUNTRIES=[{name:'Japan',flag:'🇯🇵'},{name:'Brazil',flag:'🇧🇷'},{name:'India',flag:'🇮🇳'},{name:'Canada',flag:'🇨🇦'},{name:'France',flag:'🇫🇷'},{name:'Korea',flag:'🇰🇷'},{name:'UK',flag:'🇬🇧'},{name:'Australia',flag:'🇦🇺'}];
export function demoActivity(random:()=>number=Math.random){
  const countries=[...COUNTRIES];for(let i=countries.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[countries[i],countries[j]]=[countries[j],countries[i]];}
  const count=1+Math.floor(random()*4),partial=random()<.4,matches=partial?1:2+Math.floor(random()*2);
  return {title:partial?'1 almost Kymzi':`${matches} Kymzis found`,countries:countries.slice(0,count),partial};
}
