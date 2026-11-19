import {COUNTRIES} from './countries.ts';
import {beginDaily,hasDailyProgress,type DailyGame} from './daily.ts';
import type {AgeBand} from './types.ts';
import type {PlayCategoryId} from './categories.ts';
/** Pick the hidden encounter destination once; drafts keep their original play. */
export function beginSurpriseDaily(game:DailyGame,band:AgeBand,now=new Date(),categoryId?:PlayCategoryId,random:()=>number=Math.random):DailyGame{
 if(hasDailyProgress(game))return beginDaily(game,band,now,categoryId);
 const draw=random(),fraction=Number.isFinite(draw)?Math.max(0,Math.min(1-Number.EPSILON,draw)):0,country=COUNTRIES[Math.floor(fraction*COUNTRIES.length)];
 return beginDaily(game,band,now,categoryId,country.id);
}
