import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {palSummaries,worldPlaces,type PreviewState} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';

export function NativeExploreAchievements({state}:{state:PreviewState}){
 const places=worldPlaces(state).filter(p=>p.uncovered),privateOnly=state.profile?.ageBand==='10-12';
 const pals=palSummaries(state),connections=privateOnly?new Set([...(state.social.exploredAttractionIds??[]),...(state.launch?.places??[])]).size:pals.length;
 const placeWord=places.length===1?'place':'places',connectionWord=privateOnly?(connections===1?'spot saved':'spots saved'):(connections===1?'pal connected':'pals connected');
 return <View style={S.hero}>
  <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={S.globe}><Ionicons name="globe-outline" size={143} color="#C8BEFF14"/></View>
  <Text accessibilityRole="header" style={S.heading}>Your world.</Text>
  <View accessible accessibilityLabel={`${places.length} ${placeWord} unlocked. ${connections} ${privateOnly?connectionWord:`${connections===1?'pal':'pals'} across ${places.length} ${placeWord}`}.`} style={S.metrics}>
   <View style={S.metric}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={S.placeNumber}>{places.length}</Text><Text style={S.label}>{placeWord} unlocked</Text></View>
   <View style={S.metric}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={S.palNumber}>{connections}</Text><Text style={S.label}>{connectionWord}</Text></View>
  </View>
  {places.length>0&&<View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={S.route}>{places.slice(0,4).map((place,index)=><React.Fragment key={place.country.id}>
   {index>0&&<View style={S.connector}/>}
   <View style={S.stamp}><Text style={S.flag}>{place.country.flag}</Text><View style={S.check}><Ionicons name="checkmark" size={8} color={C.primaryInk}/></View></View>
  </React.Fragment>)}{places.length>4&&<Text style={S.more}>+{places.length-4}</Text>}<View style={S.routeEnd}/><Ionicons name="sparkles-outline" size={17} color={C.accent}/></View>}
 </View>;
}

const S=StyleSheet.create({
 hero:{position:'relative',gap:14,paddingTop:3,paddingBottom:17,overflow:'hidden'},
 heading:{fontSize:29,lineHeight:36,fontWeight:'600',letterSpacing:-.9,color:C.ink},
 globe:{position:'absolute',right:-15,top:6,transform:[{rotate:'-15deg'}]},
 metrics:{flexDirection:'row',gap:18},
 metric:{flex:1,gap:1},
 placeNumber:{fontSize:67,lineHeight:76,letterSpacing:-3,fontWeight:'600',color:C.accent,fontVariant:['tabular-nums']},
 palNumber:{fontSize:67,lineHeight:76,letterSpacing:-3,fontWeight:'600',color:C.lavender,fontVariant:['tabular-nums']},
 label:{fontSize:15,lineHeight:22,fontWeight:'500',color:C.muted},
 route:{flexDirection:'row',alignItems:'center',gap:7,paddingTop:3},
 stamp:{width:37,height:37,borderRadius:13,borderWidth:1,borderColor:'#465840',backgroundColor:C.surface,alignItems:'center',justifyContent:'center'},
 flag:{fontSize:21,lineHeight:28},
 check:{position:'absolute',right:-3,bottom:-3,width:13,height:13,borderRadius:7,borderWidth:2,borderColor:C.ground,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
 connector:{height:1,width:11,backgroundColor:C.line},
 routeEnd:{height:1,flex:1,minWidth:12,marginLeft:4,backgroundColor:C.line},
 more:{fontSize:13,color:C.lavender},
});
