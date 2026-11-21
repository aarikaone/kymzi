import {publicImageSource} from '@rymzi/cloud';
import {NativeImage as Image} from './NativeImage';
import {View} from 'react-native';
export function NativeTravelHero(){return <View accessible={false} style={{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}><Image source={publicImageSource('/brand/rymzi-world-v2-purple.webp')} accessible={false} style={{width:'100%',height:'100%',resizeMode:'contain'}}/></View>;}
