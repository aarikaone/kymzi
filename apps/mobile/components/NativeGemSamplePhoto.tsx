import {ActivityIndicator,Pressable,Text,View} from 'react-native';
import {useCatalogueImage} from '@rymzi/cloud';
import type {GemSearchPlace} from '@rymzi/core';
import {NativeImage} from './NativeImage';
export function NativeGemSamplePhoto({place}:{place:GemSearchPlace}){
 const {image,loading,error,retry}=useCatalogueImage(place.sampleKind,place.sampleId);
 return image?<NativeImage showLoader source={{uri:image.url}} accessibilityLabel={`Sample image of ${place.name}`} style={{width:'100%',height:'100%',resizeMode:'cover'}}/>:<View style={{flex:1,width:'100%',height:'100%',backgroundColor:'#242B20',alignItems:'center',justifyContent:'center'}}>{loading?<ActivityIndicator color="#C8BEFF"/>:error?<Pressable accessibilityRole="button" accessibilityLabel="Retry sample image" onPress={retry}><Text style={{color:'#C8BEFF',fontSize:12}}>Retry image</Text></Pressable>:null}</View>;
}
