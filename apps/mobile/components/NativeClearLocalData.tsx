import React,{useEffect,useRef,useState} from 'react';
import {Alert,Pressable,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NIGHT_THEME as C} from './theme';

export function NativeClearLocalData({onClear,compact=false}:{onClear:()=>Promise<void>;compact?:boolean}) {
  const [busy,setBusy]=useState(false),locked=useRef(false),clearing=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  async function clear() {
    clearing.current=true;if(alive.current)setBusy(true);
    try{await onClear();}
    catch(error){if(alive.current)Alert.alert('Couldn’t clear data',error instanceof Error?error.message:'Please try again.');}
    finally{clearing.current=false;locked.current=false;if(alive.current)setBusy(false);}
  }
  function confirm() {
    if(locked.current)return;
    locked.current=true;
    Alert.alert('Clear local data?','Your profile, Roamies, saved places, and progress will be deleted.',[
      {text:'Cancel',style:'cancel',onPress:()=>{locked.current=false;}},
      {text:'Clear data',style:'destructive',onPress:()=>void clear()},
    ],{cancelable:true,onDismiss:()=>{if(!clearing.current)locked.current=false;}});
  }
  return <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Clear local data" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={confirm} style={{minHeight:compact?44:60,flexDirection:'row',alignItems:'center',gap:13,borderBottomWidth:compact?0:1,borderBottomColor:C.line,opacity:busy?.5:1}}>
    <Ionicons name="trash-outline" size={22} color="#E9B3AE"/><Text style={{flex:1,fontSize:compact?14:17,color:compact?'#BDA3A4':'#E9B3AE'}}>{busy?'Clearing…':'Clear local data'}</Text><Ionicons name="arrow-forward" size={18} color="#E9B3AE"/>
  </Pressable>;
}
