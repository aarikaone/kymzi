import {GemImpactLink} from './GemImpactLink';
import {MapShareTask} from './MapShares';
import {shareTaskProgress,type PreviewState} from '@rymzi/core';
import {CheckInGoal} from './PlaceExperience';
export function MonthlyPhotoGoal({state,now,onCapture}:{state:PreviewState;now:Date;onCapture:()=>void}){return <CheckInGoal state={state} now={now} onOpen={onCapture}/>;}
export function MonthlyTasks({state,now,onCapture}:{state:PreviewState;now:Date;onCapture:()=>void}){return <MapShareTask state={state} now={now} onShare={onCapture} onOpen={onCapture} onLeaderboard={onCapture}/>;}
export function ProfileActivity({state,now,onTasks}:{state:PreviewState;now:Date;onTasks:()=>void}){return <GemImpactLink state={state} onOpen={onTasks}/>;}
