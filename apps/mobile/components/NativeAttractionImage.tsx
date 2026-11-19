import React from 'react';
import {View,type ViewStyle} from 'react-native';
import Svg,{Image as SvgImage} from 'react-native-svg';
import {attractionArtwork,attractionById} from '@rymzi/core';
const atlases:Record<string,number>={
'atlas-01':require('../../../packages/assets/attractions/atlas-01.png'),
'atlas-02':require('../../../packages/assets/attractions/atlas-02.png'),
'atlas-03':require('../../../packages/assets/attractions/atlas-03.png'),
'atlas-04':require('../../../packages/assets/attractions/atlas-04.png'),
'atlas-05':require('../../../packages/assets/attractions/atlas-05.png'),
'atlas-06':require('../../../packages/assets/attractions/atlas-06.png'),
'atlas-07':require('../../../packages/assets/attractions/atlas-07.png'),
'atlas-08':require('../../../packages/assets/attractions/atlas-08.png'),
'atlas-09':require('../../../packages/assets/attractions/atlas-09.png'),
'atlas-10':require('../../../packages/assets/attractions/atlas-10.png'),
'atlas-11':require('../../../packages/assets/attractions/atlas-11.png'),
'atlas-12':require('../../../packages/assets/attractions/atlas-12.png'),
'atlas-13':require('../../../packages/assets/attractions/atlas-13.png'),
};
export function NativeAttractionImage({id,style}:{id:string;style?:ViewStyle}){const art=attractionArtwork(id),a=attractionById(id);if(!art||!a)return null;return <View accessibilityRole="image" accessibilityLabel={`Illustration of ${a.name}`} style={[{width:'100%',aspectRatio:4/3,backgroundColor:'#151B16',borderRadius:16,overflow:'hidden'},style]}><Svg width="100%" height="100%" viewBox={`${art.column*512} ${art.row*384} 512 384`} preserveAspectRatio="xMidYMid slice" accessible={false}><SvgImage href={atlases[art.file]} width={1024} height={1536}/></Svg></View>;}
