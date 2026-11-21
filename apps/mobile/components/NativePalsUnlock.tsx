import React,{type ReactNode} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {palFindingProgress,type PreviewState} from '@rymzi/core';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

export function NativePalsUnlock({state,onInvite,onFriend,children}:{state:PreviewState;onInvite:()=>void;onFriend:()=>void;children?:ReactNode}) {
 const {friends,count,remaining}=palFindingProgress(state),faceSize=Math.min(49,(useWindowDimensions().width-120)/5);
 return <ScrollView style={{flex:1,backgroundColor:C.ground}} contentContainerStyle={S.page} showsVerticalScrollIndicator={false}>
  {children}
  <View accessibilityLabel="Unlock Global Roamies" style={S.global}>
   <View style={S.row}><View style={S.globe}><Ionicons name="globe-outline" size={30} color={C.accent}/></View><Text accessibilityRole="header" style={S.globalTitle}>Global Roamies</Text><View style={S.off}><Ionicons name="lock-closed-outline" size={11} color={C.lavender}/><Text style={S.offText}>OFF</Text></View></View>
   <View style={{flexDirection:'row',justifyContent:'space-between',gap:10,paddingTop:3}}>{Array.from({length:5},(_,i)=>{const reply=friends[i];return reply?<Pressable cssInterop={false} key={reply.person.name} accessibilityRole="button" accessibilityLabel={`View friend ${reply.person.name}`} onPress={onFriend} style={[S.friend,{width:faceSize,height:faceSize}]}><NativeImage source={avatarImages[reply.person.avatar]} style={{width:faceSize-2,height:faceSize-2,resizeMode:'contain'}}/><View style={S.joined}><Ionicons name="checkmark" size={11} color={C.primaryInk}/></View></Pressable>:<View key={i} accessibilityLabel="Friend slot available" style={[S.friend,S.empty,{width:faceSize,height:faceSize}]}><Text style={{fontSize:16,color:'#8F9C80'}}>{i+1}</Text></View>;})}</View>
   <View accessibilityRole="progressbar" accessibilityLabel="Global unlock progress" accessibilityValue={{min:0,max:5,now:count,text:`${count} friends connected, ${remaining} more to unlock Global Roamies`}} style={{flexDirection:'row',gap:6,paddingTop:3}}>{Array.from({length:5},(_,i)=><View key={i} style={[S.bar,i<count&&{backgroundColor:C.accent,borderColor:C.accent}]}/>)}</View>
   <View style={[S.row,{marginTop:-7,justifyContent:'flex-start',gap:12}]}><Text style={S.count}>{remaining}</Text><Text style={{fontSize:21,lineHeight:26,color:C.ink}}>{remaining===1?'friend':'friends'} to go</Text></View>
   <Text style={{fontSize:15,lineHeight:22,color:C.muted,marginTop:-8}}>Bring 5 friends. Meet new Roamies around the world.</Text>
   <Pressable cssInterop={false} accessibilityRole="button" onPress={onInvite} style={S.invite}><Text style={S.inviteTitle}>Invite a friend</Text><Ionicons name="arrow-forward" size={20} color={C.primaryInk}/></Pressable>
  </View>
 </ScrollView>;
}
const S=StyleSheet.create({
 page:{flexGrow:1,paddingHorizontal:22,paddingTop:18,paddingBottom:22,gap:15},title:{fontSize:38,lineHeight:44,fontWeight:'600',letterSpacing:-1.3,color:C.ink,marginBottom:4},
 invite:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:14,borderRadius:17,backgroundColor:C.accent},inviteTitle:{fontSize:18,fontWeight:'600',color:C.primaryInk},
 global:{gap:22,paddingHorizontal:18,paddingTop:21,paddingBottom:18,borderWidth:1,borderColor:'#4D6540',borderRadius:25,backgroundColor:'#182119'},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:11},globe:{width:48,height:48,borderWidth:1,borderColor:'#576C44',borderRadius:18,backgroundColor:'#273520',alignItems:'center',justifyContent:'center'},globalTitle:{flex:1,fontSize:24,lineHeight:29,fontWeight:'500',letterSpacing:-.7,color:C.ink},off:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:6,paddingHorizontal:8,borderWidth:1,borderColor:'#65577A',borderRadius:9,backgroundColor:'#2A2433'},offText:{fontSize:10,letterSpacing:.7,color:C.lavender},
 friend:{borderWidth:1,borderColor:'#78935A',borderRadius:18,backgroundColor:'#283923',alignItems:'center',justifyContent:'center'},empty:{borderStyle:'dashed',borderColor:'#536047',backgroundColor:'#121913'},joined:{position:'absolute',right:-3,bottom:-4,width:23,height:23,borderWidth:3,borderColor:'#182119',borderRadius:12,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},bar:{flex:1,height:9,borderRadius:4,borderWidth:1,borderColor:'#435639',backgroundColor:'#34432D'},count:{fontSize:46,lineHeight:50,letterSpacing:-1.3,fontWeight:'600',color:C.accent},
});
