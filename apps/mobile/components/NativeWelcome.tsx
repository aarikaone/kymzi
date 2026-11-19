import React,{useId} from 'react';
import {Image,Pressable,ScrollView,Text,useWindowDimensions,View} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {JOURNEY_COPY,WELCOME_DESCRIPTION} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';
import {Brand} from './Brand';
import {Hand} from './Typography';

export function NativeWelcome({onStart}:{onStart:()=>void}){
 const viewport=useWindowDimensions(),insets=useSafeAreaInsets();
 const available=viewport.height-insets.top-insets.bottom,compact=available<700,small=available<570;
 const titleSize=small?32:compact?37:42;
 const fadeId='welcome'+useId().replace(/[^a-zA-Z0-9_-]/g,'');

 return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:C.ground}}>
  <StatusBar style="light"/>
  <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false} contentContainerStyle={{
   flexGrow:1,minHeight:Math.max(500,available),paddingHorizontal:24,paddingTop:12,
   paddingBottom:small?18:compact?22:24,gap:small?14:compact?16:20,
  }}>
   <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{
    position:'absolute',top:0,left:0,right:0,height:'80%',overflow:'hidden',
   }}>
    <Image source={require('../../../packages/assets/avatars/cloud-glasses-v1.png')} accessible={false} style={{
     position:'absolute',top:0,left:'-3%',width:'200%',height:'100%',resizeMode:'contain',
    }}/>
    <Svg width="100%" height="100%" style={{position:'absolute',top:0,left:0}}><Defs><LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1"><Stop offset=".58" stopColor={C.ground} stopOpacity={0}/><Stop offset="1" stopColor={C.ground}/></LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#'+fadeId+')'}/></Svg>
   </View>
   <View style={{height:48,justifyContent:'center'}}><Brand dark/></View>
   <View style={{gap:compact?12:14,marginTop:'auto'}}>
    <Text accessibilityRole="header" style={{fontSize:titleSize,lineHeight:titleSize*1.05,fontWeight:'600',letterSpacing:-1.6,color:C.ink}}>
     {JOURNEY_COPY.title}{'\n'}<Hand style={{fontSize:titleSize*1.18,lineHeight:titleSize*1.22,color:C.accent}}>{JOURNEY_COPY.titleAccent}</Hand>
    </Text>
    <Text style={{maxWidth:330,fontSize:compact?16:17,lineHeight:compact?23:25,color:C.muted}}>{WELCOME_DESCRIPTION}</Text>
   </View>
   <Pressable accessibilityRole="button" onPress={onStart} style={({pressed})=>({
    minHeight:small?56:compact?58:60,padding:14,borderRadius:20,backgroundColor:pressed?C.primaryPressed:C.primary,
    alignItems:'center',justifyContent:'center',
   })}>
    <Text style={{fontSize:20,fontWeight:'600',color:C.primaryInk}}>Get started</Text>
   </Pressable>
  </ScrollView>
 </SafeAreaView>;
}
