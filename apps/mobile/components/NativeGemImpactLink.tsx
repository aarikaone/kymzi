import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {gemImpact,type PreviewState} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';
export function NativeGemImpactLink({state,onOpen}:{state:PreviewState;onOpen:()=>void}){const impact=gemImpact(state);return <Pressable accessibilityRole="button" onPress={onOpen} style={S.link}><View style={S.linkIcon}><Ionicons name="sparkles-outline" size={23} color={C.lavender}/></View><View style={{flex:1,gap:5}}><Text style={{fontSize:18,fontWeight:'500',color:C.ink}}>My hidden gems</Text><Text style={S.small}>{impact.count?`${impact.count} shared · ${impact.saves} ${impact.saves===1?'save':'saves'}`:'Share your side of the city'}</Text></View><Ionicons name="arrow-forward" size={19} color={C.accent}/></Pressable>;}
const S=StyleSheet.create({small:{fontSize:12,lineHeight:18,color:C.muted},link:{minHeight:78,padding:15,borderRadius:20,borderWidth:1,borderColor:'#443E52',backgroundColor:'#1C1D22',flexDirection:'row',alignItems:'center',gap:13},linkIcon:{width:43,height:43,borderRadius:15,backgroundColor:'#C8BEFF14',alignItems:'center',justifyContent:'center'}});
