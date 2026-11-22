import {View} from 'react-native';
import type {AvatarId} from '@rymzi/core';
import {CONNECTION_APPEARANCE,CONNECTION_AVATAR_SIZE,type ConnectionKind} from '../../../packages/shared/connectionAppearance';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
export function NativeConnectionAvatar({avatar,kind,size=CONNECTION_AVATAR_SIZE,label}:{avatar:AvatarId;kind:ConnectionKind;size?:number;label?:string}){
 const colors=CONNECTION_APPEARANCE[kind];
 return <View accessible={!!label} accessibilityRole={label?'image':undefined} accessibilityLabel={label} style={{width:size,height:size,borderRadius:size/2,borderWidth:3,borderColor:colors.color,padding:3,backgroundColor:'#090C0A'}}><View style={{flex:1,width:'100%',borderRadius:size/2,overflow:'hidden',backgroundColor:colors.surface}}><NativeImage source={avatarImages[avatar]} accessible={false} style={{width:'100%',height:'100%',resizeMode:'contain'}}/></View></View>;
}
