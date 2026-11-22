import {NativeImage as Image} from './NativeImage';
import React,{useRef} from 'react';
import {KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Circle} from 'react-native-svg';
import type {AvatarId} from '@rymzi/core';
import {avatarImages} from './avatarAssets';
import {Hand,PageHeading} from './Typography';

type Message={id:string;from:'you'|'pal';text:string;at:string};
type Props={
 alias:string;avatar:AvatarId;yourAvatar:AvatarId;city:string;mode:'pal'|'meetup';messages:Message[];
 draft:string;onDraft:(value:string)=>void;onSend:()=>void;logLabel:string;inputLabel:string;sendLabel:string;
 status:string;remaining?:number;previewLabel?:string;busy?:boolean;error?:string;
 context?:{label:string;detail:string;actionLabel:string;onAction:()=>void};onCheckout?:()=>void;
};
function time(at:string){const date=new Date(at);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(date):'';}
function day(at:string){const date=new Date(at);if(!Number.isFinite(date.getTime()))return '';return date.toDateString()===new Date().toDateString()?'Today':new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(date);}
export function NativeChatRoom({alias,avatar,yourAvatar,city,mode,messages,draft,onDraft,onSend,logLabel,inputLabel,sendLabel,status,remaining,previewLabel,busy=false,error,context,onCheckout}:Props){
 const log=useRef<ScrollView>(null),input=useRef<TextInput>(null),insets=useSafeAreaInsets();
 const ideas=mode==='meetup'?['Hey, roamie 👋','See you at the entrance?','Coffee nearby?']:['Hey, roamie 👋','Your city’s hidden gem?','What should I try first?'];
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={95} style={[S.room,{paddingBottom:Math.max(10,insets.bottom)}]}>
  <View style={S.header}>
   <View style={S.avatar}><Image source={avatarImages[avatar]} accessibilityLabel={`${alias}’s chosen character`} style={S.avatarImage}/><View style={S.avatarBadge}><Ionicons name="sparkles-outline" size={11} color="#211C2B"/></View></View>
   <View style={S.identity}><PageHeading accessibilityRole="header" style={S.alias}>{alias}</PageHeading><View style={S.city}><Ionicons name="location-outline" size={13} color="#ABA8BD"/><Text style={S.cityText}>{city}</Text></View></View>
   {remaining!==undefined?<View accessible accessibilityLabel={`${remaining} minutes of shared check-in left`} style={S.timer}><Svg width={48} height={48} viewBox="0 0 48 48" style={StyleSheet.absoluteFill} rotation={-90}><Circle cx={24} cy={24} r={21} stroke="#3C374C" strokeWidth={2} fill="none"/><Circle cx={24} cy={24} r={21} stroke="#C8BEFF" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(0,Math.min(1,remaining/60))*132} 132`}/></Svg><Text style={S.timerValue}>{remaining}<Text style={S.timerUnit}>min</Text></Text></View>:<View accessibilityLabel="Five matches together" style={S.matchMark}><Text style={S.matchNumber}>5</Text><Ionicons name="sparkles-outline" size={13} color="#D5F88F"/></View>}
  </View>
  <View style={S.status}><View style={S.dot}/><Text style={S.statusText}>{status}</Text>{previewLabel&&<Text style={S.previewLabel}>{previewLabel}</Text>}</View>
  {context&&<Pressable accessibilityRole="button" accessibilityLabel={context.actionLabel} onPress={context.onAction} style={S.context}><View style={S.map}><View style={S.mapRoad}/><View style={[S.mapRoad,{transform:[{rotate:'50deg'}],top:24,height:5}]}/><Ionicons name="location-outline" size={23} color="#D5F88F"/></View><View style={S.contextCopy}><Text style={S.contextLabel}>{context.label}</Text><Text style={S.contextDetail}>{context.detail}</Text></View><Ionicons name="arrow-forward" size={18} color="#C8BEFF"/></Pressable>}
  <ScrollView ref={log} accessibilityLabel={logLabel} style={S.messages} contentContainerStyle={S.messagesContent} onContentSizeChange={()=>log.current?.scrollToEnd({animated:false})} keyboardShouldPersistTaps="handled">
   <View style={S.hello}><View style={S.helloPair}><Image source={avatarImages[yourAvatar]} style={S.helloImage}/><Image source={avatarImages[avatar]} style={[S.helloImage,{marginLeft:-10,backgroundColor:'#24302A',borderColor:'#5E7050'}]}/></View><Hand style={S.helloText}>Say hello.</Hand></View>
   {messages.map((message,i)=>{
    const previous=messages[i-1],newDay=!previous||day(previous.at)!==day(message.at),you=message.from==='you';
    return <React.Fragment key={message.id}>{newDay&&<View style={S.day}><View style={S.dayLine}/><Text style={S.dayText}>{day(message.at)}</Text><View style={S.dayLine}/></View>}<View style={[S.messageRow,you&&S.messageRowYou]}>{!you&&<Image source={avatarImages[avatar]} style={S.messageAvatar}/>}<View style={[S.message,you&&S.messageYou]}><Text style={[S.messageText,you&&S.messageTextYou]}>{message.text}</Text><Text style={[S.messageTime,you&&S.messageTimeYou]}>{time(message.at)}</Text></View></View></React.Fragment>;
   })}
  </ScrollView>
  <View style={S.footer}>
   {!draft.trim()&&<ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.ideas} contentContainerStyle={S.ideasContent} keyboardShouldPersistTaps="handled" accessibilityLabel="Reply ideas">{ideas.map(idea=><Pressable key={idea} accessibilityRole="button" accessibilityLabel={`Reply idea: ${idea}`} disabled={busy} onPress={()=>{onDraft(idea);input.current?.focus();}} style={S.idea}><Text style={S.ideaText}>{idea}</Text></Pressable>)}</ScrollView>}
   {!!error&&<Text accessibilityRole="alert" style={S.error}>{error}</Text>}
   <View style={S.composer}><TextInput ref={input} multiline maxLength={280} accessibilityLabel={inputLabel} value={draft} onChangeText={onDraft} placeholder="Message…" placeholderTextColor="#B8ACC6" style={S.input} textAlignVertical="center"/><Pressable accessibilityRole="button" accessibilityLabel={sendLabel} disabled={busy||!draft.trim()} onPress={()=>{if(!busy&&draft.trim())onSend();}} style={[S.send,{opacity:(busy||!draft.trim())?0.35:1}]}><Ionicons name="arrow-forward" size={24} color="#1B2517"/></Pressable></View>
   <View style={S.footerNote}><Text style={S.footerText}>Simulated replies</Text>{onCheckout&&<Pressable accessibilityRole="button" disabled={busy} onPress={onCheckout} style={S.checkout}><Text style={S.checkoutText}>Check out</Text><Ionicons name="close" size={13} color="#C9B8E1"/></Pressable>}</View>
  </View>
 </KeyboardAvoidingView>;
}
const S=StyleSheet.create({
 room:{flex:1,minHeight:0,paddingTop:10,paddingHorizontal:18,backgroundColor:'#090C0A'},
 header:{flexDirection:'row',alignItems:'center',gap:13,paddingTop:4,paddingBottom:15,paddingHorizontal:2},
 avatar:{position:'relative',width:60,height:60,borderRadius:23,backgroundColor:'#352B46',borderWidth:1,borderColor:'#A699DA70',transform:[{rotate:'-5deg'}]},
 avatarImage:{width:58,height:58,resizeMode:'contain',transform:[{rotate:'5deg'}]},
 avatarBadge:{position:'absolute',right:-4,bottom:-3,height:21,width:21,borderRadius:12,borderWidth:3,borderColor:'#090C0A',backgroundColor:'#D5F88F',alignItems:'center',justifyContent:'center'},
 identity:{flex:1,minWidth:0,gap:3},eyebrow:{fontSize:8,lineHeight:14,letterSpacing:1.1,color:'#C0B1ED'},alias:{fontSize:29,lineHeight:34,fontWeight:'600',letterSpacing:-1,color:'#F3F1FC'},city:{flexDirection:'row',alignItems:'center',gap:4},cityText:{fontSize:13,lineHeight:20,color:'#ABA8BD',flexShrink:1},
 timer:{height:48,width:48,alignItems:'center',justifyContent:'center'},timerValue:{fontSize:17,color:'#DDD4FF'},timerUnit:{fontSize:8},matchMark:{flexDirection:'row',alignItems:'center',gap:4,padding:10,borderRadius:14,borderWidth:1,borderColor:'#D5F88F30',backgroundColor:'#D5F88F0D'},matchNumber:{fontSize:20,color:'#D5F88F'},
 status:{flexDirection:'row',alignItems:'center',gap:7,paddingTop:10,paddingBottom:12,paddingHorizontal:3,borderTopWidth:0,borderColor:'#353242'},dot:{height:5,width:5,borderRadius:3,backgroundColor:'#D5F88F'},statusText:{fontSize:12,lineHeight:18,color:'#C6D7B7',flexShrink:1},previewLabel:{fontSize:9,lineHeight:15,color:'#C0B1ED',marginLeft:'auto',textAlign:'right',maxWidth:100},
 context:{flexDirection:'row',alignItems:'center',gap:10,minHeight:65,padding:8,paddingRight:12,borderWidth:1,borderColor:'#81749F50',borderRadius:19,backgroundColor:'#211D2B'},map:{position:'relative',height:46,width:46,alignItems:'center',justifyContent:'center',overflow:'hidden',borderWidth:1,borderColor:'#9380BC45',borderRadius:13,backgroundColor:'#3C3152'},mapRoad:{position:'absolute',backgroundColor:'#8D7EA935',transform:[{rotate:'-25deg'}],width:70,height:8,top:14,left:-15},contextCopy:{flex:1,gap:4},contextLabel:{fontSize:10,lineHeight:15,color:'#BEB1DA'},contextDetail:{fontSize:15,lineHeight:20,fontWeight:'500',color:'#F1ECFA'},
 messages:{flex:1,minHeight:60},messagesContent:{paddingTop:15,paddingBottom:20,paddingHorizontal:1,gap:13},hello:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:5},helloPair:{flexDirection:'row',paddingRight:3},helloImage:{height:31,width:31,resizeMode:'contain',borderRadius:16,backgroundColor:'#292232',borderWidth:1,borderColor:'#62546E'},helloText:{fontSize:19,color:'#B5A8CC'},
 day:{flexDirection:'row',alignItems:'center',gap:10,marginHorizontal:16,marginBottom:2},dayLine:{height:1,flex:1,backgroundColor:'#302A39'},dayText:{fontSize:10,lineHeight:16,color:'#ACA1BA'},messageRow:{flexDirection:'row',gap:7,alignItems:'flex-end',paddingRight:20},messageRowYou:{justifyContent:'flex-end',paddingRight:0,paddingLeft:40},messageAvatar:{width:25,height:25,resizeMode:'contain',backgroundColor:'#27222F',borderRadius:13,borderWidth:1,borderColor:'#6E5D86',marginBottom:2},
 message:{maxWidth:'89%',minWidth:70,flexShrink:1,paddingTop:13,paddingHorizontal:15,paddingBottom:9,borderRadius:21,borderBottomLeftRadius:6,backgroundColor:'#252230',borderWidth:1,borderColor:'#7567833D'},messageYou:{maxWidth:'100%',borderBottomLeftRadius:21,borderBottomRightRadius:6,backgroundColor:'#C8BEFF',borderColor:'#D2CAFF66'},messageText:{fontSize:17,lineHeight:25,color:'#EEE9F8'},messageTextYou:{color:'#211A34'},messageTime:{fontSize:9,lineHeight:15,textAlign:'right',color:'#AFA2BF',marginTop:5},messageTimeYou:{color:'#574971'},
 footer:{paddingTop:3},ideas:{flexGrow:0,maxHeight:55},ideasContent:{gap:7,paddingTop:5,paddingBottom:11,paddingHorizontal:1},idea:{minHeight:37,paddingVertical:8,paddingHorizontal:12,borderWidth:1,borderColor:'#5C506B',borderRadius:20,backgroundColor:'#1B1824'},ideaText:{fontSize:12,lineHeight:18,color:'#D3C5EA'},
 composer:{flexDirection:'row',alignItems:'flex-end',gap:8,padding:7,borderWidth:1,borderColor:'#82739B',borderRadius:26,backgroundColor:'#211E2A'},input:{flex:1,minWidth:0,minHeight:48,maxHeight:104,paddingVertical:12,paddingHorizontal:8,fontSize:17,lineHeight:24,color:'#F3EFFA'},send:{height:46,width:46,alignItems:'center',justifyContent:'center',borderRadius:25,backgroundColor:'#D5F88F'},footerNote:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6,minHeight:34,paddingHorizontal:3},footerText:{fontSize:10,lineHeight:16,color:'#AFA6BD',flexShrink:1},checkout:{flexDirection:'row',alignItems:'center',gap:5,minHeight:44,paddingHorizontal:2},checkoutText:{fontSize:11,color:'#C9B8E1'},error:{fontSize:13,lineHeight:19,color:'#F3BFAA',paddingHorizontal:4,paddingBottom:7}
});
