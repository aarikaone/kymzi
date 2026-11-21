import {NativeImage as Image} from './NativeImage';
import React from 'react';
import {Pressable,StyleSheet,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Profile} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {KymziSymbol} from './Brand';
import {NIGHT_THEME as C} from './theme';

export function NativeProfileShortcut({profile,onPress}:{profile:Profile;onPress:()=>void}){
 return <View style={{width:80,height:44,justifyContent:'center'}}><Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Your profile" onPress={onPress} style={S.profile}><Image source={avatarImages[profile.avatar]} accessible={false} style={S.character}/></Pressable></View>;
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
 profile:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:C.accent,backgroundColor:C.raised,alignItems:'center',justifyContent:'center'},
 character:{width:40,height:40,resizeMode:'contain'},
 title:{width:48,height:44,alignItems:'center',justifyContent:'center'},
 right:{width:80,height:44,alignItems:'flex-end',justifyContent:'center'},
 bell:{width:44,height:44,borderRadius:17,borderWidth:1,borderColor:'#354039',backgroundColor:C.surface,alignItems:'center',justifyContent:'center'},
 unread:{position:'absolute',right:9,top:9,width:7,height:7,borderRadius:4,borderWidth:1,borderColor:C.surface,backgroundColor:C.accent},
});
