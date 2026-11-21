import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {PalSummary} from '@rymzi/core';
import {NIGHT_THEME as C} from './theme';

type Props={children:React.ReactNode;pal:PalSummary;onPlay:()=>void;onChat:()=>void};

export function NativePalPage({children,pal,onPlay,onChat}:Props) {
  const insets=useSafeAreaInsets(),complete=pal.matches>=5;
  return <View style={S.page}>
    <ScrollView style={S.scroll} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
    <View accessibilityLabel="Roamie actions" style={[S.dock,{paddingBottom:Math.max(insets.bottom,12)}]}>
      <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={complete?'Play together · 5 of 5 complete':`Play together · ${pal.matches+1}/5`} accessibilityState={{disabled:complete}} disabled={complete} onPress={onPlay} style={({pressed})=>[S.button,S.play,complete&&S.disabled,pressed&&!complete&&{backgroundColor:C.primaryPressed}]}>
        <Text style={[S.label,{color:complete?'#8A9681':C.primaryInk}]}>Play together</Text>
      </Pressable>
      <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={`Message ${pal.alias}`} onPress={onChat} style={({pressed})=>[S.button,S.message,pressed&&{backgroundColor:'#3A304B'}]}>
        <Text style={[S.label,{color:'#E2D6FF'}]}>Message</Text>
      </Pressable>
    </View>
  </View>;
}

const S=StyleSheet.create({
  page:{flex:1,minHeight:0,backgroundColor:C.ground},
  scroll:{flex:1,minHeight:0},
  content:{flexGrow:1,padding:22,paddingBottom:24,gap:20},
  dock:{flexDirection:'row',gap:10,paddingHorizontal:22,paddingTop:12,borderTopWidth:1,borderTopColor:'#29362B',backgroundColor:C.ground},
  button:{flex:1,minHeight:54,paddingHorizontal:10,paddingVertical:14,borderRadius:17,alignItems:'center',justifyContent:'center'},
  play:{backgroundColor:C.primary},
  message:{backgroundColor:'#292435',borderWidth:1,borderColor:'#776A98'},
  disabled:{backgroundColor:'#253024'},
  label:{fontSize:17,lineHeight:22,fontWeight:'600',textAlign:'center'},
});
