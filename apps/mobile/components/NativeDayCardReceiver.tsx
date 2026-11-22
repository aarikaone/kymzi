import {NativeFriendUnlockSheet} from './NativeFriendUnlockSheet';
import {NativeOpenedTravelPostcard,NativeSealedPostcard,NativeTravelInviteIntro} from './NativeTravelPostcard';
import {PageHeading} from './Typography';
import React,{useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {answerFriendInvite,friendScore,inviteQuestions,palFindingProgress,receiverPreviewProfile,receiverPreviewReply,type FriendInvite,type FriendReply,type PreviewState} from '@rymzi/core';
import {NativePerfectDayPlay} from './NativePerfectDay';
import {nativeChallengeCrypto} from './launchCrypto';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

export function NativeDayCardReceiver({state,invite,onComplete,onReturn}:{state:PreviewState;invite:FriendInvite;onComplete:(reply:FriendReply)=>Promise<void>;onReturn:()=>void}) {
 const insets=useSafeAreaInsets(),avatarSize=Math.min(48,(useWindowDimensions().width-86)/2),[guest]=useState(()=>receiverPreviewProfile(state,invite)),[reply,setReply]=useState(()=>receiverPreviewReply(state,invite));
 const [started,setStarted]=useState(false),[answers,setAnswers]=useState(['','','']),[index,setIndex]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
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
 if(!reply&&!started)return <NativeTravelInviteIntro person={invite.person} onStart={()=>setStarted(true)}/>;
 if(!reply)return <NativePerfectDayPlay questions={questions} index={index} answer={answers[index]} answers={Object.fromEntries(questions.map((q,i)=>[q.id,answers[i]]))} onSelect={value=>{if(!lock.current){pending.current=undefined;setAnswers(v=>v.map((a,i)=>i===index?value:a));}}} onNext={()=>void next()} busy={busy} finalLabel="Reveal our match" header={<><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:15,fontWeight:'500',color:C.ink}}>Your travel day</Text><Text style={{fontSize:12,color:C.muted}}>With #{invite.person.name}</Text></View>{!!error&&<Text accessibilityRole="alert" style={{color:'#F0C5A5',fontSize:13}}>{error}</Text>}</>}/>;
 const score=friendScore(reply),progress=palFindingProgress(state),opened=score.connects&&progress.unlocked;
 function retry(){pending.current=undefined;setReply(undefined);setAnswers(['','','']);setIndex(0);setError('');setStarted(true);}
 return <View style={{flex:1,backgroundColor:C.ground}}><ScrollView contentContainerStyle={S.body} showsVerticalScrollIndicator={false}><View accessibilityLabel={score.connects?'You and your new Roamie':'Your travel comparison'} style={S.pair}><NativeImage source={avatarImages[invite.person.avatar]} accessibilityLabel={'Sender '+invite.person.name} style={[S.avatar,{width:avatarSize,height:avatarSize}]}/><View style={S.seal}><Ionicons name={score.connects?'link-outline':'compass-outline'} size={23} color={C.primaryInk}/></View><NativeImage source={avatarImages[reply.person.avatar]} accessibilityLabel={'Receiver '+reply.person.name} style={[S.avatar,{width:avatarSize,height:avatarSize}]}/></View><Text accessibilityLabel={score.percentage+' percent travel match'} style={{fontSize:18,lineHeight:24,fontWeight:'500',letterSpacing:0,color:C.accent}}>{score.percentage}<Text style={{fontSize:14}}>% travel match</Text></Text><PageHeading style={[S.heading,{fontSize:30,lineHeight:36,letterSpacing:-1}]}>{opened?'Your world is open.':score.connects?'You’re connected.':'Different travel vibes.'}</PageHeading><Text style={S.copy}>{opened?'Five Roamies. Global play is on.':score.connects?'Postcard opened. Meet your new Roamie.':'Still sealed. Match 2 of 3 to open it.'}</Text><Text style={{fontSize:13,color:C.lavender}}>{score.shared}/3 shared picks</Text>{score.connects&&<Text style={{fontSize:13,color:C.lavender}}>{progress.count} added · {progress.remaining} left</Text>}{score.connects?<NativeOpenedTravelPostcard reply={reply}/>:<NativeSealedPostcard person={invite.person}/>}</ScrollView><View style={{paddingHorizontal:22,paddingTop:12,paddingBottom:Math.max(insets.bottom,18),gap:6}}>{!score.connects&&<Pressable accessibilityRole="button" onPress={retry} style={S.button}><Text style={S.buttonText}>Try another day</Text><Ionicons name="arrow-forward" size={21} color={C.primaryInk}/></Pressable>}<Pressable accessibilityRole="button" onPress={onReturn} style={score.connects?S.button:{minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={score.connects?S.buttonText:{fontSize:14,color:C.lavender}}>{opened?'Open my world':'Back to my profile'}</Text>{score.connects&&<Ionicons name="arrow-forward" size={21} color={C.primaryInk}/>}</Pressable></View></View>;
}
export function NativeReceiverCircle({state,onOpen,onInvite}:{state:PreviewState;onOpen:()=>void;onInvite?:()=>void;onFeed?:()=>void}){
 const [unlockOpen,setUnlockOpen]=useState(false),{friends,count}=palFindingProgress(state);if(!count)return null;
 return <View accessibilityLabel="Connected roamies"><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={{gap:13,padding:3,paddingBottom:10}}><Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Unlock global play" onPress={()=>setUnlockOpen(true)} style={R.item}><View style={R.unlock}><Ionicons name="add" size={27} color={C.accent}/></View><Text style={R.label}>Unlock</Text><Text style={R.detail}>{count}/5 friends</Text></Pressable>{friends.map(reply=><Pressable cssInterop={false} key={reply.person.name} accessibilityRole="button" accessibilityLabel={'View friend '+reply.person.name} onPress={onOpen} style={R.item}><View style={R.avatar}><NativeImage source={avatarImages[reply.person.avatar]} accessible={false} style={{width:'100%',height:'100%',resizeMode:'contain'}}/></View><Text style={R.label}>#{reply.person.name}</Text><Text style={R.detail}>Roamie</Text></Pressable>)}</ScrollView><NativeFriendUnlockSheet visible={unlockOpen} state={state} onClose={()=>setUnlockOpen(false)} onShare={onInvite??onOpen}/></View>;
}
const S=StyleSheet.create({
 from:{fontSize:10,lineHeight:16,letterSpacing:1,color:C.lavender},body:{flexGrow:1,alignItems:'center',gap:12,padding:22,paddingTop:18},
 pair:{flexDirection:'row',alignItems:'center',justifyContent:'center',width:'100%',paddingTop:0},avatar:{resizeMode:'contain'},
 seal:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:C.accent},
 heading:{fontSize:46,lineHeight:47,fontWeight:'600',letterSpacing:-2,color:C.ink,textAlign:'center'},copy:{fontSize:14,lineHeight:20,color:C.muted,textAlign:'center'},
 button:{minHeight:54,borderRadius:17,padding:14,backgroundColor:C.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},buttonText:{fontSize:18,fontWeight:'600',color:C.primaryInk},
 circle:{gap:16,padding:17,borderWidth:1,borderColor:'#4D6142',borderRadius:23,backgroundColor:'#141C15'},global:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:6,borderWidth:1,borderColor:'#504564',borderRadius:10,backgroundColor:'#252031'},friend:{height:47,width:47,borderWidth:1,borderColor:'#6A8653',borderRadius:17,backgroundColor:'#223025',alignItems:'center',justifyContent:'center'},friendSeal:{position:'absolute',bottom:-3,right:-3,width:20,height:20,borderWidth:3,borderColor:'#141C15',borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:C.accent},
});

const R=StyleSheet.create({item:{width:76,alignItems:'center',gap:5},unlock:{width:66,height:66,borderWidth:1,borderStyle:'dashed',borderColor:'#8EAB6C',borderRadius:25,backgroundColor:'#D5F88F0C',alignItems:'center',justifyContent:'center'},avatar:{width:66,height:66,borderWidth:1,borderColor:'#667F51',borderRadius:25,backgroundColor:'#1B261D',overflow:'hidden'},label:{fontSize:12,lineHeight:18,fontWeight:'600',color:C.ink},detail:{fontSize:10,lineHeight:15,color:C.muted}});
