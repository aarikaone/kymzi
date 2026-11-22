import {NativeImage as Image} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NativePalRail} from './NativeExploreExperience';
import {palForMoment,dailyStatus,countdownParts,remainingDailyPlays,hasDailyProgress} from '@rymzi/core';
import {NIGHT_THEME} from './theme';
import {JOURNEY_COPY} from '@rymzi/core';
import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,FlatList,Pressable,ScrollView,Text,View,useWindowDimensions,type NativeScrollEvent,type NativeSyntheticEvent} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {
  attractionById,countryById,galleryPhotoFeed,isCityPhotoSaved,isAdult,photoMonthProgress,
  publicCityPals,worldPlaces,type CityPhotoItem,type CountryId,type PreviewState,
} from '@rymzi/core';
import {NativeAttractionImage} from './NativeAttractionImage';
import {Hand,PageHeading} from './Typography';

const BG='#090C0A',INK='#F1F5EB',MUTED='#B1BCA8',ACCENT='#D5F88F',LINE='#3E5140';
type Glyph=React.ComponentProps<typeof Ionicons>['name'];
type Props={
  state:PreviewState;now:Date;countryId?:CountryId;initialPhotoId?:string;ownOnly?:boolean;explore?:boolean;onPal?:(id:string)=>void;onPlan:(id:CountryId)=>void;onCities:()=>void;
  onCapture:(id?:CountryId)=>void;onCity:(id:CountryId)=>void;onVisits:()=>void;
  onPlay:()=>void;onRemove:(id:string)=>void;onHide:(id:string)=>void;
  onSave:(id:string)=>void;onSeen:(id:string)=>void;
};
const absolute={position:'absolute' as const,top:0,left:0,right:0,bottom:0};

function Icon({name,size=23,color=ACCENT}:{name:Glyph;size?:number;color?:string}){
  return <Ionicons name={name} size={size} color={color}/>;
}
function Action({label,onPress}:{label:string;onPress:()=>void}){
  return <Pressable accessibilityRole="button" onPress={onPress} style={{minHeight:56,backgroundColor:NIGHT_THEME.primary,borderRadius:16,padding:14,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:20,fontWeight:'600',color:NIGHT_THEME.primaryInk}}>{label}</Text></Pressable>;
}
function NativeUnlockAvatar({waiting,detail,onPress}:{waiting:boolean;detail:string;onPress:()=>void}){
  return <Pressable accessibilityRole="button" accessibilityLabel={waiting?`Next unlock in ${detail}`:'Unlock a new Roamie'} accessibilityHint={waiting?undefined:'Answer three questions, or continue your saved answers'} accessibilityState={{disabled:waiting}} disabled={waiting} onPress={onPress} style={{width:90,alignItems:'center',gap:5,opacity:waiting?.45:1}}>
    <View style={{position:'relative',width:82,height:82,borderRadius:41,borderWidth:2,borderStyle:'dashed',borderColor:ACCENT,backgroundColor:'#D5F88F0D',alignItems:'center',justifyContent:'center'}}><Icon name={waiting?'time-outline':'lock-open-outline'} size={29}/><View style={{position:'absolute',right:-2,bottom:0,width:23,height:23,borderWidth:3,borderColor:BG,borderRadius:13,backgroundColor:ACCENT,alignItems:'center',justifyContent:'center'}}><Icon name="add" size={13} color={NIGHT_THEME.primaryInk}/></View></View>
    <Text style={{fontSize:12,lineHeight:17,fontWeight:'600',color:ACCENT}}>Unlock</Text><Text numberOfLines={1} style={{fontSize:11,lineHeight:16,color:MUTED}}>{detail}</Text>
  </Pressable>;
}
function Shade(){
  return <View pointerEvents="none" style={absolute}><Svg width="100%" height="100%"><Defs><LinearGradient id="momentShade" x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0" stopColor="#090C0A" stopOpacity=".04"/><Stop offset="0.65" stopColor="#090C0A" stopOpacity="0"/><Stop offset="0.85" stopColor="#090C0A" stopOpacity=".08"/><Stop offset="1" stopColor="#090C0A" stopOpacity=".46"/></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#momentShade)"/></Svg></View>;
}
function Photo({item}:{item:CityPhotoItem}){
  return item.image
    ? <Image source={{uri:item.image}} accessibilityLabel={`City scene in ${countryById(item.countryId)!.city}`} style={{...absolute,width:'100%',height:'100%',resizeMode:'cover'}}/>
    : <NativeAttractionImage id={item.artworkId!} style={{...absolute,width:'100%',height:'100%',aspectRatio:undefined,borderRadius:0}}/>;
}
function Round({label,icon,onPress,selected=false,disabled=false}:{label:string;icon:Glyph;onPress:()=>void;selected?:boolean;disabled?:boolean}){
  return <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({width:46,height:46,borderRadius:25,borderWidth:1,borderColor:'#F1F5EB33',backgroundColor:selected?'#284C32':'#151B1699',alignItems:'center',justifyContent:'center',opacity:disabled?.3:pressed?.7:1})}><Icon name={icon} color={selected?'#EAF6D9':'#F1F5EB'} size={23}/></Pressable>;
}

