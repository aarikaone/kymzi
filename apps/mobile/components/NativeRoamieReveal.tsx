import {PageHeading} from './Typography';
import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {attractionsForCountry,canUseCityBoard,countryById,dayCardPicks,latestPlayConnections,palFor,playCountry,type CountryId,type PreviewState} from '@rymzi/core';
import {NativeAttractionImage} from './NativeAttractionImage';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NIGHT_THEME as C} from './theme';

type Props={
  state:PreviewState;
  onPal?:(id:string)=>void;
  onCountry:(id:CountryId)=>void;
  onBoard:(id:CountryId)=>void;
  onAttraction:(id:string)=>void;
  onPhotos:(id:CountryId)=>void;
  onPlan:(id:CountryId)=>void;
};

export function NativeRoamieReveal({state,onPal,onCountry,onAttraction,onPhotos,onPlan}:Props){
  const insets=useSafeAreaInsets();
  const found=latestPlayConnections(state.social,state.daily,state.profile!.ageBand,state.blocked);
  const connection=found[0],country=countryById(connection?.countryId??playCountry(state.daily))!;
  const pal=connection?palFor(state,connection.peer.id):undefined;
  const privateOnly=state.profile?.ageBand==='10-12',places=attractionsForCountry(country.id);
  const ids=state.daily.lastQuestionIds,picks=dayCardPicks(ids,ids.map(id=>state.answers[id]??''));
  const openPal=()=>onPal&&connection?onPal(connection.peer.id):onPhotos(country.id);
  const cityPreview=<>
    <NativeAttractionImage id={places[0].id} showLoader style={S.cityImage}/>
    <View style={S.cityCopy}><Text style={S.cityKicker}>{privateOnly?'YOUR NEW CITY':'THEIR CITY'}</Text><Text style={S.cityName}>{country.city}</Text><Text style={S.country}>{country.flag} {country.name}</Text></View>
    {!privateOnly&&<Ionicons name="arrow-forward" size={20} color={C.accent} style={{marginRight:15}}/>}
  </>;

  return <View style={S.page}>
    <ScrollView style={{flex:1}} contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
      <View style={S.heading}>
        <View style={S.status}><Ionicons name={privateOnly?'globe-outline':'checkmark'} size={14} color={C.accent}/><Text style={S.statusText}>{privateOnly?'Virtual city':'3/3 answers matched'}</Text></View>
        <PageHeading accessibilityRole="header" style={S.title}>{privateOnly?`${country.city}.`:'You found a roamie.'}</PageHeading>
      </View>

      {!privateOnly&&<View style={S.person} accessibilityLabel="Your new roamie">
        <View style={S.character}><NativeImage showLoader source={avatarImages[pal?.imageAvatar??'cloud']} accessibilityLabel="Your roamie’s character" style={S.avatar}/></View>
        <View style={S.personCopy}><Text style={S.personKicker}>A NEW CONNECTION</Text><PageHeading accessibilityRole="header" style={S.alias}>{pal?.alias??'Your roamie'}</PageHeading><View style={S.private}><Ionicons name="lock-closed-outline" size={13} color="#D0C4DE"/><Text style={S.privateText}>Identity private</Text></View></View>
        <Ionicons name="sparkles-outline" size={20} color={C.lavender} style={S.spark}/>
      </View>}

      {picks.length===3&&<View style={S.common} accessibilityLabel={privateOnly?'Your kind of day':'Your shared kind of day'}>
        <PageHeading accessibilityRole="header" style={S.commonTitle}>{privateOnly?'Your kind of day':'You both picked'}</PageHeading>
        <View style={S.picks}>{picks.map(p=><View key={p.id} style={S.pick}><Ionicons name="checkmark" size={12} color={C.accent}/><Text style={S.pickText}>{p.label}</Text></View>)}</View>
      </View>}

      <View style={S.destination} accessibilityLabel={privateOnly?'Your new city':'Their city'}>
        {privateOnly?<View style={S.cityPreview}>{cityPreview}</View>:<Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={`Explore ${country.city}`} onPress={()=>onCountry(country.id)} style={({pressed})=>[S.cityPreview,pressed&&S.pressed]}>{cityPreview}</Pressable>}
        <View style={S.placeLinks}>{places.slice(0,2).map(a=><Pressable key={a.id} cssInterop={false} accessibilityRole="button" accessibilityLabel={`Discover ${a.name}`} onPress={()=>onAttraction(a.id)} style={({pressed})=>[S.placeLink,pressed&&S.pressed]}><Text style={S.placeName}>{a.name}</Text><Ionicons name="arrow-forward" size={16} color="#9CAE8E"/></Pressable>)}</View>
      </View>
    </ScrollView>

    <View style={[S.actions,{paddingBottom:Math.max(12,insets.bottom)}]}>
      <Pressable cssInterop={false} accessibilityRole="button" onPress={privateOnly?()=>onCountry(country.id):openPal} style={({pressed})=>[S.primary,pressed&&{backgroundColor:C.primaryPressed}]}><Text style={S.primaryText}>{privateOnly?`Explore ${country.city}`:'Meet my roamie'}</Text><Ionicons name="arrow-forward" size={21} color={C.primaryInk}/></Pressable>
      {canUseCityBoard(state,country.id)&&<Pressable cssInterop={false} accessibilityRole="button" onPress={()=>onPlan(country.id)} style={({pressed})=>[S.plan,pressed&&S.pressed]}><Ionicons name="calendar-outline" size={17} color={C.muted}/><Text style={S.planText}>Plan a visit</Text></Pressable>}
    </View>
  </View>;
}

