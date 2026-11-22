import {HeaderScrollView as ScrollView} from './NativeHeaderGlass';
import {NativeImage as Image} from './NativeImage';
import {NativeExploreAchievements} from './NativeExploreAchievements';
import React,{useState} from 'react';
import {Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {remainingDailyPlays,dailyStatus,countdownParts,hasDailyProgress,worldPlaces,palSummaries,unseenPlaceCheckIns,LAUNCH_GUIDES,countryById,attractionsForCountry,type PreviewState,type CountryId,type PalSummary} from '@rymzi/core';
import {Goal,CheckInDoor} from './NativeLaunchExperience';
import {NativeAttractionImage} from './NativeAttractionImage';
import {avatarImages} from './avatarAssets';
import {Hand,PageHeading} from './Typography';
import {NIGHT_THEME as C} from './theme';
function Page({children}:{children:React.ReactNode}){return <SafeAreaView edges={['bottom']} style={{flex:1,backgroundColor:C.ground}}><ScrollView contentContainerStyle={{flexGrow:1,paddingHorizontal:24,paddingTop:18,paddingBottom:20,gap:17}}>{children}</ScrollView></SafeAreaView>;}
function Action({label,onPress,disabled=false,quiet=false}:{label:string;onPress:()=>void;disabled?:boolean;quiet?:boolean}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{minHeight:quiet?40:58,borderRadius:19,paddingHorizontal:14,backgroundColor:quiet?'transparent':C.accent,alignItems:'center',justifyContent:'center',opacity:disabled?.4:1}}><Text style={{fontSize:quiet?15:19,fontWeight:quiet?'500':'600',color:quiet?C.accent:C.primaryInk}}>{label}</Text></Pressable>;}
export function NativeGlobalHome({state,now,onPlay,onTasks,onCheckIn}:{state:PreviewState;now:Date;onPlay:()=>void;onTasks:()=>void;onCheckIn:()=>void}){
 const status=dailyStatus(state.daily,now),left=remainingDailyPlays(state.daily,now),waiting=status.kind==='waiting'||(!left&&!hasDailyProgress(state.daily)),t=countdownParts(status.remainingMs);
 return <Page><View style={{gap:10}}><PageHeading accessibilityRole="header" style={{fontSize:35,lineHeight:40,fontWeight:'600',letterSpacing:-1.3,color:C.ink}}>Someone new.{'\n'}<Hand style={{fontSize:45,lineHeight:48,color:C.accent}}>Somewhere new.</Hand></PageHeading></View><View style={{flex:1,minHeight:200,alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',left:0,right:0,top:'32%',height:105,borderWidth:1,borderStyle:'dashed',borderColor:'#C8BEFF50',borderRadius:160,transform:[{rotate:'-18deg'}]}}/><Ionicons name="globe-outline" size={115} color="#D5F88F6B"/><Image source={avatarImages[state.profile!.avatar]} style={{position:'absolute',height:140,width:140,left:-8,top:'32%',resizeMode:'contain'}}/><View style={{position:'absolute',right:7,top:'4%',height:100,width:100,borderRadius:55,borderWidth:1,borderColor:'#C8BEFF55',backgroundColor:'#22242D',alignItems:'center',justifyContent:'center'}}><Hand style={{fontSize:67,color:C.lavender}}>?</Hand></View><Ionicons name="arrow-up-outline" size={31} color={C.accent} style={{position:'absolute',right:'7%',bottom:'13%',transform:[{rotate:'45deg'}]}}/></View><Text style={{textAlign:'center',fontSize:20,lineHeight:28,color:'#D9E3D0'}}>3 answers. One new roamie.</Text>{state.cityMeetup?.checkIn&&<CheckInDoor state={state} onOpen={onCheckIn}/>}<View style={{marginTop:'auto',gap:10}}><Text style={{textAlign:'center',fontSize:12,lineHeight:18,color:C.muted}}>{waiting?`Next play in ${t.hours}h ${t.minutes}m`:`${left} ${left===1?'play':'plays'} left today`}</Text><Action label={waiting?'Back soon':hasDailyProgress(state.daily)?'Continue':'Find my roamie'} disabled={waiting} onPress={onPlay}/><Text style={{textAlign:'center',fontSize:12,lineHeight:19,color:C.muted}}>Local preview</Text></View></Page>;
}
export function NativeGlobalCities({state,onCity,onPhotos,onPlay,onCheckIn,onGuide,onPal,travel}:{state:PreviewState;onCity:(id:CountryId)=>void;onPhotos:(id:CountryId)=>void;onPlay:()=>void;onCheckIn:()=>void;onGuide:(id:CountryId)=>void;onPal:(id:string)=>void;travel?:React.ReactNode}){
 const places=worldPlaces(state).filter(p=>p.uncovered),pals=palSummaries(state),[guides,setGuides]=useState(false),compact=useWindowDimensions().width<360;
 const privateOnly=state.profile?.ageBand==='10-12';
 return <Page>
  {travel}
  <NativeExploreAchievements state={state}/>
  <View style={E.section}><PageHeading accessibilityRole="header" style={E.sectionTitle}>Your places</PageHeading></View>
  {places.length?<View style={E.grid}>{places.map(place=>{
   const city=place.country,cityPals=pals.filter(p=>p.countryId===city.id),fresh=unseenPlaceCheckIns(state,city.id);
   return <View key={city.id} style={E.place}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Explore ${city.city}, ${city.name}. ${cityPals.length} roamies`} onPress={()=>onCity(city.id)} style={E.image}>
     <NativeAttractionImage id={place.attractions[0].id} style={{height:'100%',width:'100%',aspectRatio:undefined,borderRadius:0}}/>
     <View accessible={false} style={E.unlock}><Ionicons name="checkmark" size={13} color={C.primaryInk}/></View>
     <View style={E.location}><Text numberOfLines={1} style={E.city}>{city.city}</Text><Text style={{fontSize:14}}>{city.flag}</Text></View>
    </Pressable>
    <View style={E.info}>
     <View style={E.placeHeading}><Text style={E.palCount}>{privateOnly?'Your collection':`${cityPals.length} ${cityPals.length===1?'roamie':'roamies'}`}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Check-ins from ${city.city}${fresh?`, ${fresh} new`:''}`} onPress={()=>onPhotos(city.id)} style={E.photos}><Ionicons name="location-outline" size={18} color={C.lavender}/>{fresh>0&&<View style={E.fresh}><Text style={E.freshCount}>{fresh>9?'9+':fresh}</Text></View>}</Pressable></View>
     {cityPals.length>0&&<CityPals pals={cityPals} compact={compact} onPal={onPal}/>}
    </View>
   </View>;
  })}</View>:<View style={E.empty}><Ionicons name="globe-outline" size={55} color={C.accent}/><PageHeading style={E.emptyTitle}>Unlock your first place.</PageHeading><Action label="Unlock a place" onPress={onPlay}/></View>}
  <Action quiet label={guides?'Hide guides':'City guides'} onPress={()=>setGuides(!guides)}/>
  {guides&&<View style={E.grid}>{LAUNCH_GUIDES.map(id=><Pressable accessibilityRole="button" accessibilityLabel={`Explore ${countryById(id)!.city} guide`} key={id} onPress={()=>onGuide(id)} style={E.guide}><NativeAttractionImage id={attractionsForCountry(id)[0].id} style={{height:135,width:'100%',borderRadius:0}}/><View style={{padding:12,gap:5}}><Text style={{fontSize:11,color:C.muted}}>City guide</Text><Text style={{fontSize:19,color:C.ink}}>{countryById(id)!.city}</Text></View></Pressable>)}</View>}
 </Page>;
}
function CityPals({pals,onPal,compact}:{pals:PalSummary[];onPal:(id:string)=>void;compact:boolean}){
 const shown=pals.slice(0,compact?1:2),more=pals.length-shown.length;
 return <View style={E.faces}>{shown.map(pal=><Pressable accessibilityRole="button" accessibilityLabel={`Open ${pal.alias} in ${pal.city}`} key={pal.id} onPress={()=>onPal(pal.id)} hitSlop={{left:2,right:2}} style={E.faceButton}><Image source={avatarImages[pal.imageAvatar]} accessible={false} style={E.face}/></Pressable>)}{more>0&&<View accessible={false} style={E.more}><Text style={E.moreText}>+{more}</Text></View>}</View>;
}
const E=StyleSheet.create({
 section:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 sectionTitle:{fontSize:22,lineHeight:29,fontWeight:'600',letterSpacing:-.4,color:C.ink},
 grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:13},
 place:{width:'48%',overflow:'hidden',borderRadius:23,backgroundColor:C.surface,borderWidth:1,borderColor:'#344136',marginBottom:2},
 image:{height:167,overflow:'hidden'},
 unlock:{position:'absolute',right:10,top:10,width:23,height:23,borderRadius:12,borderWidth:2,borderColor:'#090C0A55',backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
 location:{position:'absolute',bottom:0,left:0,right:0,paddingHorizontal:11,paddingVertical:10,backgroundColor:'#090C0A99',flexDirection:'row',alignItems:'center',gap:5},
 city:{flex:1,fontSize:18,lineHeight:24,fontWeight:'600',color:'#FFFFFF'},
 info:{paddingHorizontal:10,paddingTop:3,paddingBottom:8,gap:1},placeHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:3},palCount:{fontSize:14,lineHeight:21,fontWeight:'500',color:C.ink,flexShrink:1},
 photos:{width:44,height:44,alignItems:'center',justifyContent:'center'},fresh:{position:'absolute',right:-2,top:1,minWidth:15,height:15,borderRadius:8,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',paddingHorizontal:2},freshCount:{fontSize:8,lineHeight:12,fontWeight:'600',color:C.primaryInk},
 faces:{flexDirection:'row',alignItems:'center',gap:4,minHeight:44},faceButton:{width:40,height:44,alignItems:'center',justifyContent:'center'},face:{width:35,height:35,borderRadius:18,borderWidth:1,borderColor:'#657452',backgroundColor:C.raised,resizeMode:'contain'},
 more:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#2D293B'},moreText:{fontSize:11,fontWeight:'600',color:C.lavender},
 empty:{minHeight:215,justifyContent:'center',gap:18,paddingVertical:18},emptyTitle:{fontSize:25,lineHeight:32,fontWeight:'600',letterSpacing:-.5,color:C.ink},
 guide:{width:'48%',borderRadius:21,overflow:'hidden',backgroundColor:C.surface},
});
