import {TRAVEL_COLLECTIONS} from './question-library.ts';
import {dailyStatus,hasDailyProgress,remainingDailyPlays} from './daily.ts';
import {palFindingProgress} from './launch.ts';
import type {PreviewState} from './preview.ts';
import type {PlayCategoryId} from './categories.ts';

export function placePlayAvailability(state:PreviewState,now=new Date()){
 const progress=palFindingProgress(state),resume=hasDailyProgress(state.daily),remaining=remainingDailyPlays(state.daily,now);
 const locked=!!state.launch&&progress.eligible&&!progress.canPlay;
 return {profileReady:!!state.profile,privateMode:state.profile?.ageBand==='10-12',remaining,resume,locked,friendsNeeded:Math.max(0,5-progress.count),disabled:!locked&&!resume&&(remaining===0||dailyStatus(state.daily,now).kind==='waiting'),category:state.daily.active?.categoryId};
}
export type PlacePlayAvailability=ReturnType<typeof placePlayAvailability>;
export function placePlayCards(category:string){
 const first:PlayCategoryId=/park|beach|garden|zoo|nature|trail/.test(category)?'animals':/food|cafe|restaurant|market/.test(category)?'food':'play';
 const order:PlayCategoryId[]=[first,'what-if','your-world','food','animals','play','future-you'];
 return [...new Set(order)].map(id=>TRAVEL_COLLECTIONS.find(card=>card.id===id)!);
}
