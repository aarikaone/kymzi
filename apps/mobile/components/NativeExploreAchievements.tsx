import {StyleSheet,Text,View} from 'react-native';
import {palSummaries,worldPlaces,type PreviewState} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';
export function NativeExploreAchievements({state}:{state:PreviewState}){
 const places=worldPlaces(state).filter(p=>p.uncovered),privateOnly=state.profile?.ageBand==='10-12',connections=privateOnly?new Set([...(state.social.exploredAttractionIds??[]),...(state.launch?.places??[])]).size:palSummaries(state).length;
 return <View accessibilityLabel={`${places.length} ${places.length===1?'place':'places'} unlocked. ${connections} ${privateOnly?'spots saved':'Roamies connected'}.`} style={S.row}><View style={S.metric}><Text style={S.number}>{places.length}</Text><Text style={S.label}>{places.length===1?'city unlocked':'cities unlocked'}</Text></View><View style={S.metric}><Text style={[S.number,{color:C.lavender}]}>{connections}</Text><Text style={S.label}>{privateOnly?'spots saved':'Roamies'}</Text></View></View>;
}
const S=StyleSheet.create({row:{flexDirection:'row',gap:18,paddingBottom:14,borderBottomWidth:1,borderColor:C.line},metric:{flex:1,flexDirection:'row',alignItems:'center',gap:10},number:{fontSize:36,lineHeight:43,fontWeight:'600',letterSpacing:-1,color:C.accent,fontVariant:['tabular-nums']},label:{fontSize:12,lineHeight:18,color:C.muted,flexShrink:1}});
