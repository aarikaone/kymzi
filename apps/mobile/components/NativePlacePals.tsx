import {PageHeading} from './Typography';
import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {palsForPlace,type PlaceFeedItem,type PreviewState} from '@rymzi/core';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

type Props={state:PreviewState;place:PlaceFeedItem;onPal:(id:string)=>void};
export function NativePlacePals({state,place,onPal}:Props) {
  if(state.profile?.ageBand==='10-12')return null;
  const pals=palsForPlace(state,place);
  return <View accessibilityLabel={`Roamies in ${place.location.city}`} style={S.section}>
    <View style={S.heading}><PageHeading accessibilityRole="header" style={S.title}>Roamies in {place.location.city}</PageHeading><Text style={S.count}>{pals.length}</Text></View>
    {pals.length?<ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} style={S.rail} contentContainerStyle={S.people}>
      {pals.map(pal=><Pressable key={pal.id} accessibilityRole="button" accessibilityLabel={`Open ${pal.alias} in ${pal.city}`} onPress={()=>onPal(pal.id)} style={S.person}>
        <View style={[S.avatar,pal.id===place.peerId&&{borderColor:C.lavender}]}><NativeImage source={avatarImages[pal.imageAvatar]} accessible={false} style={S.character}/></View>
        <Text numberOfLines={1} style={S.alias}>{pal.alias}</Text>
      </Pressable>)}
    </ScrollView>:<Text style={S.empty}>No Roamies here yet.</Text>}
  </View>;
}
const S=StyleSheet.create({
  section:{gap:10,paddingTop:3},heading:{flexDirection:'row',alignItems:'center',gap:9},
  title:{fontSize:20,lineHeight:26,fontWeight:'600',letterSpacing:-.3,color:C.ink,flexShrink:1},
  count:{fontSize:12,lineHeight:17,color:C.lavender,backgroundColor:'#292435',paddingHorizontal:7,paddingVertical:2,borderRadius:8,overflow:'hidden'},
  rail:{flexGrow:0},people:{gap:14,paddingVertical:2},person:{width:70,alignItems:'center',gap:7,paddingBottom:4},
  avatar:{width:58,height:58,borderRadius:22,borderWidth:1,borderColor:'#516048',backgroundColor:'#202A21',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  character:{width:54,height:54,resizeMode:'contain'},alias:{fontSize:13,lineHeight:18,color:C.ink},empty:{fontSize:13,lineHeight:19,color:C.muted},
});
