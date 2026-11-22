import {ActivityIndicator,View} from 'react-native';
import {KymziSymbol} from './Brand';

/** Static brand artwork is available before fonts and cloud settings load. */
export function NativeLoadingLogo({loading=true}:{loading?:boolean}){
 return <View accessible accessibilityRole={loading?'progressbar':'image'} accessibilityLabel={loading?'Loading Kymzi':'Kymzi'} style={{width:112,minHeight:112,paddingVertical:8,gap:20,alignItems:'center',justifyContent:'center'}}><KymziSymbol size={96}/>{loading&&<ActivityIndicator size="small" color="#D5F88F" accessible={false} style={{width:24,height:24}}/>}</View>;
}
