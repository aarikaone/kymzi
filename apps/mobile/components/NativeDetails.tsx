import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NIGHT_THEME as C} from './theme';
export function NativeDetails({label='Details',children}:{label?:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false);
 return <View style={{gap:open?10:0}}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={{fontSize:15,lineHeight:22,color:C.accent}}>{label}</Text><Ionicons name={open?'chevron-up':'chevron-down'} size={18} color={C.accent}/></Pressable>{open&&children}</View>;
}