function NativeMomentFeed(props:Props&{items:CityPhotoItem[];mode:'feed'|'grid';setMode:(mode:'feed'|'grid')=>void;header?:React.ReactElement;empty?:React.ReactElement}){
  const {state,items,mode,setMode,onCity,onSave,onSeen,onRemove,onHide,onCapture,onPlay,ownOnly=false,onPlan,onPal,explore=false,header}=props;
  const [index,setIndex]=useState(()=>Math.max(0,items.findIndex(p=>p.id===props.initialPhotoId))),[height,setHeight]=useState(0),[width,setWidth]=useState(0),[flash,setFlash]=useState('');
  const dimensions=useWindowDimensions(),pendingPhoto=useRef<number|null>(null),[headerHeight,setHeaderHeight]=useState(0);
  const list=useRef<FlatList<any>>(null),focused=useIsFocused(),reduce=useRef(false),lastTap=useRef({id:'',at:0});
  const bounce=useRef(new Animated.Value(0)).current;
  const privateOnly=state.profile?.ageBand==='10-12',current=index<items.length?items[index]:undefined;
  const signature=items.map(p=>p.id).join(',');
  const visibility=useRef({onSeen,seenIds:state.photos.seenIds,focused});visibility.current={onSeen,seenIds:state.photos.seenIds,focused};
  const viewConfig=useRef({itemVisiblePercentThreshold:40}).current;
  const viewed=useRef(({viewableItems}:{viewableItems:Array<{item:any;index:number|null;isViewable:boolean}>})=>{if(!visibility.current.focused)return;for(const token of viewableItems){if(!token.isViewable||!('countryId' in token.item))continue;setIndex(token.index??0);if(!visibility.current.seenIds.includes(token.item.id)){visibility.current.seenIds=[...visibility.current.seenIds,token.item.id];visibility.current.onSeen(token.item.id);}}}).current;


  useEffect(()=>{
    void AccessibilityInfo.isReduceMotionEnabled().then(value=>{reduce.current=value;});
    const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{reduce.current=value;});
    return()=>sub.remove();
  },[]);
  useEffect(()=>{
    if(!explore&&focused&&mode==='feed'&&current&&!state.photos.seenIds.includes(current.id))onSeen(current.id);
  },[current?.id,mode,focused]);
  useEffect(()=>{
    const at=Math.min(index,Math.max(0,items.length-1));
    setIndex(at);
    if(!explore&&mode==='feed'&&height)list.current?.scrollToOffset({offset:at*height,animated:false});
  },[signature]);
  useEffect(()=>{if(explore&&mode==='feed'&&height&&headerHeight&&pendingPhoto.current!==null){list.current?.scrollToOffset({offset:headerHeight+pendingPhoto.current*(height+16),animated:false});pendingPhoto.current=null;}},[mode,height,headerHeight,explore]);
  useEffect(()=>{
    if(!flash)return;
    const timer=setTimeout(()=>setFlash(''),650);
    return()=>clearTimeout(timer);
  },[flash]);

  function save(item:CityPhotoItem,onlyAdd=false){
    const saved=isCityPhotoSaved(state,item);
    if(!onlyAdd||!saved)onSave(item.id);
    if(!saved||onlyAdd){
      setFlash(item.id);
      bounce.setValue(0);
      if(!reduce.current)Animated.sequence([
        Animated.timing(bounce,{toValue:1,duration:150,useNativeDriver:true}),
        Animated.timing(bounce,{toValue:0,duration:450,useNativeDriver:true}),
      ]).start();
    }
  }
  function move(at:number){
    const next=Math.max(0,Math.min(items.length,at));
    setIndex(next);
    list.current?.scrollToOffset({offset:height*next,animated:!reduce.current});
  }
  function scrolled(event:NativeSyntheticEvent<NativeScrollEvent>){
    if(!explore&&height)setIndex(Math.min(items.length,Math.max(0,Math.round(event.nativeEvent.contentOffset.y/height))));
  }

  const empty=<View style={{flex:1,minHeight:130,alignItems:'center',justifyContent:'center',gap:20}}><Icon name="camera-outline" size={60}/><Text style={{fontSize:28,color:INK,textAlign:'center'}}>{privateOnly||ownOnly?'Your next moment.':'Your first Roamie is out there.'}</Text><Text style={{fontSize:17,color:MUTED,textAlign:'center'}}>{privateOnly||ownOnly?'Your city, through your lens.':'Match 3 answers. See their world.'}</Text><View style={{width:'100%',marginTop:10}}><Action label={privateOnly||ownOnly?'Shoot your city':JOURNEY_COPY.start} onPress={privateOnly||ownOnly?()=>onCapture():onPlay}/></View></View>;
  if(!items.length)return explore?<ScrollView showsVerticalScrollIndicator={false} style={{marginHorizontal:-12}} contentContainerStyle={{flexGrow:1,gap:20,paddingBottom:20}}>{header}<View style={{paddingHorizontal:12}}>{props.empty??empty}</View></ScrollView>:empty;

  return <View style={{flex:1,minHeight:0,marginHorizontal:-12,marginBottom:-10,borderRadius:explore?0:20,overflow:explore?'visible':'hidden',backgroundColor:explore?BG:'#151B16'}} onLayout={e=>{setHeight(explore?Math.max(400,Math.min(560,Math.round(dimensions.height*.65))):Math.round(e.nativeEvent.layout.height));setWidth(Math.round(e.nativeEvent.layout.width));}}>
    {height>0&&(mode==='grid'?<FlatList key="grid" ListHeaderComponent={header} data={items} numColumns={2} keyExtractor={p=>p.id} showsVerticalScrollIndicator={false} contentContainerStyle={{padding:6,paddingBottom:14}} columnWrapperStyle={{gap:10}} initialNumToRender={8} windowSize={5} renderItem={({item,index:i})=><View style={{width:(width-22)/2,height:i%4===0||i%4===1?224:178,borderRadius:16,overflow:'hidden',marginBottom:10,backgroundColor:'#1D281F'}}><Pressable accessibilityRole="button" accessibilityLabel={`Open photo ${i+1} in ${countryById(item.countryId)!.city}`} onPress={()=>{pendingPhoto.current=i;setIndex(i);setMode('feed');}} style={absolute}><Photo item={item}/><Shade/><View style={{position:'absolute',left:13,right:12,bottom:14,gap:3,paddingHorizontal:8,paddingVertical:6,borderRadius:9,backgroundColor:'#090C0A99'}}><Text style={{fontSize:15,lineHeight:20,color:'#F1F5EB',fontWeight:'600'}}>{countryById(item.countryId)!.city}</Text><Text style={{fontSize:11,lineHeight:16,color:'#F1F5EB'}}>{item.you?'Your lens':item.alias}</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={isCityPhotoSaved(state,item)?'Remove from favorites':'Favorite photo'} accessibilityState={{selected:isCityPhotoSaved(state,item)}} onPress={()=>save(item)} style={{position:'absolute',right:9,top:9,height:42,width:42,borderRadius:14,borderWidth:1,borderColor:isCityPhotoSaved(state,item)?'#D5F88F70':'#C8BEFF55',backgroundColor:'#100D18DD',alignItems:'center',justifyContent:'center'}}><Icon name={isCityPhotoSaved(state,item)?'heart':'heart-outline'} color={isCityPhotoSaved(state,item)?'#D5F88F':'#E6DDFF'} size={21}/></Pressable></View>}/>:<>
      <FlatList key={`feed:${height}`} ref={list} ListHeaderComponent={header?<View onLayout={e=>setHeaderHeight(e.nativeEvent.layout.height)}>{header}</View>:undefined} ItemSeparatorComponent={explore?()=> <View style={{height:16}}/>:undefined} onViewableItemsChanged={explore?viewed:undefined} viewabilityConfig={explore?viewConfig:undefined} data={[...items,{id:'gallery-end'}]} extraData={[index,state.photos.savedIds,flash]} keyExtractor={p=>p.id} pagingEnabled={!explore} snapToInterval={explore?undefined:height} disableIntervalMomentum={!explore} decelerationRate={explore?'normal':'fast'} showsVerticalScrollIndicator={false} initialNumToRender={2} maxToRenderPerBatch={3} windowSize={3} initialScrollIndex={explore?undefined:Math.min(index,items.length)} getItemLayout={explore?undefined:(_,i)=>({length:height,offset:height*i,index:i})} onMomentumScrollEnd={scrolled} onScrollEndDrag={scrolled} onScrollToIndexFailed={()=>list.current?.scrollToOffset({offset:Math.min(index,items.length)*height,animated:false})} renderItem={({item,index:i})=>{
        if(!('countryId' in item))return <View accessibilityElementsHidden={!explore&&index!==items.length} importantForAccessibility={explore||index===items.length?'auto':'no-hide-descendants'} style={{height,padding:26,paddingBottom:66,gap:20,alignItems:'center',justifyContent:'center',backgroundColor:'#172419'}}><Icon name="globe-outline" size={57}/><PageHeading accessibilityRole="header" style={{fontSize:34,lineHeight:38,fontWeight:'600',letterSpacing:-1,color:INK,textAlign:'center'}}>{privateOnly||ownOnly?'Your city moments.':JOURNEY_COPY.galleryEnd}</PageHeading><Text style={{fontSize:16,color:MUTED}}>{privateOnly||ownOnly?'Your camera collection.':JOURNEY_COPY.galleryEndHint}</Text><View style={{width:'100%',marginTop:5}}><Action label="See the gallery" onPress={()=>setMode('grid')}/></View>{!explore&&<Pressable accessibilityRole="button" onPress={privateOnly||ownOnly?()=>onCapture():onPlay} style={{padding:12,minHeight:44}}><Text style={{fontSize:18,color:ACCENT}}>{privateOnly||ownOnly?'Add a city moment':JOURNEY_COPY.start} →</Text></Pressable>}</View>;
        const photo=item as CityPhotoItem,country=countryById(photo.countryId)!,saved=isCityPhotoSaved(state,photo),active=explore||i===index,owner=palForMoment(state,photo);
        return <View accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'} style={{height,overflow:'hidden',backgroundColor:'#151B16'}}>
          <Pressable accessible={false} style={{position:'absolute',top:0,right:0,bottom:0,left:0,borderRadius:18,overflow:'hidden'}} onPress={()=>{const now=Date.now();if(lastTap.current.id===photo.id&&now-lastTap.current.at<300){save(photo,true);lastTap.current={id:'',at:0};}else lastTap.current={id:photo.id,at:now};}}><Photo item={photo}/></Pressable>
          <Shade/>

          <View pointerEvents="box-none" style={{position:'absolute',top:20,left:22,right:19,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Pressable accessibilityRole="button" accessibilityLabel={owner?`Open ${owner.alias} in ${owner.city}`:'Your photo'} disabled={!owner||!onPal} onPress={()=>owner&&onPal?.(owner.id)} style={{backgroundColor:'#0D120E85',padding:7,paddingRight:10,borderRadius:13,borderWidth:1,borderColor:'#F1F5EB2a',flexDirection:'row',alignItems:'center',gap:9}}><View style={{height:29,width:29,borderRadius:15,borderWidth:1,borderColor:'#F1F5EB28',backgroundColor:'#F1F5EB14',alignItems:'center',justifyContent:'center'}}>{photo.you?<Icon name="camera-outline" size={15} color="#F1F5EB"/>:owner?<Image source={avatarImages[owner.imageAvatar]} accessible={false} style={{width:29,height:29,resizeMode:'contain'}}/>:<Icon name="people-outline" size={15} color="#F1F5EB"/>}</View><View style={{gap:3}}><Text style={{fontSize:14,fontWeight:'600',color:'#F1F5EB'}}>{photo.alias}</Text><Text style={{fontSize:10,color:'#B1BCA8'}}>{photo.source==='demo'?'Illustrated preview':privateOnly?'Only you':'Camera shot'}</Text></View></Pressable><Round label={photo.you?'Delete my photo':'Hide this photo'} icon={photo.you?'trash-outline':'close'} onPress={()=>photo.you?onRemove(photo.id):onHide(photo.id)}/></View>
          <View style={{position:'absolute',left:22,right:82,bottom:26,gap:3}}>
            <Pressable accessibilityRole="button" accessibilityLabel={explore&&owner?`View ${owner.alias} and ${country.city}`:`Explore ${country.city}`} disabled={!worldPlaces(state).some(p=>p.country.id===photo.countryId&&p.uncovered)} onPress={()=>explore&&owner&&onPal?onPal(owner.id):onCity(photo.countryId)} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,alignSelf:'flex-start'}}><Icon name="location-outline" size={15} color="#FFFFFF"/><PageHeading accessibilityRole="header" numberOfLines={1} style={{fontSize:18,lineHeight:24,fontWeight:'600',color:'#FFFFFF',textShadowColor:'#00000066',textShadowOffset:{width:0,height:1},textShadowRadius:3}}>{country.city}</PageHeading><Text style={{fontSize:12,color:'#FFFFFF'}}>{country.flag}</Text></Pressable>
            {photo.artworkId&&<Text numberOfLines={1} style={{fontSize:12,lineHeight:17,color:'#F1F5EB',textShadowColor:'#00000066',textShadowOffset:{width:0,height:1},textShadowRadius:2}}>{attractionById(photo.artworkId)?.name}</Text>}
          </View>
          <View style={{position:'absolute',right:21,bottom:111,gap:20,alignItems:'center'}}><View style={{gap:7,alignItems:'center'}}><Round label={saved?'Remove from favorites':'Favorite photo'} icon={saved?'heart':'heart-outline'} selected={saved} onPress={()=>save(photo)}/><Text style={{fontSize:12,color:'#F1F5EB'}}>{saved?'Faved':'Fav'}</Text></View>{isAdult(state.profile!.ageBand)&&!photo.you?<Round label={`Plan visit to ${countryById(photo.countryId)!.city}`} icon="calendar-outline" onPress={()=>onPlan(photo.countryId)}/>:<Round label="Take a city photo" icon="camera-outline" onPress={()=>onCapture(photo.countryId)}/>}</View>
          {flash===photo.id&&<Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={{...absolute,justifyContent:'center',alignItems:'center',gap:10,opacity:reduce.current?1:bounce,transform:[{scale:reduce.current?1:bounce.interpolate({inputRange:[0,1],outputRange:[.8,1]})}]}}><View style={{height:72,width:72,padding:19,borderWidth:1,borderStyle:'dashed',borderColor:'#F1F5EBa8',borderRadius:36,backgroundColor:'#0D120E88',alignItems:'center',justifyContent:'center',transform:[{rotate:'-11deg'}]}}><Icon name="heart" size={35} color="#F1F5EB"/></View><Hand style={{fontSize:29,lineHeight:34,color:'#F1F5EB'}}>Added to Favs</Hand></Animated.View>}
        </View>;
      }}/>
      {!explore&&<View style={{position:'absolute',right:12,bottom:12,flexDirection:'row',alignItems:'center',gap:7}}><Text accessibilityLiveRegion="polite" style={{fontSize:12,color:'#D0DEC3',marginRight:3}}>{index<items.length?`${index+1} / ${items.length}`:'All caught up'}</Text>{[{label:'Previous photo',icon:'chevron-up' as const,at:index-1,disabled:index===0},{label:'Next photo',icon:'chevron-down' as const,at:index+1,disabled:index===items.length}].map(b=><Pressable key={b.label} accessibilityRole="button" accessibilityLabel={b.label} disabled={b.disabled} onPress={()=>move(b.at)} style={{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:'#151B1699',opacity:b.disabled?.3:1}}><Icon name={b.icon} size={19} color="#F1F5EB"/></Pressable>)}</View>}
    </>)}
  </View>;
}


