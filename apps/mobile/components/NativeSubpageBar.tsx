import type {ReactNode} from 'react';
import {View,type LayoutChangeEvent} from 'react-native';
import {Header,HeaderBackButton} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NIGHT_THEME as C} from './theme';

/** Same native header used by the navigation stack, also inside city modals. */
export function NativeSubpageBar({title,onBack,backLabel='Go back',right,safeArea=false,onLayout}:{title:string;onBack:()=>void;backLabel?:string;right?:ReactNode;safeArea?:boolean;onLayout?:(event:LayoutChangeEvent)=>void}){
 const insets=useSafeAreaInsets();
 return <View onLayout={onLayout}><Header title={title} headerStatusBarHeight={safeArea?insets.top:0} headerTitleAlign="center" headerStyle={{backgroundColor:C.ground}} headerTintColor={C.accent} headerTitleStyle={{color:C.ink,fontSize:17,fontWeight:'600'}} headerShadowVisible={false} headerLeft={props=><HeaderBackButton {...props} displayMode="minimal" accessibilityLabel={backLabel} onPress={onBack}/>} headerRight={()=>right??null} headerRightContainerStyle={{paddingRight:16}}/></View>;
}
