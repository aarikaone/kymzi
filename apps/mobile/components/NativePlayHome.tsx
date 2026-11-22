import {NativeImage as Image} from './NativeImage';
import {avatarImages as avatars} from './avatarAssets';
import {NativeUnknownPalHero} from './NativeUnknownPalHero';
import {NIGHT_THEME} from './theme';
import {NativeDiscoveryTrail} from './NativeDiscoveryTrail';
import {JOURNEY_COPY} from '@rymzi/core';
import {NativeTravelHero} from './NativeTravelHero';
import React from 'react';
import {Pressable,ScrollView,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {Hand,PageHeading} from './Typography';
import {dailyStatus,countdownParts,nextPlayLabel,remainingDailyPlays,hasDailyProgress,type DailyGame,type PassportState,type SocialState,type Profile,type AvatarId} from '@rymzi/core';
const PAPER='#090C0A',NIGHT='#090C0A',LAVENDER='#D5F88F';
export function NativePalIllustration({avatar='orbit',privatePlay=false}:{avatar?:AvatarId;privatePlay?:boolean}){return <View style={{flex:1,minHeight:86,maxHeight:200,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:7}}><View style={{position:'absolute',left:'6%',right:'6%',top:'35%',bottom:'30%',borderRadius:100,borderWidth:1,borderStyle:'dashed',borderColor:'#D0DEC3',transform:[{rotate:'-13deg'}]}}/><View style={{width:'30%',alignItems:'center',gap:5}}><Image source={avatars[avatar]} accessible={false} style={{height:87,width:'100%',resizeMode:'contain'}}/><Text style={{fontSize:12,color:'#B1BCA8'}}>You</Text></View><View style={{height:63,width:63,borderRadius:40,backgroundColor:'#151B16',alignItems:'center',justifyContent:'center'}}><Ionicons name="globe-outline" size={40} color="#D0DEC3"/><Ionicons name="paper-plane-outline" size={23} color="#9DA994" style={{position:'absolute',top:-7,right:-10,backgroundColor:PAPER}}/></View><View style={{width:'30%',alignItems:'center',gap:5,transform:[{translateY:-7}]}}>{privatePlay?<Ionicons name="business-outline" size={70} color="#D0DEC3"/>:<Image source={avatars[avatar==='sprout'?'sunny':'sprout']} accessible={false} style={{height:87,width:'100%',resizeMode:'contain'}}/>}<Text style={{fontSize:12,color:'#B1BCA8'}}>{privatePlay?'New city':'New Roamie'}</Text></View></View>;}
export function NativePlayHome({game,profile,now,onPlay,onSchedule,community,headerAction}:{game:DailyGame;passport:PassportState;social:SocialState;blocked:string[];profile:Profile;now:Date;onPlay:()=>void;onSchedule:()=>void;onShare:()=>void;onPassport:()=>void;focused:boolean;community?:React.ReactNode;headerAction?:React.ReactNode}){
 const insets=useSafeAreaInsets(),compact=useWindowDimensions().height<700,status=dailyStatus(game,now),waiting=status.kind==='waiting',left=remainingDailyPlays(game,now),resuming=hasDailyProgress(game),time=countdownParts(status.remainingMs),size=compact?38:45,privatePlay=profile.ageBand==='10-12';
 return <ScrollView style={{flex:1,backgroundColor:NIGHT}} contentContainerStyle={{flexGrow:1,paddingHorizontal:24,paddingTop:compact?12:20,paddingBottom:Math.max(19,insets.bottom),gap:compact?15:22}}>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:15}}><PageHeading accessibilityRole="header" style={{flex:1,fontSize:size,lineHeight:size+2,fontWeight:'600',letterSpacing:-1.4,color:'#F1F5EB'}}>{waiting?(privatePlay?'More cities.':'More Roamies.'):resuming?(privatePlay?'Your city':'Your next Roamie'):privatePlay?'Your next':JOURNEY_COPY.title}{`\n`}<Hand style={{fontSize:size*1.25,lineHeight:size*1.29,color:'#D5F88F',letterSpacing:-.8}}>{waiting?'Tomorrow.':resuming?'is waiting.':privatePlay?'city.':JOURNEY_COPY.titleAccent}</Hand></PageHeading>{headerAction}</View><NativeDiscoveryTrail privatePlay={privatePlay}/>
  {waiting?<View style={{flex:1,minHeight:155,alignItems:'center',justifyContent:'center',gap:14}}><Text style={{fontSize:14,color:'#B1BCA8'}}>Back in</Text><Text accessibilityRole="timer" accessibilityLabel="Next game countdown" style={{fontSize:46,fontWeight:'600',letterSpacing:-2,color:'#F1F5EB',fontVariant:['tabular-nums']}}>{time.hours}:{time.minutes}:{time.seconds}</Text><Text style={{fontSize:13,color:'#B1BCA8'}}>{nextPlayLabel(game,now)}</Text></View>:<View style={{flex:1,minHeight:compact?80:120,maxHeight:240,alignItems:'center',justifyContent:'center'}}>{privatePlay?<NativeTravelHero/>:<NativeUnknownPalHero/>}</View>}
  {community&&<View style={{gap:7}}>{community}</View>}
  <View style={{marginTop:'auto',gap:11}}>
   <Text style={{fontSize:15,lineHeight:21,fontWeight:'600',textAlign:'center',color:'#D0DEC3'}}>{left} {left===1?'play':'plays'} left today</Text>
   {waiting?<Pressable accessibilityRole="button" onPress={onSchedule} style={{minHeight:52,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:15,color:LAVENDER}}>Change daily time</Text></Pressable>:<Pressable cssInterop={false} accessibilityRole="button" onPress={onPlay} style={({pressed})=>({minHeight:58,borderRadius:18,backgroundColor:NIGHT_THEME.primary,flexDirection:'row',gap:12,alignItems:'center',justifyContent:'center',padding:14,opacity:pressed?0.82:1})}><Text style={{fontSize:19,fontWeight:'600',color:NIGHT_THEME.primaryInk}}>{resuming?JOURNEY_COPY.resume:privatePlay?JOURNEY_COPY.privateStart:JOURNEY_COPY.start}</Text><Ionicons name="arrow-forward" size={22} color={NIGHT_THEME.primaryInk}/></Pressable>}
  </View>
 </ScrollView>;
}
