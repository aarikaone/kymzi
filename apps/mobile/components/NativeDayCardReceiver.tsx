import React,{useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {answerFriendInvite,dayCardPicks,friendScore,inviteQuestions,palFindingProgress,receiverPreviewProfile,receiverPreviewReply,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import {NativePerfectDayCard,NativePerfectDayPlay} from './NativePerfectDay';
import {nativeChallengeCrypto} from './launchCrypto';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

export function NativeDayCardReceiver({state,invite,onComplete,onReturn}:{state:PreviewState;invite:FriendInvite;onComplete:(reply:FriendReply)=>Promise<void>;onReturn:()=>void}) {
 const insets=useSafeAreaInsets(),avatarSize=Math.min(145,(useWindowDimensions().width-86)/2),[guest]=useState(()=>receiverPreviewProfile(state,invite)),[reply,setReply]=useState(()=>receiverPreviewReply(state,invite));
 const [answers,setAnswers]=useState(['','','']),[index,setIndex]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<FriendReply|undefined>(undefined),lock=useRef(false),alive=useRef(true),questions=inviteQuestions(invite);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function next(){
  if(lock.current||!answers[index])return;
  if(index<2){setIndex(i=>i+1);return;}
  lock.current=true;setBusy(true);setError('');
  try{
   const result=pending.current??await answerFriendInvite(invite,guest,answers,nativeChallengeCrypto);
   pending.current=result;
   if(!alive.current)return;
   await onComplete(result);
   if(alive.current)setReply(result);
  }catch(e){if(alive.current)setError((e as Error).message);}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 if(!reply)return <NativePerfectDayPlay questions={questions} index={index} answer={answers[index]} answers={Object.fromEntries(questions.map((q,i)=>[q.id,answers[i]]))} onSelect={value=>{if(!lock.current){pending.current=undefined;setAnswers(v=>v.map((a,i)=>i===index?value:a));}}} onNext={()=>void next()} busy={busy} finalLabel="See our day cards" header={<><Text style={S.from}>A DAY CARD FROM #{invite.person.name}</Text>{!!error&&<Text accessibilityRole="alert" style={{color:'#F0C5A5',fontSize:13}}>{error}</Text>}</>}/>;
 const score=friendScore(reply),progress=palFindingProgress(state);
 return <View style={{flex:1,backgroundColor:C.ground}}><ScrollView contentContainerStyle={S.body} showsVerticalScrollIndicator={false}><Text style={S.from}>{progress.unlocked?'GLOBAL PLAY IS ON':'YOUR FIRST CIRCLE'}</Text><View accessibilityLabel="You and your new friend" style={S.pair}><NativeImage source={avatarImages[invite.person.avatar]} accessibilityLabel={`Sender ${invite.person.name}`} style={[S.avatar,{width:avatarSize,height:avatarSize}]}/><View style={S.seal}><Ionicons name="checkmark" size={23} color={C.primaryInk}/></View><NativeImage source={avatarImages[reply.person.avatar]} accessibilityLabel={`Receiver ${reply.person.name}`} style={[S.avatar,{width:avatarSize,height:avatarSize}]}/></View><Text accessibilityRole="header" style={S.heading}>{progress.unlocked?'Your world.':'You’re'}{'\n'}<Text style={{color:C.accent}}>{progress.unlocked?'Wide open.':'connected.'}</Text></Text><Text style={S.copy}>{progress.unlocked?'Five friends. A whole world to explore.':`Added to #${invite.person.name}’s circle.`}</Text><Text style={{fontSize:13,color:C.lavender}}>{progress.unlocked?'5/5 connected':`${progress.count} added · ${progress.remaining} left`}</Text><Text style={{fontSize:13,color:C.lavender}}>{score.shared}/3 shared picks</Text>{answers.every(Boolean)&&<View style={{width:'100%',marginTop:5}}><NativePerfectDayCard compact picks={dayCardPicks(invite.ids,answers)} title="Your kind of day."/></View>}</ScrollView><View style={{paddingHorizontal:22,paddingTop:12,paddingBottom:Math.max(insets.bottom,18)}}><Pressable cssInterop={false} accessibilityRole="button" onPress={onReturn} style={S.button}><Text style={S.buttonText}>{progress.unlocked?'Open my world':'Back to my profile'}</Text><Ionicons name="arrow-forward" size={21} color={C.primaryInk}/></Pressable></View></View>;
}
export function NativeReceiverCircle({state,onOpen,onInvite,onFeed}:{state:PreviewState;onOpen:()=>void;onInvite?:()=>void;onFeed?:()=>void}) {
 const {friends,count,remaining,canPlay}=palFindingProgress(state),faceSize=Math.min(47,(useWindowDimensions().width-110)/5);if(!count)return null;
 return <View accessibilityLabel="Your circle" style={S.circle}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><Text style={{fontSize:22,color:C.ink,fontWeight:'500'}}>Your circle</Text><View style={[S.global,canPlay&&{borderColor:'#688948',backgroundColor:'#293A20'}]}><Ionicons name={canPlay?'globe-outline':'lock-closed-outline'} size={13} color={canPlay?C.accent:C.lavender}/><Text style={{fontSize:11,color:canPlay?C.accent:C.lavender}}>Global {canPlay?'ON':'OFF'}</Text></View></View>
  <View style={{flexDirection:'row',alignItems:'center',gap:14}}><Text style={{fontSize:22,color:'#809671'}}><Text style={{fontSize:43,lineHeight:49,fontWeight:'600',color:C.accent}}>{count}</Text>/5</Text><View style={{gap:4}}><Text style={{fontSize:17,color:C.ink}}>{count} {count===1?'friend':'friends'}</Text><Text style={{fontSize:13,color:C.muted}}>{canPlay?'Your world is open.':`${count} added · ${remaining} left`}</Text></View></View>
  <View style={{flexDirection:'row',gap:8,justifyContent:'space-between'}}>{Array.from({length:5},(_,i)=>{const reply=friends[i];return reply?<Pressable key={reply.person.name} cssInterop={false} accessibilityRole="button" accessibilityLabel={`View friend ${reply.person.name}`} onPress={onOpen} style={{flex:1,minWidth:0,alignItems:'center',gap:7}}><View style={[S.friend,{width:faceSize,height:faceSize}]}><NativeImage source={avatarImages[reply.person.avatar]} style={{width:faceSize-2,height:faceSize-2,resizeMode:'contain'}}/><View style={S.friendSeal}><Ionicons name="checkmark" size={9} color={C.primaryInk}/></View></View><Text numberOfLines={1} adjustsFontSizeToFit style={{fontSize:9,color:C.muted}}>#{reply.person.name}</Text></Pressable>:<View key={i} accessibilityLabel="Friend slot available" style={{flex:1,alignItems:'center'}}><View style={[S.friend,{width:faceSize,height:faceSize,borderStyle:'dashed',borderColor:'#42533B',backgroundColor:'transparent'}]}><Ionicons name="add" size={20} color="#708163"/></View></View>;})}</View>
  <View accessibilityRole="progressbar" accessibilityLabel="Global unlock progress" accessibilityValue={{min:0,max:5,now:count}} style={{flexDirection:'row',gap:5}}>{Array.from({length:5},(_,i)=><View key={i} style={{height:4,flex:1,borderRadius:2,backgroundColor:i<count?C.accent:'#33452E'}}/>)}</View>
  {(onInvite||onFeed)&&<View style={{gap:4}}>{!canPlay&&onInvite&&<Pressable cssInterop={false} accessibilityRole="button" onPress={onInvite} style={S.button}><Text style={S.buttonText}>Invite next friend</Text><Ionicons name="arrow-forward" size={18} color={C.primaryInk}/></Pressable>}{onFeed&&<Pressable cssInterop={false} accessibilityRole="button" onPress={onFeed} style={canPlay?S.button:{minHeight:44,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8}}><Text style={canPlay?S.buttonText:{fontSize:14,color:C.accent}}>{canPlay?'Explore the world':'See your feed'}</Text><Ionicons name="arrow-forward" size={18} color={canPlay?C.primaryInk:C.accent}/></Pressable>}</View>}
 </View>;
}
const S=StyleSheet.create({
 from:{fontSize:10,lineHeight:16,letterSpacing:1,color:C.lavender},body:{flexGrow:1,alignItems:'center',gap:14,padding:22,paddingTop:18},
 pair:{flexDirection:'row',alignItems:'center',justifyContent:'center',width:'100%',paddingTop:12},avatar:{resizeMode:'contain'},
 seal:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:C.accent},
 heading:{fontSize:46,lineHeight:47,fontWeight:'600',letterSpacing:-2,color:C.ink,textAlign:'center'},copy:{fontSize:14,lineHeight:20,color:C.muted,textAlign:'center'},
 button:{minHeight:54,borderRadius:17,padding:14,backgroundColor:C.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},buttonText:{fontSize:18,fontWeight:'600',color:C.primaryInk},
 circle:{gap:16,padding:17,borderWidth:1,borderColor:'#4D6142',borderRadius:23,backgroundColor:'#141C15'},global:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:6,borderWidth:1,borderColor:'#504564',borderRadius:10,backgroundColor:'#252031'},friend:{height:47,width:47,borderWidth:1,borderColor:'#6A8653',borderRadius:17,backgroundColor:'#223025',alignItems:'center',justifyContent:'center'},friendSeal:{position:'absolute',bottom:-3,right:-3,width:20,height:20,borderWidth:3,borderColor:'#141C15',borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:C.accent},
});
