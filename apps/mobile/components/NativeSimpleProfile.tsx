import {HeaderScrollView as ScrollView} from './NativeHeaderGlass';
import {PageHeading} from './Typography';
import React,{useState,type ReactNode} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {AVATARS,palFindingProgress,type PreviewState} from '@rymzi/core';
import {NativeImage} from './NativeImage';
import {avatarImages} from './avatarAssets';
import {NativeClearLocalData} from './NativeClearLocalData';
import {NIGHT_THEME as C} from './theme';

type Glyph=React.ComponentProps<typeof Ionicons>['name'];
export type NativeProfileMenuItem={label:string;icon:Glyph;onPress:()=>void};
type Props={state:PreviewState;onEdit:()=>void;items:NativeProfileMenuItem[];travel?:ReactNode;onTravel?:()=>void;roamies?:ReactNode;onInvite?:()=>void;onFeed?:()=>void;onClear?:()=>Promise<void>};

function ProfileDrawer({label,icon,children}:{label:string;icon:Glyph;children:ReactNode}){
  const [open,setOpen]=useState(false);
  return <View><Pressable cssInterop={false} accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={({pressed})=>[S.row,pressed&&S.pressed]}><Ionicons name={icon} size={20} color="#A8B89B"/><Text style={S.rowLabel}>{label}</Text><Ionicons name={open?'chevron-up':'chevron-down'} size={17} color="#819077"/></Pressable>{open&&<View style={S.detail}>{children}</View>}</View>;
}

export function NativeSimpleProfile({state,onEdit,items,travel,onTravel,roamies,onInvite,onFeed,onClear}:Props){
  const p=state.profile!,circle=palFindingProgress(state),character=AVATARS.find(a=>a.id===p.avatar)!;
  return <SafeAreaView edges={['bottom']} style={S.page}><ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
    <View style={S.identity}>
      <View accessibilityLabel="Your avatar"><Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Edit avatar" onPress={onEdit} style={({pressed})=>[S.avatarFrame,pressed&&S.pressed]}><NativeImage showLoader source={avatarImages[p.avatar]} accessibilityLabel={`${character.name} avatar`} style={S.avatar}/><View style={S.avatarEdit}><Ionicons name="color-palette-outline" size={14} color={C.accent}/></View></Pressable></View>
      <View style={S.identityCopy}><PageHeading accessibilityRole="header" style={S.name}>#{p.name}</PageHeading><Pressable cssInterop={false} accessibilityRole="button" onPress={onEdit} style={({pressed})=>[S.edit,pressed&&S.pressed]}><Text style={S.editText}>Edit profile</Text><Ionicons name="arrow-forward" size={15} color={C.accent}/></Pressable></View>
    </View>

    {state.launch&&circle.eligible&&<View style={S.global} accessibilityLabel="Your circle">
      <View style={S.globalHeading}><PageHeading accessibilityRole="header" style={S.globalTitle}>Global play</PageHeading><View style={S.badge}><Ionicons name={circle.canPlay?'globe-outline':'lock-closed-outline'} size={12} color={circle.canPlay?C.accent:C.lavender}/><Text style={[S.badgeText,circle.canPlay&&{color:C.accent}]}>Global {circle.canPlay?'ON':'OFF'}</Text></View></View>
      <Text style={S.globalCopy}>{circle.canPlay?(circle.count?`${circle.count} friends`:'Ready to explore.'):circle.count?`${circle.count} added · ${circle.remaining} left`:'Five friends open the world.'}</Text>
      {!circle.canPlay&&<View accessibilityRole="progressbar" accessibilityLabel="Global unlock progress" accessibilityValue={{min:0,max:5,now:circle.count}} style={S.progress}>{Array.from({length:5},(_,i)=><View key={i} style={[S.pip,i<circle.count&&{backgroundColor:C.accent}]}/>)}</View>}
      <View style={S.globalActions}>{circle.canPlay?onFeed&&<Pressable cssInterop={false} accessibilityRole="button" onPress={onFeed} style={S.globalAction}><Text style={S.actionText}>Explore the world</Text><Ionicons name="arrow-forward" size={16} color={C.accent}/></Pressable>:onInvite&&<Pressable cssInterop={false} accessibilityRole="button" onPress={onInvite} style={S.globalAction}><Text style={S.actionText}>{circle.count?'Invite next friend':'Invite an explorer'}</Text><Ionicons name="arrow-forward" size={16} color={C.accent}/></Pressable>}{!circle.canPlay&&circle.count>0&&onFeed&&<Pressable cssInterop={false} accessibilityRole="button" onPress={onFeed} style={S.globalAction}><Text style={S.feedText}>See your feed</Text></Pressable>}</View>
    </View>}

    <View accessibilityLabel="Profile menu">
      {onTravel?<Pressable cssInterop={false} accessibilityRole="button" onPress={onTravel} style={({pressed})=>[S.row,pressed&&S.pressed]}><Ionicons name="globe-outline" size={20} color="#A8B89B"/><Text style={S.rowLabel}>My travel list</Text><Ionicons name="arrow-forward" size={17} color="#819077"/></Pressable>:travel&&<ProfileDrawer label="My travel list" icon="globe-outline">{travel}</ProfileDrawer>}
      {roamies&&<ProfileDrawer label="Your roamies" icon="people-outline">{roamies}</ProfileDrawer>}
      {items.map(item=><Pressable cssInterop={false} key={item.label} accessibilityRole="button" onPress={item.onPress} style={({pressed})=>[S.row,pressed&&S.pressed]}><Ionicons name={item.icon} size={20} color="#A8B89B"/><Text style={S.rowLabel}>{item.label}</Text><Ionicons name="arrow-forward" size={17} color="#819077"/></Pressable>)}
    </View>
    {onClear&&<View style={S.reset}><NativeClearLocalData onClear={onClear}/></View>}
  </ScrollView></SafeAreaView>;
}

