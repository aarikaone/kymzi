import {useContext,useState} from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {travelCityForPlace,type TravelCity} from '@rymzi/core';
import {NativeCityPlayContext} from './NativeCityPlayCards';
import {NativeGuidePlaceArt} from './NativeTravelArt';
import {NativeCitySheet} from './NativeTravelSetup';
import {useCityPlaces} from './useCityPlaces';
import {NIGHT_THEME as C} from './theme';
function SavedCity({city,ids,onOpen}:{city:TravelCity;ids:string[];onOpen:(id:string)=>void}){
 const guide=useCityPlaces(city.id);
 return <View style={{gap:10}} accessibilityLabel={`Saved places in ${city.city}`}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{fontSize:16,fontWeight:'600',color:C.ink}}>{city.city}</Text><Text style={{fontSize:13,color:C.muted}}>{ids.length}</Text></View>{guide.loading&&<Text accessibilityLiveRegion="polite" style={{color:C.muted}}>Loading saved places…</Text>}{!!guide.error&&<Pressable onPress={guide.retry} accessibilityRole="button"><Text style={{color:C.accent,paddingVertical:12}}>Retry places</Text></Pressable>}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{guide.places.filter(p=>ids.includes(p.id)).map(place=><Pressable cssInterop={false} key={place.id} accessibilityRole="button" accessibilityLabel={`Open saved ${place.name}`} onPress={()=>onOpen(place.id)} style={{width:210,borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:C.line,backgroundColor:C.surface}}><NativeGuidePlaceArt place={place} style={{height:138}}/><View style={{padding:12,gap:5}}><Text numberOfLines={2} style={{fontSize:17,fontWeight:'600',lineHeight:22,color:C.ink}}>{place.name}</Text><Text numberOfLines={1} style={{fontSize:12,color:C.muted}}>{place.kind}</Text></View></Pressable>)}</ScrollView></View>;
}
export function NativeSavedGuidePlaces(){
 const play=useContext(NativeCityPlayContext),[opened,setOpened]=useState<string|null>(null),[limit,setLimit]=useState(12),groups=new Map<string,{city:TravelCity;ids:string[]}>();
 for(const id of play?.savedPlaces??[]){const city=travelCityForPlace(id);if(!city)continue;const entry=groups.get(city.id)??{city,ids:[]};entry.ids.push(id);groups.set(city.id,entry);}
 if(!groups.size)return null;
 return <View style={{gap:24}}>{[...groups.values()].slice(0,limit).map(({city,ids})=><SavedCity key={city.id} city={city} ids={ids} onOpen={setOpened}/>)}{groups.size>limit&&<Pressable onPress={()=>setLimit(n=>n+12)} accessibilityRole="button"><Text style={{color:C.accent,paddingVertical:12}}>More saved cities</Text></Pressable>}<NativeCitySheet cityId={opened?travelCityForPlace(opened)?.id??null:null} initialPlaceId={opened??undefined} onClose={()=>setOpened(null)}/></View>;
}
