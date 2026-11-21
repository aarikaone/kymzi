import {ActivityIndicator,Pressable,Text,View,type StyleProp,type ViewStyle} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {cityGuideSVG,travelCityById,type TravelCityId,type TravelPlace} from '@rymzi/core';
import {useCatalogueImage} from '@rymzi/cloud';
import {NativeImage} from './NativeImage';
function RemoteGuide({kind,id,label}:{kind:'city'|'place';id:string;label:string}){
 const {image,loading,error,retry}=useCatalogueImage(kind,id);
 return image?<NativeImage showLoader source={{uri:image.url,cache:'force-cache'}} accessibilityRole="image" accessibilityLabel={label} style={{width:'100%',height:'100%',resizeMode:'cover'}}/>:<View style={{width:'100%',height:'100%'}}><SvgXml xml={cityGuideSVG(`${kind}:${id}`)} width="100%" height="100%" accessibilityLabel={label}/>{loading?<View style={{position:'absolute',top:0,bottom:0,left:0,right:0,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#C8BEFF"/></View>:error?<Pressable accessibilityRole="button" accessibilityLabel="Retry image" onPress={retry} style={{position:'absolute',top:0,bottom:0,left:0,right:0,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:25,color:'#C8BEFF'}}>↻</Text></Pressable>:null}</View>;
}
export function NativeCityArt({cityId,style}:{cityId:TravelCityId;style?:StyleProp<ViewStyle>}){
 const city=travelCityById(cityId);if(!city)return null;
 return <View style={[{width:'100%',height:142,overflow:'hidden'},style]}><RemoteGuide key={cityId} kind="city" id={cityId} label={`${city.city} guide illustration`}/></View>;
}
export function NativeGuidePlaceArt({place,style}:{place:TravelPlace;style?:StyleProp<ViewStyle>}){return <View style={[{width:'100%',height:112,overflow:'hidden'},style]}><RemoteGuide key={place.id} kind="place" id={place.id} label={`Guide illustration for ${place.name}`}/></View>;}