const S=StyleSheet.create({
  page:{flex:1,minHeight:0,backgroundColor:C.ground},
  body:{paddingTop:12,paddingHorizontal:22,paddingBottom:22,gap:22},
  heading:{gap:12,alignItems:'flex-start'},
  status:{flexDirection:'row',alignItems:'center',gap:6},
  statusText:{fontSize:13,lineHeight:19,fontWeight:'500',color:C.accent},
  title:{maxWidth:310,fontSize:38,lineHeight:40,fontWeight:'600',letterSpacing:-1.7,color:C.ink},
  person:{position:'relative',flexDirection:'row',alignItems:'center',gap:16,paddingVertical:17,paddingLeft:12,paddingRight:18,minHeight:136,borderWidth:1,borderColor:'#65527F',borderRadius:26,backgroundColor:'#241D30'},
  character:{width:100,height:100,flexShrink:0,alignItems:'center',justifyContent:'center',borderTopLeftRadius:50,borderTopRightRadius:44,borderBottomRightRadius:48,borderBottomLeftRadius:40,backgroundColor:'#3B2D50'},
  avatar:{width:106,height:106,resizeMode:'contain'},
  personCopy:{flex:1,minWidth:0,gap:9,alignItems:'flex-start'},
  personKicker:{fontSize:9,lineHeight:14,letterSpacing:1.5,color:C.lavender},
  alias:{fontSize:27,lineHeight:31,letterSpacing:-.9,fontWeight:'600',color:C.ink},
  private:{flexDirection:'row',alignItems:'center',gap:5},
  privateText:{fontSize:12,lineHeight:18,color:'#D0C4DE'},
  spark:{position:'absolute',right:13,top:12},
  common:{gap:10},
  commonTitle:{fontSize:15,lineHeight:21,fontWeight:'500',color:C.muted},
  picks:{flexDirection:'row',flexWrap:'wrap',gap:7},
  pick:{flexDirection:'row',alignItems:'center',gap:5,maxWidth:'100%',paddingVertical:7,paddingHorizontal:10,borderRadius:10,backgroundColor:'#192318'},
  pickText:{flexShrink:1,fontSize:14,lineHeight:19,color:'#E1F4C7'},
  destination:{gap:4},
  cityPreview:{flexDirection:'row',alignItems:'center',gap:15,minHeight:108,borderWidth:1,borderColor:'#394A40',borderRadius:19,overflow:'hidden',backgroundColor:'#141B17'},
  cityImage:{alignSelf:'stretch',width:104,height:undefined,minHeight:108,aspectRatio:undefined,borderRadius:0},
  cityCopy:{flex:1,minWidth:0,gap:5,paddingVertical:12},
  cityKicker:{fontSize:9,lineHeight:13,letterSpacing:1.7,color:C.muted},
  cityName:{fontSize:28,lineHeight:32,letterSpacing:-1,fontWeight:'500',color:C.ink},
  country:{fontSize:14,lineHeight:20,color:C.muted},
  placeLinks:{flexDirection:'row',gap:16},
  placeLink:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,minHeight:48,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#2A352C'},
  placeName:{flexShrink:1,fontSize:15,lineHeight:20,color:'#D7DFD0'},
  actions:{paddingTop:12,paddingHorizontal:22,gap:2,borderTopWidth:1,borderTopColor:'#212B23',backgroundColor:C.ground},
  primary:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,minHeight:58,paddingVertical:14,paddingHorizontal:18,borderRadius:18,backgroundColor:C.primary},
  primaryText:{flexShrink:1,fontSize:20,lineHeight:26,fontWeight:'600',color:C.primaryInk,textAlign:'center'},
  plan:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,minHeight:44},
  planText:{fontSize:14,lineHeight:20,color:C.muted},
  pressed:{opacity:.75},
});
