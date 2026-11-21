import {NativeImage as Image} from './NativeImage';
import React from 'react';
import {Pressable,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AVATARS,type Profile} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';
export function NativeProfileIdentities({profile,onEdit}:{profile:Profile;onEdit:()=>void}){
 const character=AVATARS.find(a=>a.id===profile.avatar)!;
 return <View accessibilityLabel="Your avatar" style={{width:'100%',alignItems:'center',paddingBottom:4}}><Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Edit avatar" onPress={onEdit} style={{width:132,height:132,borderRadius:44,borderWidth:1,borderColor:'#6C8952',backgroundColor:'#233025',alignItems:'center',justifyContent:'center'}}>
  <Image source={avatarImages[profile.avatar]} accessibilityLabel={`${character.name} avatar`} style={{width:126,height:126,resizeMode:'contain'}}/>
  <View style={{position:'absolute',right:-3,bottom:-3,height:30,width:30,borderRadius:15,borderWidth:3,borderColor:C.ground,backgroundColor:C.action,alignItems:'center',justifyContent:'center'}}><Ionicons name="color-palette-outline" size={15} color={C.accent}/></View>
 </Pressable></View>;
}
