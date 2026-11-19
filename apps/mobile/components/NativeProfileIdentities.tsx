import React from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AVATARS,type Profile} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

export function NativeProfileIdentities({profile,onEdit}:{profile:Profile;onEdit:()=>void}){
 const character=AVATARS.find(a=>a.id===profile.avatar)!,privateOnly=profile.ageBand==='10-12';
 return <View accessibilityLabel="Your two avatars" style={{width:'100%',maxWidth:330,flexDirection:'row',justifyContent:'center',gap:20,paddingBottom:4}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Edit anonymous character" onPress={onEdit} style={{flex:1,maxWidth:150,alignItems:'center',gap:5,paddingVertical:4}}>
   <View style={{width:104,height:104,borderRadius:52,borderWidth:1,borderColor:'#284C32',backgroundColor:'#233025',alignItems:'center',justifyContent:'center',marginBottom:5}}>
    <Image source={avatarImages[profile.avatar]} accessibilityLabel={`${character.name} anonymous character`} style={{width:96,height:96,resizeMode:'contain'}}/>
    <View style={{position:'absolute',right:0,bottom:0,height:28,width:28,borderRadius:14,borderWidth:3,borderColor:C.ground,backgroundColor:C.action,alignItems:'center',justifyContent:'center'}}><Ionicons name="shield-checkmark-outline" size={14} color={C.ink}/></View>
   </View>
   <Text style={{fontSize:17,fontWeight:'600',color:C.ink,textAlign:'center'}}>Anonymous</Text><Text style={{fontSize:12,lineHeight:18,color:C.muted,textAlign:'center'}}>{privateOnly?'Only you':'Always visible'}</Text>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={profile.photo?'Edit my avatar':'Add my avatar'} onPress={onEdit} style={{flex:1,maxWidth:150,alignItems:'center',gap:5,paddingVertical:4}}>
   <View style={{width:104,height:104,borderRadius:52,borderWidth:1,borderStyle:profile.photo?'solid':'dashed',borderColor:'#D5F88F',backgroundColor:'#243226',alignItems:'center',justifyContent:'center',marginBottom:5}}>
    {profile.photo?<Image source={{uri:profile.photo.image}} accessibilityLabel="Your personal avatar" style={{width:96,height:96,borderRadius:48}}/>:<Ionicons name="person-outline" size={40} color={C.blue}/>}
    <View style={{position:'absolute',right:0,bottom:0,height:28,width:28,borderRadius:14,borderWidth:3,borderColor:C.ground,backgroundColor:C.actionBlue,alignItems:'center',justifyContent:'center'}}><Ionicons name={profile.photo?'camera-outline':'add'} size={14} color={C.ink}/></View>
   </View>
   <Text style={{fontSize:17,fontWeight:'600',color:C.ink,textAlign:'center'}}>My avatar</Text><Text style={{fontSize:12,lineHeight:18,color:C.muted,textAlign:'center'}}>{profile.photo?(privateOnly?'Only you':'Reveals at 3 matches'):'Add your photo'}</Text>
  </Pressable>
 </View>;
}
