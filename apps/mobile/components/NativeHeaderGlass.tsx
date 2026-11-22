import React,{createContext,forwardRef,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,Animated,Platform,ScrollView,StyleSheet,View,type ScrollViewProps} from 'react-native';
import {HeaderHeightContext} from '@react-navigation/elements';
import {useFocusEffect} from '@react-navigation/native';
import {requireOptionalNativeModule} from 'expo';
import {NIGHT_THEME as C} from './theme';
const Glass=createContext({scrolled:false,setScrolled:(_value:boolean)=>{}}),Underlay=createContext(false);
// Older installed development builds keep a translucent tint until ExpoBlur is included.
const Blur=Platform.OS!=='web'&&requireOptionalNativeModule('ExpoBlurView')?require('expo-blur').BlurView as typeof import('expo-blur').BlurView:null;
export function NativeHeaderGlassProvider({children}:{children:ReactNode}){const [scrolled,setScrolled]=useState(false),value=useMemo(()=>({scrolled,setScrolled}),[scrolled]);return <Glass.Provider value={value}>{children}</Glass.Provider>;}
export function NativeHeaderUnderlay({children,enabled=true}:{children:ReactNode;enabled?:boolean}){const {setScrolled}=useContext(Glass);useFocusEffect(useCallback(()=>{setScrolled(false);return()=>setScrolled(false);},[setScrolled]));return <Underlay.Provider value={enabled}>{children}</Underlay.Provider>;}
export function NativeHeaderGlassBackground(){
 const {scrolled}=useContext(Glass),[reduce,setReduce]=useState(false),opacity=useRef(new Animated.Value(1)).current;
 useEffect(()=>{if(Platform.OS!=='ios')return;let alive=true;void AccessibilityInfo.isReduceTransparencyEnabled().then(value=>{if(alive)setReduce(value);},()=>{});const subscription=AccessibilityInfo.addEventListener('reduceTransparencyChanged',setReduce);return()=>{alive=false;subscription.remove();};},[]);
 useEffect(()=>{const animation=Animated.timing(opacity,{toValue:scrolled&&!reduce ? 0.78 : 1,duration:180,useNativeDriver:true});animation.start();return()=>animation.stop();},[scrolled,reduce,opacity]);
 return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>{Blur&&!reduce&&<Blur tint="dark" intensity={28} style={StyleSheet.absoluteFill}/>}<Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:C.ground,opacity}]}/></View>;
}
/** The top inset lives inside the first vertical scroller, so content can pass behind the bar. */
export const HeaderScrollView=forwardRef<ScrollView,ScrollViewProps>(function HeaderScrollView({children,contentContainerStyle,onScroll,horizontal,...props},ref){
 const scope=useContext(Underlay),enabled=scope&&!horizontal,height=useContext(HeaderHeightContext)??0,{scrolled,setScrolled}=useContext(Glass),style=StyleSheet.flatten(contentContainerStyle),padding=style?.paddingTop??style?.paddingVertical??style?.padding??0,top=typeof padding==='number'?padding:0;
 return <ScrollView {...props} ref={ref} horizontal={horizontal} contentInsetAdjustmentBehavior={enabled?'never':props.contentInsetAdjustmentBehavior} automaticallyAdjustContentInsets={enabled?false:props.automaticallyAdjustContentInsets} scrollIndicatorInsets={enabled?{...props.scrollIndicatorInsets,top:height}:props.scrollIndicatorInsets} scrollEventThrottle={enabled?16:props.scrollEventThrottle} contentContainerStyle={enabled?[contentContainerStyle,{paddingTop:height+top}]:contentContainerStyle} onScroll={event=>{if(enabled){const value=event.nativeEvent.contentOffset.y>8;if(value!==scrolled)setScrolled(value);}onScroll?.(event);}}><Underlay.Provider value={enabled?false:scope}>{children}</Underlay.Provider></ScrollView>;
});

export type HeaderScrollView=ScrollView;
