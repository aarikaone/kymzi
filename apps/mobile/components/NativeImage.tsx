import React,{forwardRef,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {AccessibilityInfo,ActivityIndicator,Animated,Image as SystemImage,Pressable,StyleSheet,Text,View,
  type ImageProps,type ImageStyle,type StyleProp,type ViewStyle} from 'react-native';
import {cropImage,forgetLoadedImage,imageIdentity,imageWasLoaded,rememberLoadedImage,type ImageCrop} from './image-loading';

export type NativeImageProps=Omit<ImageProps,'style'>&{style?:StyleProp<ImageStyle|ViewStyle>;crop?:ImageCrop;showLoader?:boolean;loaderPosition?:'center'|'top'};

// A single native motion subscription serves the whole image grid.
let reducedMotion=true;
const motionListeners=new Set<()=>void>();
let motionSubscription:ReturnType<typeof AccessibilityInfo.addEventListener>|undefined;
function publishMotion(value:boolean){reducedMotion=value;motionListeners.forEach(listener=>listener());}
function subscribeMotion(listener:()=>void) {
  motionListeners.add(listener);
  if(motionListeners.size===1){
    void AccessibilityInfo.isReduceMotionEnabled().then(publishMotion).catch(()=>{});
    motionSubscription=AccessibilityInfo.addEventListener('reduceMotionChanged',publishMotion);
  }
  return ()=>{motionListeners.delete(listener);if(!motionListeners.size){motionSubscription?.remove();motionSubscription=undefined;}};
}

export const NativeImage=forwardRef<SystemImage,NativeImageProps>(function NativeImage(props,ref) {
  const source=props.source;
  const raw=typeof source==='number'?source:Array.isArray(source)?source.map(item=>item.uri??'').join('|'):source?.uri??'';
  const identity=useMemo(()=>imageIdentity(raw),[raw]);
  return <ImageFrame key={`${identity}:${props.showLoader?'loader':'auto'}`} {...props} identity={identity} ref={ref}/>;
});

const ImageFrame=forwardRef<SystemImage,NativeImageProps&{identity:string}>(function ImageFrame({
  identity,source,style,crop,showLoader=false,loaderPosition='center',onLoad,onError,onLoadStart,onLayout,accessible,accessibilityLabel,
  accessibilityRole,accessibilityState,resizeMode,...imageProps
},ref) {
  const cached=useRef(!showLoader&&imageWasLoaded(identity)).current;
  const [status,setStatus]=useState<'loading'|'ready'|'error'>(cached?'ready':source?'loading':'error');
  const [visible,setVisible]=useState(!cached),[spinner,setSpinner]=useState(showLoader),[attempt,setAttempt]=useState(0);
  const [size,setSize]=useState({width:0,height:0});
  const opacity=useRef(new Animated.Value(cached?0:1)).current;
  const reduced=useSyncExternalStore(subscribeMotion,()=>reducedMotion,()=>true);
  const flat=(StyleSheet.flatten(style)??{}) as ImageStyle;
  const {resizeMode:styleMode,tintColor,overlayColor,objectFit,...layout}=flat;
  const natural=!crop&&source?SystemImage.resolveAssetSource(source):undefined;
  const position=crop&&size.width>0&&size.height>0?cropImage(crop,size.width,size.height):undefined;

  useEffect(()=>{
    if(status!=='loading'){setSpinner(false);return;}
    const show=setTimeout(()=>setSpinner(true),showLoader?0:140);
    // A stalled request must not leave an endless spinner.
    const timeout=setTimeout(()=>{forgetLoadedImage(identity);setStatus('error');},20000);
    return ()=>{clearTimeout(show);clearTimeout(timeout);};
  },[status,attempt,identity,showLoader]);

  useEffect(()=>{
    if(status!=='ready'){opacity.setValue(1);setVisible(true);return;}
    if(reduced||cached){opacity.setValue(0);setVisible(false);return;}
    const fade=Animated.timing(opacity,{toValue:0,duration:180,useNativeDriver:true});
    fade.start(({finished})=>{if(finished)setVisible(false);});
    return ()=>fade.stop();
  },[status,reduced,opacity,cached]);

  function retry(){forgetLoadedImage(identity);opacity.setValue(1);setVisible(true);setSpinner(showLoader);setAttempt(value=>value+1);setStatus('loading');}

  return <View
    accessible={status!=='error'&&(accessible??!!accessibilityLabel)}
    accessibilityRole={accessibilityRole??'image'} accessibilityLabel={accessibilityLabel}
    accessibilityState={{...accessibilityState,busy:status==='loading'}}
    style={[natural&&{width:natural.width,height:natural.height},layout as StyleProp<ViewStyle>,S.frame]}
    onLayout={event=>{const {width,height}=event.nativeEvent.layout;setSize(previous=>previous.width===width&&previous.height===height?previous:{width,height});onLayout?.(event);}}>
    {(!crop||position)&&<SystemImage key={attempt} {...imageProps} ref={ref} source={source} accessible={false}
      resizeMode={crop?'stretch':resizeMode??styleMode??'cover'}
      style={[position?{position:'absolute',...position}:S.fill,{tintColor,overlayColor,objectFit} as ImageStyle]}
      onLoadStart={onLoadStart}
      onLoad={event=>{rememberLoadedImage(identity);setStatus('ready');onLoad?.(event);}}
      onError={event=>{forgetLoadedImage(identity);setStatus('error');onError?.(event);}}/>}
    {visible&&<Animated.View pointerEvents={status==='error'?'auto':'none'} style={[S.placeholder,{opacity}]}
      accessibilityElementsHidden={status!=='error'} importantForAccessibility={status==='error'?'auto':'no-hide-descendants'}>
      {status==='error'?<Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel?`Retry image: ${accessibilityLabel}`:'Retry image'} onPress={event=>{event.stopPropagation();retry();}} style={S.retry}><Text style={S.retryIcon}>↻</Text></Pressable>
        :spinner&&Math.min(size.width,size.height)>=40?<View style={loaderPosition==='top'?S.topIndicator:undefined}>{reduced?<View style={S.stillRing}/>:<ActivityIndicator size="small" color="#C8BEFF"/>}</View>:null}
    </Animated.View>}
  </View>;
});

const S=StyleSheet.create({
  frame:{overflow:'hidden'},
  fill:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},
  placeholder:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',backgroundColor:'#1B241E'},
  retry:{width:'100%',height:'100%',minHeight:24,alignItems:'center',justifyContent:'center'},
  retryIcon:{fontSize:25,lineHeight:30,color:'#C8BEFF'},
  topIndicator:{position:'absolute',top:'22%',left:0,right:0,alignItems:'center'},
  stillRing:{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:'#716986',borderTopColor:'#D8CCF6'},
});
