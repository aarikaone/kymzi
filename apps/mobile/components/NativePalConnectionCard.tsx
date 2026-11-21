import {NativeImage as Image} from './NativeImage';
import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {PalSummary} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';

type Props = {pal: PalSummary};

export function NativePalConnectionCard({pal}: Props) {
  const frame = pal.photoUnlocked ? pal.photoFrame : undefined;
  return <View style={S.card} accessibilityLabel="Your connection progress">
    <View style={S.overview}>
      <View style={S.progress}>
        <View style={S.count}><Text style={S.number}>{pal.matches}<Text style={S.total}>/5</Text></Text><Text style={S.caption}>matches</Text></View>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`${pal.matches} of 5 matches`} accessibilityValue={{min:0, max:5, now:pal.matches}} style={S.pips}>
          {[1, 2, 3, 4, 5].map(step => <View key={step} style={[S.pip, step === 3 && S.photoPip, step <= pal.matches && S.filled]}/>)}
        </View>
        <View style={S.status}><Ionicons name={pal.photoUnlocked ? 'checkmark' : 'lock-closed-outline'} size={13} color={pal.photoUnlocked ? '#C6DFA6' : '#C7BBE2'}/><Text style={[S.statusText, pal.photoUnlocked && {color:'#C6DFA6'}]}>{pal.photoUnlocked ? 'Photo unlocked' : 'Photo at 3'}</Text></View>
      </View>
      <View style={[S.photo, !!frame && {borderColor:'#A6C77A'}]}>
        {frame ? <View accessible accessibilityRole="image" accessibilityLabel={`${pal.alias}’s fictional profile photo`} style={S.portrait}>
          <Image accessible={false} source={require('../../../packages/assets/portraits/fictional-atlas.png')} crop={{column:frame.column,row:frame.row,columns:4,rows:4,tileWidth:1,tileHeight:1}} style={{width:'100%',height:'100%'}}/>
          <Text style={S.preview}>Preview</Text>
        </View> : <View accessible accessibilityRole="image" accessibilityLabel="Profile photo locked" style={S.sealed}><Ionicons name="lock-closed-outline" size={24} color="#D1C2EF"/></View>}
      </View>
    </View>

  </View>;
}

const S = StyleSheet.create({
  card:{gap:15, padding:18, borderWidth:1, borderColor:'#3E493B', borderRadius:24, backgroundColor:'#141915'},
  overview:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:24},
  progress:{flex:1, minWidth:0, maxWidth:185},
  count:{flexDirection:'row', alignItems:'baseline', gap:9},
  number:{fontSize:50, lineHeight:56, fontWeight:'500', letterSpacing:-2.5, color:C.accent},
  total:{fontSize:25, letterSpacing:-1, color:'#71806A'},
  caption:{fontSize:12, color:'#AFBAA7'},
  pips:{flexDirection:'row', gap:6, marginTop:9},
  pip:{height:5, flex:1, borderRadius:4, backgroundColor:'#354031'},
  photoPip:{backgroundColor:'#8C7CAF'},
  filled:{backgroundColor:C.accent},
  status:{flexDirection:'row', alignItems:'center', gap:5, marginTop:10},
  statusText:{fontSize:12, lineHeight:17, color:'#C7BBE2'},
  photo:{width:84, height:96, flexShrink:0, borderRadius:19, borderWidth:1, borderColor:'#81719E', backgroundColor:'#2B2639', overflow:'hidden'},
  sealed:{flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#332A43'},
  portrait:{flex:1, overflow:'hidden'},
  preview:{position:'absolute', bottom:0, left:0, right:0, padding:4, fontSize:8, lineHeight:11, textAlign:'center', color:'#E3EBDC', backgroundColor:'#090C0ABF'},
});