function GalleryViewSwitch({value,onChange}:{value:'photos'|'pals';onChange:(value:'photos'|'pals')=>void}){
  const [width,setWidth]=useState(0),position=useRef(new Animated.Value(value==='photos'?0:1)).current,reduce=useRef(true);
  useEffect(()=>{void AccessibilityInfo.isReduceMotionEnabled().then(v=>{reduce.current=v;});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',v=>{reduce.current=v;});return()=>sub.remove();},[]);
  useEffect(()=>{if(reduce.current){position.setValue(value==='photos'?0:1);return;}const animation=Animated.timing(position,{toValue:value==='photos'?0:1,duration:190,useNativeDriver:true});animation.start();return()=>animation.stop();},[value]);
  return <View accessibilityLabel="Roamies views" onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',padding:4,minHeight:54,borderWidth:1,borderColor:'#52644B',borderRadius:19,backgroundColor:'#1D271E'}}>
    {width>0&&<Animated.View pointerEvents="none" style={{position:'absolute',left:4,top:4,bottom:4,width:(width-10)/2,borderRadius:14,borderWidth:1,borderColor:'#F1F5EB',backgroundColor:'#284C32',transform:[{translateX:position.interpolate({inputRange:[0,1],outputRange:[0,(width-10)/2]})}]}}/>}
    {[{id:'photos' as const,label:JOURNEY_COPY.galleryPhotos,icon:'camera-outline' as const},{id:'pals' as const,label:JOURNEY_COPY.galleryPals,icon:'people-outline' as const}].map(item=><Pressable cssInterop={false} key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{selected:value===item.id}} onPress={()=>onChange(item.id)} style={({pressed})=>({flex:1,minHeight:44,paddingHorizontal:8,paddingVertical:10,borderRadius:14,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8,backgroundColor:width===0&&value===item.id?'#284C32':'transparent',opacity:pressed?.7:1})}><Icon name={item.icon} size={19} color={value===item.id?'#EAF6D9':'#B1BCA8'}/><Text style={{fontSize:17,lineHeight:22,letterSpacing:-.25,fontWeight:value===item.id?'600':'500',color:value===item.id?'#EAF6D9':'#B1BCA8',flexShrink:1,textAlign:'center'}}>{item.label}</Text></Pressable>)}
  </View>;
}

export function NativePalsGallery(props:Props){
  const {state,now,countryId,onCapture,onCity,onVisits,onPlay,onCities,ownOnly=false,onPal,explore=false}=props;
  const viewport=useWindowDimensions(),insets=useSafeAreaInsets();
  const [tab,setTab]=useState<'photos'|'pals'>('photos'),[filter,setFilter]=useState<CountryId|undefined>(countryId),[savedOnly,setSavedOnly]=useState(false),[mode,setMode]=useState<'feed'|'grid'>(viewport.fontScale>1.3?'grid':'feed');
  const playStatus=dailyStatus(state.daily,now),wait=countdownParts(playStatus.remainingMs);
  const privateOnly=state.profile?.ageBand==='10-12',scope=countryId??filter,progress=photoMonthProgress(state,now);
  const visible=(photos:CityPhotoItem[])=>privateOnly||ownOnly?photos.filter(p=>p.you):countryId?photos:photos.filter(p=>!p.you);const all=visible(galleryPhotoFeed(state,undefined,now)),items=visible(galleryPhotoFeed(state,scope,now,savedOnly));const cityIds=[...new Set(all.map(p=>p.countryId))],places=worldPlaces(state).filter(p=>p.uncovered);
  const header=<View style={{gap:10}}>
    {!explore&&<View style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:44}}>
      <PageHeading accessibilityRole="header" style={{flex:1,fontSize:33,lineHeight:38,color:INK,fontWeight:'600',letterSpacing:-1}}>{countryId?countryById(countryId)!.city:privateOnly||ownOnly?'My photos.':'Roamies.'}</PageHeading>
      <Pressable accessibilityRole="button" accessibilityLabel={privateOnly?'Take a city photo':'Shoot your city'} onPress={()=>onCapture(scope)} style={{minHeight:44,paddingHorizontal:12,paddingVertical:9,borderWidth:1,borderColor:'#52644B',backgroundColor:'#172419',borderRadius:14,flexDirection:'row',alignItems:'center',gap:8}}><Icon name="camera-outline" size={21}/><Text accessibilityLabel={`${Math.min(progress.count,3)} of 3 photos this month`} style={{fontSize:21,color:ACCENT}}>{Math.min(progress.count,3)}<Text style={{fontSize:15,color:MUTED}}>/3</Text></Text></Pressable>
      {!countryId&&!privateOnly&&!ownOnly&&<Pressable accessibilityRole="button" accessibilityLabel="Cities" onPress={onCities} style={{padding:9}}><Icon name="globe-outline" size={23}/></Pressable>}
      {!countryId&&!ownOnly&&isAdult(state.profile!.ageBand)&&<Pressable accessibilityRole="button" accessibilityLabel="Visits" onPress={onVisits} style={{padding:9}}><Icon name="calendar-outline" size={23}/></Pressable>}
    </View>}
    {!explore&&!countryId&&!privateOnly&&!ownOnly&&<Text style={{fontSize:14,lineHeight:20,color:'#D5F88F'}}>Their city. Their lens. Username profile.</Text>}
    {explore&&onPal&&<NativePalRail state={state} now={now} onPal={onPal} showVisits={false} leadingAction={<NativeUnlockAvatar waiting={playStatus.kind==='waiting'} detail={playStatus.kind==='waiting'?`${wait.hours}h ${wait.minutes}m`:hasDailyProgress(state.daily)?'Continue':`${remainingDailyPlays(state.daily,now)} left`} onPress={onPlay}/>}/>}{privateOnly&&<Text style={{fontSize:14,color:MUTED}}>Private collection · This device</Text>}
    {!explore&&!countryId&&!privateOnly&&!ownOnly&&<GalleryViewSwitch value={tab} onChange={setTab}/>}
    {tab==='photos'&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:42}}>{!countryId&&cityIds.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1,maxHeight:42}} contentContainerStyle={{gap:7}}>{[{id:undefined,label:'Everywhere'},...cityIds.map(id=>({id,label:`${countryById(id)!.flag} ${countryById(id)!.city}`}))].map(c=><Pressable key={c.id??'all'} accessibilityRole="button" accessibilityState={{selected:c.id===filter}} onPress={()=>setFilter(c.id)} style={{minHeight:40,paddingHorizontal:11,paddingVertical:9,borderWidth:1,borderColor:c.id===filter?'#9DA994':LINE,backgroundColor:c.id===filter?'#1D281F':'transparent',borderRadius:11}}><Text style={{fontSize:14,color:c.id===filter?ACCENT:MUTED}}>{c.label}</Text></Pressable>)}</ScrollView>:countryId||privateOnly?<Hand style={{fontSize:25,lineHeight:31,color:'#D0DEC3'}}>{savedOnly?'Your favorites':privateOnly||ownOnly?'Your lens':'Their lens'}</Hand>:<Text style={{fontSize:14,color:'#9DA994',letterSpacing:.15}}>{savedOnly?'':`${items.length} ${items.length===1?'moment':'moments'}`}</Text>}<View style={{flexDirection:'row',gap:6}}>{[{label:'Favorite photos',icon:(savedOnly?'heart':'heart-outline') as Glyph,selected:savedOnly,press:()=>setSavedOnly(!savedOnly)},{label:mode==='feed'?'Show photo grid':'Show swipe feed',icon:(mode==='feed'?'grid-outline':'layers-outline') as Glyph,selected:mode==='grid',press:()=>setMode(mode==='feed'?'grid':'feed')}].map(b=><Pressable cssInterop={false} key={b.label} accessibilityRole="button" accessibilityLabel={b.label} accessibilityState={{selected:b.selected}} onPress={b.press} style={({pressed})=>({height:42,width:42,alignItems:'center',justifyContent:'center',borderRadius:13,borderWidth:1,borderColor:b.selected?'#F1F5EB':'#3E5140',backgroundColor:b.selected?'#284C32':'#1D271E',opacity:pressed?.7:1})}><Icon name={b.icon} size={20} color={b.selected?'#EAF6D9':'#B1BCA8'}/></Pressable>)}</View></View>}

  </View>;
  const savedEmpty=<View style={{flex:1,alignItems:'center',justifyContent:'center',gap:20}}><Icon name="heart-outline" size={54}/><Text style={{fontSize:28,color:INK,textAlign:'center'}}>Keep a little of their world.</Text><Text style={{fontSize:17,color:MUTED}}>Tap a heart to keep a moment.</Text><View style={{width:'100%'}}><Action label="Browse moments" onPress={()=>setSavedOnly(false)}/></View></View>;
  if(explore)return <View style={{flex:1,minHeight:0,paddingHorizontal:22,paddingTop:12,paddingBottom:Math.max(18,insets.bottom),backgroundColor:BG}}><NativeMomentFeed key={`${scope??'all'}:${savedOnly}`} {...props} items={items} mode={mode} setMode={setMode} header={<View style={{gap:10,paddingHorizontal:12,paddingBottom:16}}>{header}</View>} empty={savedOnly?savedEmpty:undefined}/></View>;
  return <View style={{flex:1,minHeight:0,paddingHorizontal:22,paddingTop:12,paddingBottom:Math.max(18,insets.bottom),gap:10,backgroundColor:BG}}>
    {header}
    {tab==='pals'?<ScrollView style={{flex:1}}>{places.map(p=><Pressable key={p.country.id} accessibilityRole="button" accessibilityLabel={`Connected Roamies in ${p.country.city}`} onPress={()=>onCity(p.country.id)} style={{minHeight:96,flexDirection:'row',alignItems:'center',gap:15,paddingVertical:14,borderBottomWidth:1,borderColor:LINE}}><NativeAttractionImage id={p.attractions[0].id} style={{width:65,height:65,aspectRatio:undefined,borderRadius:13}}/><View style={{flex:1,gap:7}}><Text style={{fontSize:24,color:INK}}>{p.country.city}</Text><Text style={{fontSize:15,color:MUTED}}>{publicCityPals(state,p.country.id).length} Roamies</Text></View><Icon name="arrow-forward" size={20}/></Pressable>)}{!places.length&&<View style={{paddingTop:60,gap:22}}><Text style={{fontSize:29,color:INK,textAlign:'center'}}>New cities. New perspectives.</Text><Action label={JOURNEY_COPY.start} onPress={onPlay}/></View>}</ScrollView>:<>

      
      {savedOnly&&!items.length?savedEmpty:<NativeMomentFeed key={`${scope??'all'}:${savedOnly}`} {...props} items={items} mode={mode} setMode={setMode}/>}
    </>}
  </View>;
}
