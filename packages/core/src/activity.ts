import {demoActivity} from './categories.ts';
const offsets=[8,245,45,125];
export function demoActivityUpdate(now=new Date(),sequence=0){return {...demoActivity(),occurredAt:new Date(now.getTime()-offsets[sequence%offsets.length]*1000).toISOString()};}
export function activityAge(at:string,now=new Date()):string{const seconds=Math.max(0,Math.floor((now.getTime()-Date.parse(at))/1000));if(!Number.isFinite(seconds)||seconds<20)return 'a few sec ago';if(seconds<60)return `${seconds} sec ago`;if(seconds<3600)return `${Math.floor(seconds/60)} min ago`;if(seconds<86400)return `${Math.floor(seconds/3600)} hr ago`;const days=Math.floor(seconds/86400);return `${days} ${days===1?'day':'days'} ago`;}
