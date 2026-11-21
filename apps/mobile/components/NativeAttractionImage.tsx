import {ActivityIndicator,Pressable,Text,View,type ViewStyle} from 'react-native';
import {attractionById} from '@rymzi/core';
import {useCatalogueImage} from '@rymzi/cloud';
import {NativeImage} from './NativeImage';
export function NativeAttractionImage({id,style,showLoader=false}:{id:string;style?:ViewStyle;showLoader?:boolean}){
 const {image,loading,error,retry}=useCatalogueImage('place',id),a=attractionById(id);if(!a)return null;
 const layout=[{width:'100%' as const,aspectRatio:4/3,backgroundColor:'#151B16',borderRadius:16},style];
 return image?<NativeImage showLoader={showLoader} accessibilityRole="image" accessibilityLabel={`Illustration of ${a.name}`} source={{uri:image.url,cache:'force-cache'}} style={layout}/>:<View style={[layout,{alignItems:'center',justifyContent:'center'}]}>{loading?<ActivityIndicator color="#C8BEFF"/>:error?<Pressable accessibilityRole="button" accessibilityLabel={`Retry image: ${a.name}`} onPress={retry}><Text style={{color:'#C8BEFF',fontSize:25}}>↻</Text></Pressable>:null}</View>;
}
