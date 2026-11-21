import React from 'react';
import type {ViewStyle} from 'react-native';
import {NativeImage} from './NativeImage';
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
export function NativeAttractionImage({id,style,showLoader=false}:{id:string;style?:ViewStyle;showLoader?:boolean}){const art=attractionArtwork(id),a=attractionById(id);if(!art||!a)return null;return <NativeImage showLoader={showLoader} loaderPosition={showLoader?'top':'center'} accessibilityRole="image" accessibilityLabel={`Illustration of ${a.name}`} source={atlases[art.file]} crop={{column:art.column,row:art.row,columns:2,rows:4,tileWidth:512,tileHeight:384}} style={[{width:'100%',aspectRatio:4/3,backgroundColor:'#151B16',borderRadius:16},style]}/>;}
