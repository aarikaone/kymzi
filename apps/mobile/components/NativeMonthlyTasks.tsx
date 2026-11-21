import {NativeGemImpactLink} from './NativeGemImpactLink';
import {NativeMapShareTask} from './NativeMapShares';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {shareTaskProgress,type PreviewState} from '@rymzi/core';
import {NativeCheckInGoal} from './NativePlaceExperience';
export function NativeMonthlyPhotoGoal({state,now,onCapture}:{state:PreviewState;now:Date;onCapture:()=>void}){return <NativeCheckInGoal state={state} now={now} onOpen={onCapture}/>;}
export function NativeMonthlyTasks({state,now,onCapture}:{state:PreviewState;now:Date;onCapture:()=>void}){return <NativeMapShareTask state={state} now={now} onShare={onCapture} onOpen={onCapture} onLeaderboard={onCapture}/>;}
export function NativeProfileActivity({state,now,onTasks}:{state:PreviewState;now:Date;onTasks:()=>void}){return <NativeGemImpactLink state={state} onOpen={onTasks}/>;}
