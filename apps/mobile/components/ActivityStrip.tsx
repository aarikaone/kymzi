import React,{useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {activityAge,demoActivityUpdate} from '@rymzi/core';
export function ActivityStrip({now}:{now:Date}){
 const [event,setEvent]=useState(()=>demoActivityUpdate(now)),sequence=useRef(0);
 useEffect(()=>{const timer=setInterval(()=>setEvent(demoActivityUpdate(new Date(),++sequence.current)),5500);return()=>clearInterval(timer);},[]);
 return <View accessibilityLabel="Demo match activity" style={{minHeight:88,flexShrink:0,borderRadius:17,borderWidth:1,borderColor:'#F1F5EB12',backgroundColor:'#1D281F',paddingHorizontal:12,paddingVertical:9,gap:5}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><View style={{height:4,width:4,borderRadius:2,backgroundColor:'#D5F88F'}}/><Text style={{fontSize:10,letterSpacing:1,color:'#D0DEC3',textTransform:'uppercase'}}>The Kymzi pulse</Text></View></View>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}><Text style={{fontSize:14,fontWeight:'600',color:'#F1F5EB',flexShrink:1}}><Text style={{color:'#F1F5EB'}}>{event.partial?'✧':'✦'} </Text>{event.title}</Text><Text style={{fontSize:11,color:'#D0DEC3',fontVariant:['tabular-nums']}}>{activityAge(event.occurredAt,now)}</Text></View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{event.countries.map(country=><Text key={country.name} style={{fontSize:11,color:'#D0DEC3'}}>{country.flag} {country.name}</Text>)}</View>
 </View>;
}