const S=StyleSheet.create({
  page:{flex:1,backgroundColor:C.ground},body:{flexGrow:1,paddingHorizontal:24,paddingTop:18,paddingBottom:20,gap:24},
  identity:{flexDirection:'row',alignItems:'center',gap:22,paddingTop:6,paddingBottom:10},
  avatarFrame:{width:96,height:96,borderRadius:32,borderWidth:1,borderColor:'#6C8952',backgroundColor:'#233025',alignItems:'center',justifyContent:'center'},
  avatar:{width:94,height:94,resizeMode:'contain'},avatarEdit:{position:'absolute',right:-3,bottom:-3,width:27,height:27,borderRadius:14,borderWidth:3,borderColor:C.ground,backgroundColor:C.action,alignItems:'center',justifyContent:'center'},
  identityCopy:{flex:1,minWidth:0,gap:7},name:{fontSize:30,lineHeight:36,fontWeight:'600',letterSpacing:-1.2,color:C.ink},
  edit:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7,minHeight:44},editText:{fontSize:15,lineHeight:21,color:C.accent},
  global:{gap:12,paddingVertical:17,paddingHorizontal:18,borderWidth:1,borderColor:'#3C4935',borderRadius:20,backgroundColor:'#131A13'},
  globalHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},globalTitle:{fontSize:18,lineHeight:24,fontWeight:'500',letterSpacing:-.2,color:C.ink},
  badge:{flexDirection:'row',alignItems:'center',gap:4},badgeText:{fontSize:11,lineHeight:18,color:C.lavender},globalCopy:{fontSize:15,lineHeight:21,color:C.muted},
  progress:{flexDirection:'row',gap:6},pip:{flex:1,height:4,borderRadius:4,backgroundColor:'#35422F'},
  globalActions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',columnGap:12},globalAction:{flexDirection:'row',alignItems:'center',gap:8,minHeight:44},actionText:{fontSize:15,lineHeight:21,fontWeight:'500',color:C.accent},feedText:{fontSize:13,lineHeight:21,color:C.muted},
  row:{flexDirection:'row',alignItems:'center',gap:14,minHeight:58,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#29352C'},rowLabel:{flex:1,minWidth:0,fontSize:18,lineHeight:25,color:C.ink},
  detail:{gap:20,paddingTop:18,paddingBottom:22,borderBottomWidth:1,borderBottomColor:'#29352C'},reset:{marginTop:'auto',paddingTop:2},pressed:{opacity:.7},
});
