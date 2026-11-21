import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {NativePlaceFavoriteButton} from './NativePlaceFavorite';
import {NIGHT_THEME as C} from './theme';

type Props={children:React.ReactNode;id:string;name:string;saved:boolean;onFavorite:(id:string)=>void;onShare:()=>void;shareLabel?:string};

export function NativePlacePage({children,id,name,saved,onFavorite,onShare,shareLabel}:Props) {
  const insets=useSafeAreaInsets();
  return <View style={S.page}>
    <ScrollView style={S.scroll} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    <View accessibilityLabel="Place actions" style={[S.dock,{paddingBottom:Math.max(insets.bottom,12)}]}>
      <View style={S.favorite}><NativePlaceFavoriteButton variant="primary" compact id={id} name={name} saved={saved} onFavorite={onFavorite}/></View>
      <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={shareLabel??"Share a place"} accessibilityHint={shareLabel?"Add a place from Maps":"Share this gem’s Maps link"} onPress={onShare} style={({pressed})=>[S.share,pressed&&{backgroundColor:'#3A304B'}]}>
        <Ionicons name="share-outline" size={19} color="#E2D6FF"/><Text style={S.shareText}>{shareLabel??'Share'}</Text>
      </Pressable>
    </View>
  </View>;
}
const S=StyleSheet.create({
  page:{flex:1,minHeight:0,backgroundColor:C.ground},scroll:{flex:1,minHeight:0},
  content:{flexGrow:1,padding:20,paddingTop:14,paddingBottom:20,gap:14},
  dock:{flexDirection:'row',alignItems:'flex-start',gap:10,paddingHorizontal:22,paddingTop:12,borderTopWidth:1,borderTopColor:'#29362B',backgroundColor:C.ground},
  favorite:{flex:1,minWidth:0},
  share:{flex:1,minHeight:54,paddingHorizontal:10,paddingVertical:14,borderRadius:17,borderWidth:1,borderColor:'#776A98',backgroundColor:'#292435',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  shareText:{fontSize:17,lineHeight:22,fontWeight:'600',color:'#E2D6FF'},
});
