import React from 'react';
import {Image,Pressable,StyleSheet,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Profile} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {KymziSymbol} from './Brand';
import {NIGHT_THEME as C} from './theme';

export function NativeProfileShortcut({profile,onPress}:{profile:Profile;onPress:()=>void}){
 const photo=profile.photo?.ageBand===profile.ageBand?profile.photo.image:undefined;
 return <Pressable accessibilityRole="button" accessibilityLabel="Your profile" accessibilityHint="Your anonymous character and personal photo" onPress={onPress} style={S.profile}>
  <View style={S.anonymous}>
   <Image source={avatarImages[profile.avatar]} accessible={false} style={S.character}/>
   <View style={S.privateBadge}><Ionicons name="lock-closed" size={7} color={C.primaryInk}/></View>
  </View>
  <View style={S.portrait}>
   {photo?<Image source={{uri:photo}} accessible={false} style={S.photo}/>:<Ionicons name="person-outline" size={20} color={C.lavender}/>}
   {!photo&&<View style={S.addBadge}><Ionicons name="add" size={9} color={C.ground}/></View>}
  </View>
 </Pressable>;
}

export function NativeKymziTitle(){
 return <View accessible accessibilityRole="header" accessibilityLabel="Kymzi" style={S.title}><KymziSymbol size={42}/></View>;
}

export function NativeNotificationShortcut({visible,unread,onPress}:{visible:boolean;unread:boolean;onPress:()=>void}){
 return <View style={S.right}>{visible&&<Pressable accessibilityRole="button" accessibilityLabel={unread?'Notifications, new updates':'Notifications'} onPress={onPress} style={S.bell}>
  <Ionicons name="notifications-outline" size={22} color={C.ink}/>
  {unread&&<View style={S.unread}/>}
 </Pressable>}</View>;
}

const S=StyleSheet.create({
 profile:{width:80,height:44,position:'relative'},
 anonymous:{position:'absolute',left:1,top:5,width:35,height:35,borderRadius:18,borderWidth:1,borderColor:C.accent,backgroundColor:C.raised,alignItems:'center',justifyContent:'center'},
 character:{width:32,height:32,resizeMode:'contain'},
 privateBadge:{position:'absolute',left:-1,bottom:-1,width:14,height:14,borderRadius:8,borderWidth:2,borderColor:C.ground,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
 portrait:{position:'absolute',left:29,top:2,width:40,height:40,borderRadius:21,borderWidth:2,borderColor:C.lavender,backgroundColor:'#252232',alignItems:'center',justifyContent:'center'},
 photo:{width:36,height:36,borderRadius:18},
 addBadge:{position:'absolute',right:-1,bottom:-1,width:14,height:14,borderRadius:8,borderWidth:2,borderColor:C.ground,backgroundColor:C.lavender,alignItems:'center',justifyContent:'center'},
 title:{width:48,height:44,alignItems:'center',justifyContent:'center'},
 right:{width:80,height:44,alignItems:'flex-end',justifyContent:'center'},
 bell:{width:44,height:44,borderRadius:17,borderWidth:1,borderColor:'#354039',backgroundColor:C.surface,alignItems:'center',justifyContent:'center'},
 unread:{position:'absolute',right:9,top:9,width:7,height:7,borderRadius:4,borderWidth:1,borderColor:C.surface,backgroundColor:C.accent},
});
