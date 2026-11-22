import {PageHeading} from './Typography';
import React,{useRef} from 'react';
import {Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {dailyStatus,countdownParts,hasDailyProgress,remainingDailyPlays,type PreviewState} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';
type Props={visible:boolean;state:PreviewState;now:Date;onClose:()=>void;onStart:()=>void};
export function NativeUnlockSheet({visible,state,now,onClose,onStart}:Props){
 const insets=useSafeAreaInsets(),{height}=useWindowDimensions(),startOnDismiss=useRef(false),resume=hasDailyProgress(state.daily),status=dailyStatus(state.daily,now),wait=countdownParts(status.remainingMs),waiting=!resume&&(status.kind==='waiting'||remainingDailyPlays(state.daily,now)===0),privateOnly=state.profile?.ageBand==='10-12';
 const steps=privateOnly?[['Answer 3 travel questions','Six choices. Just tap.'],['Uncover a surprise city','Somewhere you haven’t explored.'],['Make a little discovery','Explore its places privately.']]:[['Answer 3 travel questions','Six choices. Just tap.'],['Find your kind of Roamie','Match 2 of 3 answers to connect.'],['Uncover their city','Say hello. Explore their places.']];
 function close(){startOnDismiss.current=false;onClose();}
 function start(){if(waiting||startOnDismiss.current)return;startOnDismiss.current=true;onClose();if(Platform.OS!=='ios'){startOnDismiss.current=false;onStart();}}
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={close} onDismiss={()=>{if(startOnDismiss.current){startOnDismiss.current=false;onStart();}}}>
  <View style={S.backdrop}><Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={[S.sheet,{height:Math.min(height*.88,650),paddingBottom:Math.max(18,insets.bottom)}]}>
   <View style={S.handle}/><View style={S.top}><Pressable accessibilityRole="button" accessibilityLabel="Close unlock" onPress={close} style={S.close}><Ionicons name="close" size={23} color={C.ink}/></Pressable></View>
   <ScrollView style={{flex:1,minHeight:0}} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
    <PageHeading accessibilityRole="header" style={S.title}>3 picks.<Text style={{color:C.accent}}>{'\n'}A surprise city.</Text></PageHeading><Text style={S.copy}>{privateOnly?'A little curiosity takes you somewhere new.':'Your next Roamie could be anywhere.'}</Text>
    <View style={S.example}><Text style={S.exampleLabel}>YOUR KIND OF DAY</Text><View style={S.words}>{['Coffee','Beach','Music'].map(word=><View key={word} style={S.word}><Text style={S.wordText}>{word}</Text></View>)}</View></View>
    <View style={S.steps}>{steps.map(([title,detail],i)=><View key={title} style={S.step}><View style={S.number}><Text style={S.numberText}>{i+1}</Text></View><View style={{flex:1,gap:4}}><Text style={S.stepTitle}>{title}</Text><Text style={S.stepDetail}>{detail}</Text></View></View>)}</View>
   </ScrollView>
   <View style={S.footer}>{waiting&&<Text accessibilityLiveRegion="polite" style={S.wait}>{status.kind==='waiting'?`Next play in ${wait.hours}h ${wait.minutes}m`:'All 5 plays used today.'}</Text>}<Pressable accessibilityRole="button" disabled={waiting} onPress={start} style={[S.primary,waiting&&{opacity:.45}]}><Text style={S.primaryText}>{waiting?'Back soon':resume?'Continue my answers':'Let’s play'}</Text><Ionicons name="arrow-forward" size={22} color={C.primaryInk}/></Pressable></View>
  </View></View>
 </Modal>;
}
const S=StyleSheet.create({
 backdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'#000000A8'},sheet:{borderTopLeftRadius:32,borderTopRightRadius:32,paddingHorizontal:24,paddingTop:10,backgroundColor:C.surface,borderWidth:1,borderBottomWidth:0,borderColor:'#3C493C'},handle:{width:35,height:4,borderRadius:3,backgroundColor:'#687164',alignSelf:'center',marginBottom:4},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:9},eyebrow:{fontSize:10,lineHeight:16,letterSpacing:1.25,color:C.muted,flex:1},close:{width:44,height:44,alignItems:'center',justifyContent:'center'},content:{gap:17,paddingTop:5,paddingBottom:16},title:{fontSize:36,lineHeight:42,fontWeight:'600',letterSpacing:-1.3,color:C.ink},copy:{fontSize:17,lineHeight:25,color:C.muted},example:{gap:8,paddingVertical:4},exampleLabel:{fontSize:10,lineHeight:16,letterSpacing:1.5,color:C.muted},words:{flexDirection:'row',gap:8},word:{flex:1,minHeight:46,borderRadius:15,borderWidth:1,borderColor:'#617B47',backgroundColor:'#283923',alignItems:'center',justifyContent:'center',padding:8},wordText:{fontSize:18,fontWeight:'600',color:C.accent},steps:{gap:17,paddingTop:3},step:{flexDirection:'row',alignItems:'center',gap:13},number:{width:33,height:33,borderRadius:12,backgroundColor:'#302B3C',alignItems:'center',justifyContent:'center'},numberText:{fontSize:15,fontWeight:'600',color:C.lavender},stepTitle:{fontSize:18,lineHeight:25,fontWeight:'600',color:C.ink},stepDetail:{fontSize:14,lineHeight:21,color:C.muted},footer:{flexShrink:0,paddingTop:10,gap:10},primary:{minHeight:59,padding:15,borderRadius:19,backgroundColor:C.accent,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},primaryText:{fontSize:19,fontWeight:'600',color:C.primaryInk},wait:{fontSize:14,lineHeight:21,color:C.muted,textAlign:'center'},
});
