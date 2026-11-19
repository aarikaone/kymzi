import React from 'react';
import {Platform,Pressable,Text,View} from 'react-native';
import DateTimePicker,{DateTimePickerAndroid} from '@react-native-community/datetimepicker';
export function VisitDateField({label,value,onChange,mode}:{label:string;value:string;onChange:(value:string)=>void;mode:'date'|'time'}){
 const date=mode==='date'?new Date(value+'T12:00:00'):new Date();if(mode==='time'){const [hour,minute]=value.split(':').map(Number);date.setHours(hour,minute,0,0);}
 const update=(selected?:Date)=>{if(!selected)return;onChange(mode==='date'?`${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}`:`${String(selected.getHours()).padStart(2,'0')}:${String(selected.getMinutes()).padStart(2,'0')}`);};
 return <View style={{gap:9,flex:1}}><Text style={{fontSize:16,color:'#B1BCA8'}}>{label}</Text>{Platform.OS==='android'?<Pressable accessibilityRole="button" accessibilityLabel={label} onPress={()=>DateTimePickerAndroid.open({value:date,mode,onChange:(e,selected)=>{if(e.type==='set')update(selected);}})} style={{minHeight:54,padding:13,borderRadius:13,backgroundColor:'#151B16',borderWidth:1,borderColor:'#3E5140',justifyContent:'center'}}><Text style={{fontSize:18,color:'#F1F5EB'}}>{value}</Text></Pressable>:<View style={{minHeight:54,backgroundColor:'#151B16',borderRadius:13,justifyContent:'center',padding:4}}><DateTimePicker accessibilityLabel={label} value={date} mode={mode} display="compact" themeVariant="dark" textColor="#F1F5EB" onChange={(_,selected)=>update(selected)}/></View>}</View>;
}
