import React,{useRef} from 'react';
import {Image,Pressable,Text,TextInput,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {AVATARS,PROFILE_SETUP_COPY,type Profile,type ProfilePhoto} from '@rymzi/core';
import {NativeProfilePhotoEditor} from './NativeProfilePhotoEditor';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

type Props={profile:Profile;editing:boolean;busy:boolean;error:string;onAvatar:()=>void;onLocation:(field:'city'|'country',value:string)=>void;onPhoto:(photo:ProfilePhoto|undefined)=>void;onBusy:(busy:boolean)=>void;onSave:()=>void};
export function NativeProfileSetup({profile,editing,busy,error,onAvatar,onLocation,onPhoto,onBusy,onSave}:Props){
 const viewport=useWindowDimensions(),insets=useSafeAreaInsets(),countryInput=useRef<TextInput>(null);
 const available=viewport.height-insets.top-insets.bottom-56-(viewport.height<760?40:48);
 const compact=available<680,short=available<570,portraitHeight=short?125:compact?160:220;
 const character=AVATARS.find(a=>a.id===profile.avatar)!,privateOnly=profile.ageBand==='10-12';

 return <View style={{flex:1,minHeight:short?510:compact?530:560,gap:short?14:compact?17:22}}>
  <View style={{gap:compact?5:8}}>
   <Text accessibilityRole="header" style={{fontSize:short?31:compact?33:36,lineHeight:short?37:compact?39:42,fontWeight:'600',letterSpacing:-1.4,color:C.ink}}>{PROFILE_SETUP_COPY.title}</Text>
   <View style={{flexDirection:'row',alignItems:'center',gap:11}}><Text style={{fontSize:13,lineHeight:22,color:C.muted}}>Your number</Text><Text accessibilityLabel="Your assigned nickname" style={{fontSize:18,lineHeight:22,fontWeight:'500',fontVariant:['tabular-nums'],letterSpacing:1,color:C.accent}}>#{profile.name}</Text></View>
  </View>
  <View accessibilityLabel="Your character and real photo" style={{flexDirection:'row',alignItems:'flex-start',gap:16}}>
   <View style={{flex:1,alignItems:'center',gap:4}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Change character" onPress={onAvatar} style={{position:'relative',width:'100%',aspectRatio:.95,maxHeight:portraitHeight,borderWidth:1,borderColor:'#4A6345',borderRadius:short?26:32,backgroundColor:'#19231C',alignItems:'center',justifyContent:'center',overflow:'hidden',marginBottom:7}}>
     <Image source={avatarImages[profile.avatar]} accessibilityLabel={`${character.name} anonymous character`} style={{width:'105%',height:'95%',resizeMode:'contain'}}/>
     <View style={{position:'absolute',bottom:9,right:9,width:34,height:34,borderWidth:1,borderColor:'#4A6345',borderRadius:17,backgroundColor:C.ground,alignItems:'center',justifyContent:'center'}}><Ionicons name="color-palette-outline" size={19} color={C.accent}/></View>
    </Pressable>
    <Text style={{fontSize:short?17:18,lineHeight:24,fontWeight:'600',color:C.ink}}>Anonymous</Text><Text style={{fontSize:12,lineHeight:18,color:C.muted}}>{privateOnly?'Only you':'Shown first'}</Text>
   </View>
   <NativeProfilePhotoEditor value={profile.photo?.ageBand===profile.ageBand?profile.photo:undefined} band={profile.ageBand} onChange={onPhoto} onBusy={onBusy} portraitHeight={portraitHeight}/>
  </View>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:12,paddingHorizontal:2}}>
   <Ionicons name={privateOnly?'shield-checkmark-outline':'lock-closed-outline'} size={20} color={C.lavender} style={{marginTop:2}}/>
   <View style={{flex:1,gap:4}}><Text style={{fontSize:15,lineHeight:22,fontWeight:'500',color:C.ink}}>{privateOnly?'Only you can see this.':PROFILE_SETUP_COPY.revealTitle}</Text><Text style={{fontSize:13,lineHeight:19,color:C.muted}}>{privateOnly?'Your profile stays private.':PROFILE_SETUP_COPY.revealDetail}</Text></View>
  </View>
  <View style={{flexDirection:'row',gap:12}}>
   <View style={{flex:1,gap:9}}><Text style={{fontSize:14,lineHeight:20,fontWeight:'500',color:C.muted}}>City</Text><TextInput accessibilityLabel="City" value={profile.city??''} onChangeText={value=>onLocation('city',value)} placeholder="Your city" placeholderTextColor={C.muted} maxLength={60} autoCapitalize="words" autoCorrect={false} returnKeyType="next" onSubmitEditing={()=>countryInput.current?.focus()} style={{minHeight:52,paddingHorizontal:13,paddingVertical:12,borderWidth:1,borderColor:C.line,borderRadius:16,backgroundColor:C.surface,color:C.ink,fontSize:17,lineHeight:24}}/></View>
   <View style={{flex:1,gap:9}}><Text style={{fontSize:14,lineHeight:20,fontWeight:'500',color:C.muted}}>Country</Text><TextInput ref={countryInput} accessibilityLabel="Country" value={profile.country??''} onChangeText={value=>onLocation('country',value)} placeholder="Your country" placeholderTextColor={C.muted} maxLength={60} autoCapitalize="words" autoCorrect={false} returnKeyType="done" style={{minHeight:52,paddingHorizontal:13,paddingVertical:12,borderWidth:1,borderColor:C.line,borderRadius:16,backgroundColor:C.surface,color:C.ink,fontSize:17,lineHeight:24}}/></View>
  </View>
  <View style={{marginTop:'auto',paddingTop:4,gap:12}}>
   {!!error&&<Text accessibilityRole="alert" style={{fontSize:13,lineHeight:19,color:'#F0C5A5'}}>{error}</Text>}
   <Pressable accessibilityRole="button" disabled={busy} onPress={onSave} style={({pressed})=>({minHeight:short?55:58,borderRadius:20,padding:14,backgroundColor:pressed?C.primaryPressed:C.primary,alignItems:'center',justifyContent:'center',opacity:busy?.4:1})}><Text style={{fontSize:20,fontWeight:'600',color:C.primaryInk}}>{editing?'Save changes':'Let’s go'}</Text></Pressable>
  </View>
 </View>;
}
