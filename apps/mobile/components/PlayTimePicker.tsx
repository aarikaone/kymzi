import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { displayPlayTime } from '@rymzi/core';
export function PlayTimePicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const width=Math.min(290,useWindowDimensions().width-40);const date=new Date();const [hour,minute]=value.split(':').map(Number);date.setHours(hour,minute,0,0);
  const update=(selected?:Date)=>{if(selected)onChange(`${String(selected.getHours()).padStart(2,'0')}:${String(selected.getMinutes()).padStart(2,'0')}`);};
  if(Platform.OS==='android')return <Pressable accessibilityRole="button" accessibilityLabel="Choose daily play time" className="min-h-[85px] items-center justify-center border-b-2 border-[#D0DEC3]" onPress={()=>DateTimePickerAndroid.open({value:date,mode:'time',onChange:(event,selected)=>{if(event.type==='set')update(selected);}})}><Text className="text-[44px] font-medium tracking-[-2px] text-ink">{displayPlayTime(value)}</Text></Pressable>;
  return <View className="w-full items-center"><DateTimePicker value={date} mode="time" display="spinner" themeVariant="dark" textColor="#F1F5EB" onChange={(_,selected)=>update(selected)} style={{height:160,width}}/></View>;
}
