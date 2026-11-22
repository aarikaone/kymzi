import {PageHeading} from './Typography';
import {NativeImage as Image} from './NativeImage';
import React from 'react';
import {Pressable,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {AVATARS,PROFILE_SETUP_COPY,type Profile} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';
type Props={profile:Profile;editing:boolean;busy:boolean;error:string;onAvatar:()=>void;onSave:()=>void};
export function NativeProfileSetup({profile,editing,busy,error,onAvatar,onSave}:Props){
 const viewport=useWindowDimensions(),insets=useSafeAreaInsets(),available=viewport.height-insets.top-insets.bottom-104;
 const short=available<570,size=Math.min(viewport.width-64,short?220:280),character=AVATARS.find(a=>a.id===profile.avatar)!;
 return <View style={{flex:1,minHeight:short?400:460,gap:short?16:22}}>
  <View style={{gap:7}}><PageHeading accessibilityRole="header" style={{fontSize:short?32:36,lineHeight:short?38:42,fontWeight:'600',letterSpacing:-1.4,color:C.ink}}>{PROFILE_SETUP_COPY.title}</PageHeading><View style={{flexDirection:'row',alignItems:'center',gap:11}}><Text style={{fontSize:13,lineHeight:22,color:C.muted}}>Your ID</Text><Text accessibilityLabel="Your assigned nickname" style={{fontSize:18,lineHeight:22,fontWeight:'500',fontVariant:['tabular-nums'],letterSpacing:1,color:C.accent}}>#{profile.name}</Text></View></View>
  <View style={{flex:1,minHeight:size+54,alignItems:'center',justifyContent:'center'}}><Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Change character" disabled={busy} onPress={onAvatar} style={{width:size+2,borderWidth:1,borderColor:'#526E44',borderRadius:short?30:38,backgroundColor:'#1C2A1B',overflow:'hidden',opacity:busy?.5:1}}>
   <Image source={avatarImages[profile.avatar]} accessibilityLabel={`${character.name} avatar`} style={{width:size,height:size,resizeMode:'contain'}}/>
   <View style={{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:12,backgroundColor:'#223021'}}><Ionicons name="color-palette-outline" size={20} color={C.accent}/><Text style={{fontSize:18,fontWeight:'500',color:C.accent}}>Choose avatar</Text><Ionicons name="arrow-forward" size={18} color={C.accent}/></View>
  </Pressable></View>
  <View style={{marginTop:'auto',paddingTop:4,gap:12}}>{!!error&&<Text accessibilityRole="alert" style={{fontSize:13,lineHeight:19,color:'#F0C5A5'}}>{error}</Text>}<Pressable cssInterop={false} accessibilityRole="button" disabled={busy} onPress={onSave} style={({pressed})=>({minHeight:58,borderRadius:20,padding:14,backgroundColor:pressed?C.primaryPressed:C.primary,alignItems:'center',justifyContent:'center',opacity:busy?.4:1})}><Text style={{fontSize:20,fontWeight:'600',color:C.primaryInk}}>{editing?'Save changes':'Next'}</Text></Pressable></View>
 </View>;
}
