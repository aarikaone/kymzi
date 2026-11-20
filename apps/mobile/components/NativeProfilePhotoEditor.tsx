import React,{useEffect,useRef,useState} from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {makeProfilePhoto,MAX_PROFILE_PHOTO_LENGTH,type ProfilePhoto,type AgeBand} from '@rymzi/core';
export function NativeProfilePhotoEditor({value,band,onChange,onBusy,portraitHeight=220}:{value?:ProfilePhoto;band:AgeBand;onChange:(photo:ProfilePhoto|undefined)=>void;onBusy:(busy:boolean)=>void;portraitHeight?:number}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),operation=useRef(0),latestBand=useRef(band);latestBand.current=band;useEffect(()=>()=>{operation.current++;onBusy(false);},[]);
 async function pick(){if(busy)return;const token=++operation.current;setBusy(true);onBusy(true);setError('');try{
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:1,exif:false});if(result.canceled)return;
  const asset=result.assets[0];if(!asset||!asset.width||!asset.height)throw new Error('Choose another photo.');if((asset.fileSize??0)>15*1024*1024)throw new Error('Choose a photo under 15 MB.');
  const side=Math.min(asset.width,asset.height),context=ImageManipulator.manipulate(asset.uri);context.crop({originX:(asset.width-side)/2,originY:(asset.height-side)/2,width:side,height:side});context.resize({width:384,height:384});
  let image='';try{const rendered=await context.renderAsync();try{for(const compress of [.82,.65,.45]){const out=await rendered.saveAsync({format:SaveFormat.JPEG,base64:true,compress});image='data:image/jpeg;base64,'+out.base64;if(image.length<=MAX_PROFILE_PHOTO_LENGTH)break;}}finally{rendered.release();}}finally{context.release();}
  const photo=makeProfilePhoto(image,band);if(token===operation.current&&band===latestBand.current)onChange(photo);
 }catch(e){if(token===operation.current)setError((e as Error).message||'Photo access is unavailable. Try again.');}finally{if(token===operation.current){setBusy(false);onBusy(false);}}}
 return <View style={{flex:1,alignItems:'center',gap:4}}>
  <Pressable accessibilityRole="button" accessibilityLabel={value?'Replace photo':'Add photo'} accessibilityState={{busy,disabled:busy}} disabled={busy} onPress={()=>void pick()} style={{position:'relative',width:'100%',aspectRatio:.95,maxHeight:portraitHeight,borderWidth:1,borderColor:'#534A68',borderRadius:portraitHeight<=150?26:32,backgroundColor:'#19181F',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:9,marginBottom:7}}>
   {value?<Image source={{uri:value.image}} accessibilityLabel="Your private profile photo preview" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}/>:<><Ionicons name="person-outline" size={42} color="#C8BEFF"/><Text style={{fontSize:14,lineHeight:20,fontWeight:'500',color:'#C8BEFF'}}>{busy?'Preparing…':'Add photo'}</Text></>}
   <View style={{position:'absolute',bottom:9,right:9,width:34,height:34,borderWidth:1,borderColor:'#4A6345',borderRadius:17,backgroundColor:'#090C0A',alignItems:'center',justifyContent:'center'}}><Ionicons name="camera-outline" size={18} color="#D5F88F"/></View>
  </Pressable>
  {value&&<Pressable accessibilityRole="button" accessibilityLabel="Remove photo" disabled={busy} onPress={()=>{setError('');onChange(undefined);}} style={{position:'absolute',top:3,right:3,width:44,height:44,alignItems:'center',justifyContent:'center'}}><View style={{width:28,height:28,borderRadius:14,backgroundColor:'#090C0AD9',alignItems:'center',justifyContent:'center'}}><Ionicons name="close" size={18} color="#F1F5EB"/></View></Pressable>}
  <Text style={{fontSize:18,lineHeight:24,fontWeight:'600',color:'#F1F5EB'}}>Real photo</Text><Text style={{fontSize:12,lineHeight:18,color:'#B1BCA8',textAlign:'center'}}>Optional · Private</Text>
  {!!error&&<Text accessibilityRole="alert" style={{fontSize:13,lineHeight:19,color:'#F0C5A5',textAlign:'center',marginTop:5}}>{error}</Text>}
 </View>;
}
