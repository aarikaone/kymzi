import {publicImageSource} from '@rymzi/cloud';
import {NativeImage as Image} from './NativeImage';
import React from 'react';
import {Pressable,Text,View} from 'react-native';
import { availableCategories,type AgeBand,type PlayCategoryId } from '@rymzi/core';
const images={food:publicImageSource('/categories/food.webp'),animals:publicImageSource('/categories/animals.webp'),'what-if':publicImageSource('/categories/what-if.webp'),'your-world':publicImageSource('/categories/your-world.webp'),play:publicImageSource('/categories/play.webp'),'future-you':publicImageSource('/categories/future-you.webp')};
export function CategoryGrid({band,onSelect}:{band:AgeBand;onSelect:(id:PlayCategoryId)=>void}){
  const categories=availableCategories(band);
  return <View style={{flex:1,minHeight:270,gap:12}}>{[0,1,2].map(row=><View key={row} style={{flex:1,flexDirection:'row',gap:12}}>{categories.slice(row*2,row*2+2).map(c=><Pressable cssInterop={false} key={c.id} accessibilityRole="button" accessibilityLabel={`Choose ${c.name}`} onPress={()=>onSelect(c.id)} style={({pressed})=>({flex:1,borderRadius:22,overflow:'hidden',backgroundColor:c.color,opacity:pressed ? .8 : 1,transform:[{scale:pressed ? .97 : 1}]})}><Image source={images[c.id]} accessible={false} style={{position:'absolute',width:'100%',height:'100%',resizeMode:'cover'}}/><View style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#090C0Adb',paddingHorizontal:11,paddingVertical:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:18,fontWeight:'600',color:'#F1F5EB'}}>{c.name}</Text><Text style={{fontSize:18,color:'#F1F5EB'}}>→</Text></View></Pressable>)}</View>)}</View>;
}
