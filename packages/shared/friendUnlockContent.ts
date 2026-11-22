import {palFindingProgress,type PreviewState} from '@rymzi/core';
export function friendUnlockContent(state:PreviewState){
 const progress=palFindingProgress(state);
 return {...progress,requirement:progress.canPlay?'Worldwide matching is unlocked.':`Invite ${progress.remaining} more ${progress.remaining===1?'friend':'friends'}.`,explanation:progress.canPlay?'Pick a postcard. Match 2 of 3 answers to connect.':'A friend counts as soon as they join from your invitation. No game needed.',progressLabel:`${progress.count} of ${progress.goal} friends joined`,benefit:'Then find Roamies in cities around the world.'};
}
