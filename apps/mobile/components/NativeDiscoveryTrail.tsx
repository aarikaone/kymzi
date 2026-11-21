import {Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {JOURNEY_COPY} from '@rymzi/core';

export function NativeDiscoveryTrail({privatePlay=false}:{privatePlay?:boolean}){
  return <View accessible accessibilityLabel={privatePlay?'Answer three questions, reveal a city, then explore its places':'Match three answers, see your unknown roamie’s photos, then explore their city'} style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'}}>
    {(privatePlay?JOURNEY_COPY.privateTrail:JOURNEY_COPY.trail).map((label,index)=><View key={label} style={{flexDirection:'row',alignItems:'center',gap:6}}>
      <View style={{height:22,width:22,borderRadius:12,borderWidth:1,borderColor:index===0?'#F1F5EB':'#D5F88F',backgroundColor:index===0?'#284C32':'transparent',alignItems:'center',justifyContent:'center'}}>{index===2?<Ionicons name="compass-outline" size={14} color="#B1BCA8"/>:<Text style={{fontSize:12,fontWeight:'600',color:index===0?'#EAF6D9':'#B1BCA8'}}>{index+1}</Text>}</View>
      <Text style={{fontSize:14,lineHeight:21,color:index===0?'#F1F5EB':'#B1BCA8'}}>{label}</Text>
      {index<2&&<Ionicons name="arrow-forward" size={12} color="#D5F88F"/>}
    </View>)}
  </View>;
}
