import {PlaceStackContext} from './PlaceStack';
import {travelPlaceStack,travelCityForPlace,setTravelCity,removeTravelCity} from '@rymzi/core';
import {UnlockedPlaces} from './UnlockedPlaces';
import {SavedGuidePlaces} from './SavedGuidePlaces';
import {AppBar} from './AppBar';
import {CityPlayContext} from './CityPlayCards';
import {placePlayAvailability} from '@rymzi/core';
import {publicCdnImage} from '@rymzi/core';
import {SimpleProfile} from './SimpleProfile';
import {WORLD_CATALOGUE} from '@rymzi/core';
import {CitySuggestionPage} from './CitySuggestion';
import type {CitySuggestionSource} from '@rymzi/core';
import {WorldLibrary} from './WorldLibrary';
import {shareGem} from './shareGem';
import {TravelSetup,TravelSetupPlaceViewer,type TravelSetupSection,type TravelSetupPage} from './TravelSetup';
import {VisitedPhotoFeed} from './VisitedPhotos';
import {TravelWishlist,TravelFootprints,RoamieWorlds,WishMilestones} from './TravelWorld';
import {readTravelProfile,completeTravelProfile,recordCityArrival,travelCityById,type TravelCityId,type TravelProfile} from '@rymzi/core';
import {PalsUnlock} from './PalsUnlock';
import {DayCardReceiver,ReceiverCircle} from './DayCardReceiver';
import {publishPlaceToPal} from '@rymzi/core';
import {PerfectDayPlay,PerfectDayTopics} from './PerfectDay';
import {beginPerfectDayPlay,withTravelQuestions,beginDayCard,hasDayCard,questionChoices,remainingDailyPlays} from '@rymzi/core';
import {SHOW_LEADERBOARD} from '@rymzi/core';
import {MapShareTask,MapsPlaceShare,PlaceLeaderboard} from './MapShares';
import {publishMapsPlace,recordReceivedPlaceFav} from '@rymzi/core';
import {PalsInbox,PlacesHub,PalDM} from './PalInbox';
import {pendingPalMessages,markPalDMRead,sendPalDM} from '@rymzi/core';
import {PlaceFeed,PlaceDetail} from './PlaceExperience';
import {markPlaceCheckInsSeen,unseenPlaceCheckIns,togglePlaceFavorite,ownPlaceCheckIns} from '@rymzi/core';
import {Favorites} from './Favorites';
import {togglePhotoFavorite} from '@rymzi/core';
import {HomeVisitMeet} from './HomeVisitMeet';
import {homeVisitForPal} from '@rymzi/core';
import {seedGlobalPals} from '@rymzi/core';
import {GlobalHome,GlobalCities} from './GlobalExperience';
import {CityMeetupFlow} from './CityMeetupFlow';
import {beginCityMeetup,cityMeetupNotice,viewMeetupRequests,type CityMeetupState} from '@rymzi/core';
import {LaunchUnlock} from './LaunchUnlock';
import {palFindingProgress,simulatePalUnlock,resetPalUnlock,hasInviteAnswers,beginInvitePreparation,invitePreparationQuestions,invitePreparationIndex,answerInvitePreparation,submitInvitePreparation,finishInvitePreparation} from '@rymzi/core';
import {LaunchAbout} from './LaunchAbout';
import type {Profile} from '@rymzi/core';
import {LaunchHome,LaunchCities,LaunchGuide,LaunchReady,LaunchInvite,LaunchTask,LaunchPhotos,LaunchPostcards,LaunchProfile,LaunchUpdates,ChallengeRoute} from './LaunchExperience';
import {enableLaunch,emptyLaunch,prepareLaunchTopics,beginLaunchPlay,finishLaunchPlay,makeFriendInvite,rememberInvite,collectPostcard,challengeToken,toggleGuide,toggleGuidePlace,addHomeMoment,removeLaunchMoment,type FriendReply} from '@rymzi/core';
import {webChallengeCrypto} from './launchCrypto';
import {ProfileSetup} from './ProfileSetup';
import {createSetupProfile,readProfileLocation} from '@rymzi/core';
import {AvatarPicker} from './AvatarPicker';
import {ExploreIntro,PalDetail,PalChat,PalMeeting,CitiesCollection} from './ExploreExperience';
import {palFor,palSummaries,beginPalPlay,sharePalMeeting,respondPalMeeting,meetingDateTime} from '@rymzi/core';
import {NavigationBar} from './NavigationBar';
import {MonthlyTasks} from './MonthlyTasks';
import {cityPhotoMonth,photoMonthProgress} from '@rymzi/core';
import {JOURNEY_COPY} from '@rymzi/core';
import {MonthlyPhotoGoal,UpdatesBell,HomePalPreview,PalUpdatesInbox,SpotCheckIn,SpotPeople,SpotMeetPlanner} from './HomeCommunity';
import {palUpdates,readPalUpdates,checkInAtSpot,requestSpotMeet,citySpot,currentCityVisit,type PalUpdate} from '@rymzi/core';
import {PalsHome,CameraCapture} from './CityPhotos';
import {addCameraMoment,toggleCityPhotoSaved,markCityPhotoSeen,unseenCityPhotos,markCityPhotosSeen,removeCityPhoto,hideCityPhoto,privatizeCityPhotos,canOpenCityPhotos,type CameraMoment,type CityPhotosState} from '@rymzi/core';
import {canUseCityBoard,postCityVisit,checkInCity,leaveCityVisit,requestCityMeet,acceptCityMeetPreview,cancelCityMeet,markCityUpdatesRead,hideAllCityVisits,type CityVisitsState} from '@rymzi/core';
import {AnonymousReveal,AnonymousCity,AnonymousAttraction,VisitsHome,VisitPlanner,VisitDetails,CityBoard,CityMeetPlanner,CityMeetDetails,CityUpdates} from './CityVisits';
import {completeDemoPlay,completedPreviewMatches,prepareDemoPlay} from '@rymzi/core';
import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { HashRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AGE_BANDS, AVATARS, dailyQuestions, demoPeers, matchingAnswerCount, rankMatches, hasIdea, requestIdea, weeklyIdeas, emptyPreview, readPreview, dailyStatus, beginDaily, beginSurpriseDaily, answerDaily, submitDaily, hasDailyProgress, resumeDailyIndex, completeDaily, scheduleDaily, activeQuestions, completedQuestions, displayPlayTime, nextPlayLabel, PLAY_CATEGORIES, type PlayCategoryId, type WeeklyIdeas, type PreviewState, type AgeBand, type AvatarId } from '@rymzi/core';
import { Icon, BrandMark } from './icons';
import { DailyHome } from './DailyHome';
import {Welcome} from './Welcome';
import { CategoryPicker } from './CategoryPicker';
import {PassportView,AtlasView,CityView,CityReveal,CrewView,PassportWelcome,Stamp} from './Passport';
import {SocialCrew} from './CountrySocial';
import {CountryPassport,CountryAtlas,PlaceArt} from './Explore';
import {worldStats,worldPlaces,uncoveredPlace,attractionById,learnAttraction,attractionChatDraft,revealDemoPortrait} from '@rymzi/core';
import {COUNTRIES,countryById,countryByName,countryProgress,knownConnectionIds,rankPlayMatches,playAnswerCount,recordConnections,connectionFor,canChat,canPlanMeetup,isAdult,startDemoChat,sendDemoMessage,proposeDemoMeetup,respondToDemoMeetup,cancelDemoMeetup,socialStats,disconnectPeer,type CountryId,type SocialState,type VenueId} from '@rymzi/core';
import {CITIES,cityById,cityForCountry,passportStats,passportStamps,latestJourney,recordJourney,selectPassportCover,type CoverId,type CityId} from '@rymzi/core';
const KEY='rymzi.preview.v1',IDEA_KEY='rymzi.ideas.v1';
function readLocal(key:string){try{const current=localStorage.getItem(key),legacy=current===null&&key.startsWith('rymzi.')?localStorage.getItem(key.replace(/^rymzi\./,'kymzi.')):null;return JSON.parse(current??legacy??'null');}catch{return null;}}
function Avatar({id,className=''}:{id:AvatarId;className?:string}){return <img className={`avatar ${className}`} src={publicCdnImage(`/avatars/${id}.webp`)} alt="" draggable="false"/>;}
function Button({children,onClick,secondary=false,disabled=false}:{children:ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}){return <button className={`button ${secondary?'secondary':''}`} onClick={onClick} disabled={disabled}>{children}</button>;}
function Row({children,onClick,icon='arrow'}:{children:ReactNode;onClick:()=>void;icon?:string}){return <button className="action-row" onClick={onClick}><span>{children}</span><Icon name={icon}/></button>;}
function Pager({index,count,onChange,label='shared answer'}:{index:number;count:number;onChange:(i:number)=>void;label?:string}){if(count<2)return null;return <div className="pager"><button className="icon-button" aria-label={`Previous ${label}`} disabled={index===0} onClick={()=>onChange(index-1)}><Icon name="back"/></button><span>{index+1} <span>/ {count}</span></span><button className="icon-button" aria-label={`Next ${label}`} disabled={index===count-1} onClick={()=>onChange(index+1)}><Icon name="arrow"/></button></div>;}
function useLocalPreview(autoLaunch:boolean):[PreviewState,Dispatch<SetStateAction<PreviewState>>]{
 const [raw,setRaw]=useState<PreviewState>(()=>{const state=readPreview(readLocal(KEY));const next=autoLaunch&&state.profile&&!state.launch?enableLaunch(state):state;return autoLaunch?seedGlobalPals(next):next;});
 const saved=raw.social&&raw.passport&&Array.isArray(raw.photos?.savedIds)&&!!raw.palInbox?raw:readPreview(raw);
 const setSaved=useCallback<Dispatch<SetStateAction<PreviewState>>>(action=>setRaw(previous=>{const current=previous.social&&previous.passport&&Array.isArray(previous.photos?.savedIds)&&!!previous.palInbox?previous:readPreview(previous);const next=typeof action==='function'?action(current):action;return autoLaunch?seedGlobalPals(next):next;}),[autoLaunch]);
 return [saved,setSaved];
}
export default function App(){return <PreviewApp autoLaunch/>;}
/** Historical UI regression harness; the shipped app always adopts launch mode. */
export function LegacyPreview(){return <PreviewApp autoLaunch={false}/>;}
function PreviewApp({autoLaunch}:{autoLaunch:boolean}){const [session,setSession]=useState(0);function restart(){window.history.replaceState(null,'',`${window.location.pathname}${window.location.search}#/welcome`);setSession(value=>value+1);}return <HashRouter key={session}><Flow autoLaunch={autoLaunch} onReset={restart}/></HashRouter>;}
function Flow({autoLaunch,onReset}:{autoLaunch:boolean;onReset:()=>void}){
  function clearLocalData(){sessionStorage.clear();localStorage.clear();onReset();}
  const [saved,setSaved]=useLocalPreview(autoLaunch);
  const [ideas,setIdeas]=useState<WeeklyIdeas>(()=>weeklyIdeas(readLocal(IDEA_KEY)));
  const [now,setNow]=useState(()=>new Date());
  const [identity]=useState(()=>createSetupProfile(saved.profile));
  const [avatar,setAvatar]=useState<AvatarId>(identity.avatar),[name,setName]=useState(identity.name),[band,setBand]=useState<AgeBand>(identity.ageBand);
  const [homeCity,setHomeCity]=useState(saved.profile?.city??''),[homeCountry,setHomeCountry]=useState(saved.profile?.country??'');
  const [profileError,setProfileError]=useState(''),[travelDraft,setTravelDraft]=useState<TravelProfile>(()=>readTravelProfile(saved.profile?.travel)),[travelPlacePicks,setTravelPlacePicks]=useState<Record<string,string[]>>({});
  const [time,setTime]=useState(saved.daily.playTime??'19:00'),[toast,setToast]=useState(''),[reportReason,setReportReason]=useState(''),[comparison,setComparison]=useState(0),[matchPage,setMatchPage]=useState(0);
  const navigate=useNavigate(),location=useLocation(),main=useRef<HTMLDivElement>(null),completing=useRef(false);
  const citySearches=useRef<Record<string,string>>({});
  const path=location.pathname==='/'?(saved.profile?'/home':'/welcome'):location.pathname;
  const travelSection:TravelSetupSection=new URLSearchParams(location.search).get('section')==='wishlist'?'wishlist':'visited';
  const travelRoute=path.startsWith('/travel-setup'),travelPage:TravelSetupPage=path==='/travel-setup/cities'?'cities':path==='/travel-setup/places'?'places':'list',travelCity=travelCityById(new URLSearchParams(location.search).get('city'))?.id??null;
  const travelViewing=path==='/travel-setup/view',travelPickKey=`${travelSection}:${travelCity}`,travelPicked=travelPlacePicks[travelPickKey]??travelDraft[travelSection].find(c=>c.cityId===travelCity)?.attractionIds??[];
  const launchMode=!!saved.launch,globalMode=!!saved.launch&&(palFindingProgress(saved).canPlay||palSummaries(saved).length>0),circleMode=!!saved.launch&&!palFindingProgress(saved).canPlay&&palFindingProgress(saved).count>0,palsLocked=!!saved.launch&&palFindingProgress(saved).eligible&&!palFindingProgress(saved).canPlay,publicChallenge=path.startsWith('/challenge/'),preparing=!!saved.launch?.preparation&&new URLSearchParams(location.search).get('invite')==='1';
  const [pendingReply,setPendingReply]=useState<FriendReply|undefined>(),[inviting,setInviting]=useState(false);
  const profile=saved.profile??{name:'Player',avatar:'cloud' as AvatarId,ageBand:'16-17' as AgeBand};
  const status=preparing?{kind:'ready' as const,remainingMs:0}:dailyStatus(saved.daily,now),questions=preparing?invitePreparationQuestions(saved):activeQuestions(saved.daily,profile.ageBand),lastQuestions=completedQuestions(saved.daily);
  const matches=useMemo(()=>completedPreviewMatches(saved),[saved]);
  const index=Math.max(0,Math.min(Number(path.split('/')[2])||0,2)),question=questions[index]??dailyQuestions[index],input=preparing?saved.launch!.preparation!.answers[index]:saved.daily.active?.answers[question.id]??'';
  const isPlay=path.startsWith('/play/'),tabs=['/home','/pals','/tasks','/passport','/favorites','/world'].includes(path),home=path==='/home';
  const peerId=path.split('/')[2],peer=matches.find(m=>m.peer.id===peerId)?.peer??demoPeers.find(p=>p.id===peerId&&p.ageBand===profile.ageBand&&!saved.blocked.includes(p.id)),selected=matches.find(m=>m.peer.id===peerId);
  const weekly=weeklyIdeas(ideas,now),remaining=3-weekly.used,idea=weekly.revealed[question.id],typingMatches=launchMode?0:playAnswerCount(input,question.id,profile.ageBand,saved.daily,saved.blocked,knownConnectionIds(saved.social,profile.ageBand,saved.blocked));
  const titles:Record<string,string>={'/city-suggestion':'Suggest a city','/city-check-in':'City check-in','/launch':'Explore','/launch/unlock':'Your five','/launch/ready':'Your 3','/launch/postcards':'Postcards','/launch/moments':'Your shared places','/welcome':'','/avatar':'Your alter ego','/setup':'Your profile','/travel-setup':'Your world','/home':'Home','/categories':'Choose a topic','/schedule':'Daily play time','/matching':profile.ageBand==='10-12'?'Your city':'Your roamie','/matches':'Matches','/profile':'Profile','/world':'Places','/favorites':'Places','/tasks':'Your tasks','/passport':'Places','/atlas':'Your atlas','/crew':'Leaderboard','/friends':'Roamies','/pals':'Roamies','/camera':'Share a place','/photos':'My shared places','/visits':'Visits','/plan-visit':'Plan a visit','/updates':'City updates','/travel':'Travel plans','/covers':'World','/saved':'Saved profiles','/settings':'Settings','/share':'Bring a friend','/about':'About Kymzi'};
  const title=travelRoute?(travelPage==='cities'?'Choose a city':travelPage==='places'?(travelCityById(travelCity)?.city??'Choose places'):travelSection==='visited'?'Visited cities':'Wishlist'):publicChallenge?'Friend challenge':path.startsWith('/pal-visit/')?'Meet your roamie':path.startsWith('/guide/')?'City guide':path.startsWith('/launch/receiver/')?'Receiver':path.startsWith('/launch/invite/')?'Travel postcard':path.startsWith('/pal-meet/')?'Meet your roamie':path.startsWith('/pal/')?'Your roamie':path.startsWith('/check-in/')?'Choose a spot':path.startsWith('/spot/')?'At this spot':path.startsWith('/photos/')?'Shared places':path.startsWith('/board/')?'City board':path.startsWith('/visit/')?'Your visit':path.startsWith('/meet-city/')?'Public meetup':path.startsWith('/meetup/')?'Meetup request':path.startsWith('/country/')?'City guide':path.startsWith('/friend/')?'Your roamie':path.startsWith('/chat/')?'Your conversation':path.startsWith('/meet/')?'Meetup demo':path.startsWith('/place/')?'Place to see':path.startsWith('/city/')?'City guide':isPlay?'Your day':path.startsWith('/match/')?'Your roamie':path.startsWith('/report/')?'Report profile':path.startsWith('/options/')?'Match options':titles[path]??'Kymzi';
  const go=(to:string,replace=false)=>navigate(to,{replace});
  useEffect(()=>{const tick=()=>setNow(new Date());const timer=setInterval(tick,1000);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',tick);};},[]);
  useEffect(()=>{if(autoLaunch)setSaved(s=>s);},[autoLaunch,saved.launch?.globalPlay?.activatedAt,saved.profile?.ageBand,saved.profile?.city,saved.profile?.country]);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}},[saved]);
  useEffect(()=>{try{localStorage.setItem(IDEA_KEY,JSON.stringify(ideas));}catch{}},[ideas]);
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key===KEY)setSaved(readPreview(readLocal(KEY)));if(event.key===IDEA_KEY)setIdeas(weeklyIdeas(readLocal(IDEA_KEY)));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{main.current?.scrollTo({top:0});main.current?.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});},[path]);
  useEffect(()=>{if(!isPlay)completing.current=false;},[path]);
  useEffect(()=>{if(path.startsWith('/photos/')&&canOpenCityPhotos(saved,peerId as CountryId)&&unseenPlaceCheckIns(saved,peerId as CountryId)>0)communityChange(s=>markPlaceCheckInsSeen(s,peerId as CountryId));},[path,profile.ageBand]);
  useEffect(()=>{if(path.startsWith('/chat/')&&palFor(saved,peerId))setSaved(s=>markPalDMRead(s,peerId));},[path,peerId,saved.social.threads[peerId]?.messages.at(-1)?.id]);
  function openCityCheckIn(id?:CountryId){if(saved.cityMeetup?.checkIn){try{launchChange(s=>({...s,cityMeetup:viewMeetupRequests(s.cityMeetup!)}));}catch(e){setToast((e as Error).message);return;}}go(`/city-check-in${id?`?city=${id}`:''}`);}
  function start(target?:unknown){
    const peerId=typeof target==='string'?target:undefined;
    if(launchMode){const fresh=readPreview(readLocal(KEY));if(palFindingProgress(fresh).eligible&&!palFindingProgress(fresh).canPlay){if(!hasDayCard(fresh))prepareInvite();else go('/launch/unlock');return;}try{const next=prepareLaunchTopics(fresh,new Date());localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);go(hasDailyProgress(next.daily)?`/play/${resumeDailyIndex(next.daily)}`:`/categories${peerId?`?pal=${encodeURIComponent(peerId)}`:''}`);}catch(e){setToast((e as Error).message);}return;}
    const daily=prepareDemoPlay(saved.daily,new Date());setSaved(s=>({...s,daily,social:{...s.social,focusCountryId:null}}));if(hasDailyProgress(daily)){startCategory();return;}if(daily.active)setSaved(s=>({...s,daily:{...daily,active:null}}));go(dailyStatus(daily).kind==='ready'?'/categories':'/home');
  }
  function startCategory(categoryId?:PlayCategoryId){
    const target=new URLSearchParams(location.search).get('pal')??undefined;
    if(launchMode){try{const next=beginPerfectDayPlay(readPreview(readLocal(KEY)),new Date(),target,categoryId);localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);go(`/play/${resumeDailyIndex(next.daily)}`);}catch(e){setToast((e as Error).message);}return;}
    try{const base=target?beginPalPlay({...saved,daily:prepareDemoPlay(saved.daily)},target,categoryId):beginSurpriseDaily(prepareDemoPlay(saved.daily),profile.ageBand,new Date(),categoryId),daily=withTravelQuestions(base,profile.ageBand,new Date(),categoryId);setSaved(s=>({...s,daily}));go(`/play/${resumeDailyIndex(daily)}`);}catch{go('/home',true);}
  }
  function playFromPlace(categoryId:PlayCategoryId){const fresh=readPreview(readLocal(KEY));if(launchMode&&palFindingProgress(fresh).eligible&&!palFindingProgress(fresh).canPlay){start();return;}startCategory(categoryId);}
  function replayPal(id:string){if(launchMode){start(id);return;}if(hasDailyProgress(saved.daily)){start();return;}const pal=palFor(saved,id);if(!pal||pal.matches>=5)return;go(`/categories?pal=${encodeURIComponent(id)}`);}
  function startPalChat(id:string){if(!palFor(saved,id))return;try{communityChange(s=>markPalDMRead(s,id));navigate(`/chat/${id}`,{state:{from:path}});}catch(e){setToast((e as Error).message);}}
  function changeAnswer(value:string){if(preparing){setSaved(s=>answerInvitePreparation(s,index,value));return;}try{setSaved(s=>({...s,daily:answerDaily(s.daily,question.id,value)}));}catch{go('/home',true);}}
  function submit(){
    if(!questionChoices(question).some(c=>c.label===input))return;
    if(preparing){try{const fresh=readPreview(readLocal(KEY)),draft=answerInvitePreparation(fresh,index,input),next=index<2?submitInvitePreparation(draft,index):finishInvitePreparation(draft);if(index===2)completing.current=true;localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);go(index<2?`/play/${index+1}?invite=1`:'/launch/unlock',index===2);}catch(e){setToast((e as Error).message);}return;}
    // Resume and charging use the latest saved game, so stale tabs cannot restore an old play.
    const stored=readPreview(readLocal(KEY));
    if(!stored.daily.active||stored.daily.active.startedAt!==saved.daily.active?.startedAt||stored.daily.active.ids.join(',')!==saved.daily.active?.ids.join(',')||dailyStatus(stored.daily).kind!=='ready'){setSaved(stored);go('/home',true);return;}
    const current={...stored.daily,active:{...stored.daily.active,answers:{...stored.daily.active.answers,[question.id]:input}}};
    if(index<2){try{const daily=submitDaily(current,question.id);const next={...stored,daily};localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);setNow(new Date());go(`/play/${index+1}`);}catch{go('/home',true);}return;}
    const missing=current.active.ids.findIndex(id=>!current.active.answers[id]?.trim());if(missing>=0){go(`/play/${missing}`,true);return;}
    try{if(launchMode){const next=finishLaunchPlay({...stored,daily:current});completing.current=true;localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);setNow(new Date());setComparison(0);setMatchPage(0);go(profile.ageBand==='10-12'?'/launch/ready':'/matching',true);return;}const next=completeDemoPlay({...stored,daily:current});completing.current=true;localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);setNow(new Date());setComparison(0);setMatchPage(0);go('/matching',true);}catch(e){setToast((e as Error).message);go('/home',true);}

  }
  function playInCountry(_countryId:CountryId){start();}
  function socialChange(action:(state:PreviewState)=>SocialState){const fresh=readPreview(readLocal(KEY));if(!fresh.profile)throw new Error('Create your profile first.');const social=action(fresh),next={...fresh,social};localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);return next;}
  function visitChange(action:(state:PreviewState)=>CityVisitsState){const fresh=readPreview(readLocal(KEY));const visits=action(fresh),next={...fresh,visits};localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);return visits;}
  function safeVisit(action:(state:PreviewState)=>CityVisitsState,after?:()=>void){try{visitChange(action);after?.();}catch(e){setToast((e as Error).message);}}
  function photoChange(action:(s:PreviewState)=>CityPhotosState){const fresh=readPreview(readLocal(KEY)),photos=action(fresh),next={...fresh,photos};try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Your device storage is full. Remove an older photo and try again.');}setSaved(next);return photos;}
  function safePhoto(action:(s:PreviewState)=>CityPhotosState){try{photoChange(action);}catch(e){setToast((e as Error).message);}}
  function openPlace(id:string){navigate(`/journal/${encodeURIComponent(id)}`,{state:{from:path}});}
  function openPhotos(id:CountryId,photoId?:string){communityChange(s=>markPlaceCheckInsSeen(s,id));navigate(photoId?`/journal/${encodeURIComponent(photoId)}`:`/photos/${id}`,{state:{from:path}});}
  function communityChange(action:(s:PreviewState)=>PreviewState){const next=action(readPreview(readLocal(KEY)));localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);return next;}
  function openUpdate(note:PalUpdate){const fresh=readPreview(readLocal(KEY)),current=palUpdates(fresh).find(n=>n.id===note.id);if(!current)return;communityChange(s=>readPalUpdates(s,[current.id]));if(current.target==='pal'&&current.peerId){go(`/pal/${current.peerId}`);return;}if(current.target==='pal-meet')go(`/pal-meet/${current.peerId}`);else if(current.target==='photos')openPhotos(current.countryId,current.photoId);else go(`/board/${current.countryId}`);}
  function checkInSpot(id:CountryId,spotId:string,visitId?:string){visitChange(s=>checkInAtSpot(s,id,spotId,new Date(),visitId));go(`/spot/${id}/${spotId}`,true);}

  function shootCity(id?:CountryId){go(`/camera${id?`?city=${id}`:''}`);}
  function planVisit(id?:CountryId){if(launchMode&&globalMode){openCityCheckIn(id);return;}go(`/plan-visit${id?`?city=${id}`:''}`);}
  function postVisit(id:CountryId,from:string,to:string,time:string){const result=visitChange(f=>postCityVisit(f,id,from,to,time));const visit=result.visits.find(v=>v.countryId===id&&v.ageBand===profile.ageBand&&v.status!=='cancelled')!;go(`/visit/${visit.id}`,true);}
  function suggestMeet(id:CountryId,visitorId:string,venue:VenueId,when:string){const result=visitChange(f=>requestSpotMeet(f,id,visitorId,when));go(`/meetup/${result.meetings.filter(m=>m.visitorId===visitorId&&m.status==='pending').at(-1)!.id}`,true);}
  function openChat(id:string,draft?:string){try{socialChange(f=>startDemoChat(f.social,id,f.profile!.ageBand,f.blocked));go(`/chat/${id}${draft?`?draft=${encodeURIComponent(draft)}`:''}`);}catch(e){setToast((e as Error).message);}}
  function safeSocial(action:(state:PreviewState)=>SocialState){try{socialChange(action);}catch(e){setToast((e as Error).message);}}
  function openSchedule(playNext=false){setTime(saved.daily.playTime??'19:00');navigate('/schedule',{state:{playNext}});}
  function saveTime(){try{const daily=scheduleDaily(saved.daily,time);setSaved(s=>({...s,daily}));setNow(new Date());go(location.state?.playNext?'/categories':'/home',true);}catch(e){setToast((e as Error).message);}}
  function finishSetup(travel?:TravelProfile){try{const fresh=readPreview(readLocal(KEY)),s=fresh.profile?fresh:saved,world=travel?completeTravelProfile(travel):s.profile?.travel,profile={name,avatar,ageBand:band,...readProfileLocation({city:homeCity,country:homeCountry}),...(world?{travel:world}:{})};if(!s.profile&&!world)throw new Error('Pick at least three wishlist places first.');const next={...s,profile,...(s.profile?.ageBand!==band?{answers:{},completed:false,saved:[],reactions:{},daily:{...s.daily,active:null},visits:hideAllCityVisits(s.visits),photos:{...privatizeCityPhotos(s.photos),...(!s.profile?{activityStartedMonth:cityPhotoMonth(new Date())}:{})}}:{})};let ready=s.profile?next:enableLaunch(next);if(pendingReply&&ready.profile?.ageBand!=='10-12')ready=collectPostcard(ready,pendingReply);localStorage.setItem(KEY,JSON.stringify(ready));setSaved(ready);setPendingReply(undefined);setProfileError('');go(saved.profile?'/profile':'/home',true);}catch{setProfileError('Couldn’t save. Free some device storage and try again.');}}
  function launchChange(action:(state:PreviewState)=>PreviewState){const fresh=readPreview(readLocal(KEY));const next=autoLaunch?seedGlobalPals(action(fresh)):action(fresh);try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Couldn’t save. Remove an older photo or free some device storage.');}setSaved(next);return next;}
  async function inviteFriend(){if(inviting)return;if(profile.ageBand==='10-12'){go('/passport');return;}if(!hasDayCard(saved)){prepareInvite();return;}setInviting(true);try{const invite=await makeFriendInvite(readPreview(readLocal(KEY)),webChallengeCrypto);launchChange(s=>rememberInvite(s,invite));go(`/launch/invite/${invite.id}`);}catch(e){setToast((e as Error).message);}finally{setInviting(false);}}
  function savePostcard(reply:FriendReply){launchChange(s=>collectPostcard(s,reply));go('/launch/unlock');}
  function prepareInvite(){try{const next=launchChange(s=>beginDayCard(s));go(`/play/${invitePreparationIndex(next)}?invite=1`);}catch(e){setToast((e as Error).message);}}
  function startPassport(person:Profile,reply?:FriendReply){if(saved.profile){if(reply)savePostcard(reply);else go('/home');return;}setName(person.name);setAvatar(person.avatar);setHomeCity(person.city??'');setHomeCountry(person.country??'');setPendingReply(reply);go('/setup');}
  useEffect(()=>{if(autoLaunch&&saved.profile&&!saved.launch){try{const next=enableLaunch(readPreview(readLocal(KEY)));localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);}catch{setToast('Could not save your progress. Check device storage.');}}},[autoLaunch,!!saved.profile,!!saved.launch]);
  useEffect(()=>{if(path==='/launch'&&saved.profile){try{const next=enableLaunch(readPreview(readLocal(KEY)));localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);go('/home',true);}catch{setToast('Could not save your progress. Check device storage.');}}},[path]);
  function editTravel(section:TravelSetupSection='visited'){setTravelPlacePicks({});setTravelDraft(readTravelProfile(saved.profile?.travel));setProfileError('');navigate(`/travel-setup?section=${section}`,{state:{returnTo:path,travelEditor:true}});}
  function returnFromTravel(){if(location.state?.travelEditor&&window.history.state?.idx>0)navigate(-1);else go(['/home','/profile','/passport','/favorites','/world'].includes(location.state?.returnTo)?location.state.returnTo:'/profile',true);}
  function cancelTravel(){setTravelDraft(readTravelProfile(saved.profile?.travel));setProfileError('');returnFromTravel();}
  function saveTravel(travel:TravelProfile){const current=readPreview(readLocal(KEY));if(!current.profile)throw new Error('Open your profile again to save.');const next={...current,profile:{...current.profile,travel:completeTravelProfile(travel)}};try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Couldn’t save. Free some device storage and try again.');}setSaved(next);setTravelDraft(next.profile.travel);setProfileError('');returnFromTravel();}
  function changeTravelSection(section:TravelSetupSection){navigate(`/travel-setup?section=${section}`,{replace:!!saved.profile,state:{...location.state,travelOnboarding:!saved.profile,previousVisited:!saved.profile&&travelSection==='visited'}});}
  function openTravelCities(){navigate(`/travel-setup/cities?section=${travelSection}`,{state:{...location.state,travelPickDepth:1}});}
  function openTravelCity(id:TravelCityId){setTravelPlacePicks(p=>({...p,[`${travelSection}:${id}`]:travelDraft[travelSection].find(c=>c.cityId===id)?.attractionIds??[]}));navigate(`/travel-setup/places?section=${travelSection}&city=${encodeURIComponent(id)}`,{state:{...location.state,travelPickDepth:travelPage==='cities'?2:1}});}
  function setTravelPicked(ids:string[]){setTravelPlacePicks(p=>({...p,[travelPickKey]:ids}));}
  function toggleTravelPicked(id:string){setTravelPicked(travelPicked.includes(id)?travelPicked.filter(p=>p!==id):[...travelPicked,id]);}
  function openTravelPlace(id:string,origin:unknown){navigate(`/travel-setup/view?section=${travelSection}&city=${encodeURIComponent(travelCity!)}&place=${encodeURIComponent(id)}`,{state:{...location.state,travelViewer:true,attractionOrigin:origin}});}
  function finishTravelSelection(){const depth=location.state?.travelPickDepth;if((depth===1||depth===2)&&window.history.state?.idx>=depth)navigate(-depth);else navigate(`/travel-setup?section=${travelSection}`,{replace:true,state:location.state});}
  const travelHeader=<TravelWishlist state={saved} onArrival={(id,evidence)=>{launchChange(s=>recordCityArrival(s,id,evidence));}} onEdit={editTravel}/>;
  function editProfile(){setAvatar(profile.avatar);setName(createSetupProfile(profile).name);setBand(profile.ageBand);setHomeCity(profile.city??'');setHomeCountry(profile.country??'');setProfileError('');go('/setup');}
  function suggestCity(query:string,source:CitySuggestionSource){citySearches.current[path+':'+travelSection]=query;navigate('/city-suggestion?query='+encodeURIComponent(query)+'&source='+source,{state:{citySuggestion:true,returnTo:path+location.search}});}
  function closeCitySuggestion(){if(location.state?.citySuggestion&&window.history.state?.idx>0)navigate(-1);else go(saved.profile?'/world':'/travel-setup?section=visited',true);}
  function back(){if(path==='/city-suggestion'){closeCitySuggestion();}else if(travelViewing){if(location.state?.travelViewer&&window.history.state?.idx>0)navigate(-1);else navigate(`/travel-setup/places?section=${travelSection}&city=${encodeURIComponent(travelCity??'')}`,{replace:true,state:location.state});}else if(travelRoute&&travelPage!=='list'){if(location.state?.travelPickDepth&&window.history.state?.idx>0)navigate(-1);else navigate(`/travel-setup?section=${travelSection}`,{replace:true,state:location.state});}else if(path==='/profile'&&typeof location.state?.from==='string')go(location.state.from,true);else if(path==='/travel-setup'){if(saved.profile)cancelTravel();else if(travelSection==='wishlist'){if(location.state?.previousVisited&&window.history.state?.idx>0)navigate(-1);else go('/travel-setup?section=visited',true);}else go('/setup',true);}else if(path.startsWith('/journal/'))go(typeof location.state?.from==='string'?location.state.from:'/home',true);else if(path.startsWith('/pal-visit/'))go(`/pal/${peerId}`,true);else if(path==='/city-check-in')go('/passport',true);else if(isPlay&&index>0)go(`/play/${index-1}${preparing?'?invite=1':''}`,true);else if(path==='/matching')go('/home',true);else if(path.startsWith('/check-in/')){const visit=new URLSearchParams(location.search).get('visit');go(visit?`/visit/${visit}`:`/board/${peerId}`,true);}else if(path.startsWith('/spot/'))go(`/board/${peerId}`,true);else if(path==='/updates')go(['/home','/passport','/tasks','/favorites','/pals','/photos','/profile','/visits'].includes(location.state?.from)?location.state.from:'/home',true);else if(path.startsWith('/photos/')&&typeof location.state?.from==='string'&&location.state.from.startsWith('/pal/')&&palFor(saved,location.state.from.split('/')[2]))go(location.state.from,true);else if(path.startsWith('/photos/'))go(canOpenCityPhotos(saved,peerId as CountryId)&&uncoveredPlace(saved,peerId as CountryId).uncovered?`/country/${peerId}`:profile.ageBand==='10-12'?'/photos':'/pals',true);else if(path==='/camera')go('/tasks',true);else if(path.startsWith('/chat/'))go(location.state?.from==='/pals'?'/pals':`/pal/${peerId}`,true);else if(path.startsWith('/pal-meet/'))go(`/pal/${peerId}`,true);else if(path.startsWith('/pal/'))go('/home',true);else if(path==='/tasks')go('/home',true);else if(path==='/photos')go('/profile',true);else if(path==='/visits')go('/pals',true);else if(path==='/passport'||path==='/atlas')go('/passport',true);else if(path.startsWith('/board/')||path==='/updates'||path==='/plan-visit')go('/visits',true);else if(path.startsWith('/visit/')||path.startsWith('/meetup/'))go('/visits',true);else if(path.startsWith('/meet-city/'))go(`/board/${peerId}`,true);else if(path.startsWith('/country/'))go('/passport',true);else if(path.startsWith('/place/'))go(`/country/${attractionById(peerId)!.countryId}`,true);else if(path.startsWith('/chat/'))go(`/friend/${peerId}`,true);else if(path.startsWith('/friend/')||path==='/matches')go('/friends',true);else if(isPlay||path==='/schedule'||path==='/categories')go('/home',true);else if(path==='/setup')go(saved.profile?'/profile':'/welcome',true);else if(path==='/avatar')go('/setup',true);else if(window.history.state?.idx>0)navigate(-1);else go('/home',true);}
  function useIdea(){const result=requestIdea(ideas,question.id);setIdeas(result.usage);}
  function toggleSave(id:string){setSaved(s=>({...s,saved:s.saved.includes(id)?s.saved.filter(v=>v!==id):[...s.saved,id]}));}
  const inviteUrl=()=>`${window.location.origin}${window.location.pathname}#/welcome`;
  async function copyLink(){try{await navigator.clipboard.writeText(inviteUrl());setToast('Invite copied. Your move.');}catch{setToast('Copy this page’s address to invite a friend.');}}
  async function share(){try{if(navigator.share)await navigator.share({title:'Next stop: anywhere.',text:`I’ve uncovered ${worldStats(saved).cities} cities in Kymzi’s demo. Answer 3. See where you land.`,url:inviteUrl()});else await copyLink();}catch(e){if((e as Error).name!=='AbortError')setToast('Try Copy link instead.');}}
  async function download(){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');if(!c)return;await document.fonts.ready;
    c.fillStyle='#090C0A';c.fillRect(0,0,1080,1350);const mark=new Image();mark.src=publicCdnImage('/brand/rymzi-mark.svg');try{await mark.decode();c.drawImage(mark,80,75,76,76);}catch{}c.fillStyle='#F1F5EB';c.font='700 86px "DM Sans",sans-serif';c.fillText('rymzi',174,145);c.font='600 79px "DM Sans",sans-serif';c.fillText('My people,',80,300);c.fillStyle='#D0DEC3';c.font='600 130px Caveat,cursive';c.fillText('worldwide.',80,420);
    const stats=socialStats(saved.social,saved.passport,profile.ageBand,saved.blocked),all=worldPlaces(saved).filter(p=>p.uncovered).slice(0,2);
    for(let i=0;i<all.length;i++){const item=all[i],x=80+i*470;c.fillStyle=item.country.ink;c.fillRect(x,520,440,500);c.fillStyle='#B1BCA822';c.fillRect(x+12,520,9,500);c.font='100px sans-serif';c.fillText(item.country.flag,x+150,700);c.fillStyle='#FFF5CF';c.font='600 38px "DM Sans",sans-serif';c.fillText(item.country.id==='AE'?'UAE':item.country.name,x+25,805,390);c.font='600 68px "DM Sans",sans-serif';c.fillText('UNCOVERED',x+28,925,390);c.font='25px "DM Sans",sans-serif';c.fillText(item.country.city.toUpperCase(),x+28,976);}
    c.fillStyle='#D5F88F';c.font='500 41px "DM Sans",sans-serif';c.fillText(`${stats.friends} Kymzis. ${stats.countries} countries.`,80,1135);c.fillStyle='#B1BCA8';c.font='29px "DM Sans",sans-serif';c.fillText('City discoveries collection',80,1240);const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='rymzi-my-world.png';a.click();
  }

  if(!saved.profile&&!publicChallenge&&!travelRoute&&path!=='/city-suggestion'&&!['/welcome','/avatar','/setup'].includes(path))return <Navigate to="/welcome" replace/>;
  if(path==='/launch'&&globalMode)return <Navigate to="/home" replace/>;
  if(path==='/friends')return <Navigate to={profile.ageBand==='10-12'?'/photos':'/pals'} replace/>;

  if(path.startsWith('/photos/')&&!canOpenCityPhotos(saved,peerId as CountryId))return <Navigate to={profile.ageBand==='10-12'?'/photos':'/pals'} replace/>;
  if(['/matches','/saved','/travel'].includes(path)||/^\/(friend|match|meet|options|report)\//.test(path))return <Navigate to={isAdult(profile.ageBand)?'/visits':'/passport'} replace/>;
  if((['/visits','/plan-visit'].includes(path)||/^\/(board|visit|meet-city|meetup|check-in|spot)\//.test(path))&&!isAdult(profile.ageBand))return <Navigate to="/passport" replace/>;
  if(path==='/city-check-in'&&profile.ageBand==='10-12')return <Navigate to="/passport" replace/>;
  if(path==='/updates'&&profile.ageBand==='10-12')return <Navigate to="/home" replace/>;
  if(/^\/(check-in|spot)\//.test(path)&&(!countryById(peerId)||!canUseCityBoard(saved,peerId as CountryId)))return <Navigate to="/passport" replace/>;
  if(path.startsWith('/spot/')&&!citySpot(peerId as CountryId,path.split('/')[3]))return <Navigate to={`/check-in/${peerId}`} replace/>;
  if((path==='/plan-visit')&&!worldPlaces(saved).some(p=>p.uncovered))return <Navigate to="/visits" replace/>;
  if(/^\/(board|meet-city)\//.test(path)&&(!countryById(peerId)||!canUseCityBoard(saved,peerId as CountryId)))return <Navigate to="/passport" replace/>;
  if(path.startsWith('/visit/')&&!saved.visits.visits.some(v=>v.id===peerId&&v.ageBand===profile.ageBand&&canUseCityBoard(saved,v.countryId)))return <Navigate to="/visits" replace/>;
  if(path.startsWith('/meetup/')&&!saved.visits.meetings.some(m=>m.id===peerId&&saved.visits.visits.some(v=>v.id===m.visitId&&v.ageBand===profile.ageBand)))return <Navigate to="/visits" replace/>;
  if(launchMode&&palFindingProgress(saved).eligible&&!palFindingProgress(saved).canPlay&&/^\/(pal|chat|pal-meet|pal-visit)\//.test(path))return <Navigate to="/launch/unlock" replace/>;
  if(isPlay&&!completing.current&&launchMode&&!preparing&&palFindingProgress(saved).eligible&&!palFindingProgress(saved).canPlay)return <Navigate to="/launch/unlock" replace/>;
  if(isPlay&&!completing.current&&(status.kind!=='ready'||(!preparing&&!saved.daily.active)||questions.length!==3))return <Navigate to="/home" replace/>;
  if(path==='/categories'&&launchMode&&palFindingProgress(saved).eligible&&!palFindingProgress(saved).canPlay)return <Navigate to="/launch/unlock" replace/>;
  if(path==='/categories'&&hasDailyProgress(saved.daily))return <Navigate to={`/play/${resumeDailyIndex(saved.daily)}`} replace/>;
  if(path==='/categories'&&status.kind!=='ready')return <Navigate to="/home" replace/>;
  if(path==='/schedule'&&!saved.daily.lastCompletedAt&&!saved.daily.usageDay)return <Navigate to="/home" replace/>;
  if(path.startsWith('/country/')&&!countryById(peerId))return <Navigate to="/passport" replace/>;
  if(/^\/(friend|chat|meet)\//.test(path)&&!connectionFor(saved.social,peerId,profile.ageBand,saved.blocked))return <Navigate to="/friends" replace/>;
  if(path.startsWith('/chat/')&&!palFor(saved,peerId))return <Navigate to={palFor(saved,peerId)?`/pal/${peerId}`:'/home'} replace/>;
  if(path.startsWith('/meet/')&&!canPlanMeetup(saved.social,peerId,profile.ageBand,saved.blocked))return <Navigate to={`/friend/${peerId}`} replace/>;
  if(path.startsWith('/pal-visit/')&&!homeVisitForPal(saved,peerId))return <Navigate to={palFor(saved,peerId)?`/pal/${peerId}`:'/home'} replace/>;
  if((path.startsWith('/pal/')||path.startsWith('/pal-meet/'))&&!palFor(saved,peerId))return <Navigate to="/home" replace/>;
  if(path.startsWith('/pal-meet/')&&!isAdult(profile.ageBand))return <Navigate to={`/pal/${peerId}`} replace/>;
  if(path==='/travel'&&!isAdult(profile.ageBand))return <Navigate to="/friends" replace/>;
  if(path.startsWith('/place/')&&(!attractionById(peerId)||!uncoveredPlace(saved,attractionById(peerId)!.countryId).uncovered))return <Navigate to="/passport" replace/>;
  if(path.startsWith('/city/')&&!cityById(peerId))return <Navigate to="/passport" replace/>;
  if(path==='/matching'&&!latestJourney(saved.passport))return <Navigate to="/home" replace/>;
  if(path.startsWith('/match/')&&(!peer||!lastQuestions.length||!saved.completed))return <Navigate to="/matches" replace/>;
  if(!Object.hasOwn(titles,path)&&!travelRoute&&!isPlay&&!/^\/(launch|guide|challenge|pal|pal-meet|pal-visit|match|options|report|city|country|friend|chat|meet|journal|place|board|visit|meet-city|meetup|photos|check-in|spot)\//.test(path))return <Navigate to="/home" replace/>;
  if(path.startsWith('/launch/')&&!launchMode)return <Navigate to="/launch" replace/>;
  if(launchMode&&/^\/launch\/(invite|receiver)\//.test(path)&&!saved.launch?.invites.some(i=>i.id===path.split('/')[3]))return <Navigate to={saved.launch?.tickets.length?'/launch/ready':'/home'} replace/>;
  if(launchMode&&path==='/launch/ready'&&!saved.launch?.tickets.length&&!(saved.launch?.unlockPreview&&saved.daily.lastCompletedAt))return <Navigate to="/home" replace/>;
  if(launchMode&&!globalMode&&path.startsWith('/photos/'))return <Navigate to="/launch/moments" replace/>;
  if(launchMode&&profile.ageBand==='10-12'&&(path==='/launch/unlock'||path==='/launch/postcards'||path.startsWith('/launch/invite/')||path.startsWith('/launch/receiver/')))return <Navigate to="/passport" replace/>;
  if(launchMode&&!globalMode&&path==='/matching')return <Navigate to="/launch/ready" replace/>;
  if(launchMode&&path==='/share')return <Navigate to={saved.launch?.tickets.length?'/launch/ready':'/home'} replace/>;
  if(path==='/crew'&&!SHOW_LEADERBOARD)return <Navigate to="/home" replace/>;
  if(launchMode&&path==='/visits')return <Navigate to="/home" replace/>;
  if(launchMode&&path.startsWith('/country/')&&(!globalMode||!uncoveredPlace(saved,peerId as CountryId).uncovered))return <Navigate to={`/guide/${peerId}`} replace/>;
  if(path.startsWith('/guide/')&&!countryById(peerId))return <Navigate to="/passport" replace/>;
  if(saved.profile&&travelRoute&&location.state?.travelOnboarding)return <Navigate to="/home" replace/>;
  const floatingIds=travelRoute?travelPlaceStack(travelDraft,travelSection,travelCity&&(travelPage==='places'||travelViewing)?{cityId:travelCity,ids:travelPicked}:undefined):saved.launch?.places??[];
  function removeFloatingPlace(id:string){
   if(!travelRoute){launchChange(s=>s.launch?.places.includes(id)?toggleGuidePlace(s,id):s);return;}
   const city=travelCityForPlace(id);if(!city)return;
   if(city.id===travelCity&&(travelPage==='places'||travelViewing)){setTravelPlacePicks(p=>({...p,[travelPickKey]:(p[travelPickKey]??travelDraft[travelSection].find(s=>s.cityId===city.id)?.attractionIds??[]).filter(v=>v!==id)}));return;}
   const cachedKey=`${travelSection}:${city.id}`;setTravelPlacePicks(p=>p[cachedKey]?{...p,[cachedKey]:p[cachedKey].filter(v=>v!==id)}:p);
   setTravelDraft(t=>{const found=t[travelSection].find(s=>s.cityId===city.id);if(!found)return t;const ids=found.attractionIds.filter(v=>v!==id);return travelSection==='wishlist'&&!ids.length?removeTravelCity(t,travelSection,city.id):setTravelCity(t,travelSection,{cityId:city.id,attractionIds:ids});});
  }
  return <PlaceStackContext.Provider value={{ids:floatingIds,kind:travelRoute?travelSection:'saved',onRemove:removeFloatingPlace,enabled:travelRoute||!!saved.profile&&!publicChallenge&&!['/welcome','/setup','/avatars'].includes(path)&&!path.startsWith('/launch/receiver/')}}><CityPlayContext.Provider value={{...placePlayAvailability(saved,now),onPlay:playFromPlace,savedPlaces:saved.launch?.places??[],onTogglePlace:id=>{launchChange(s=>toggleGuidePlace(s,id));}}}><div className="desktop-stage"><main className={`app-shell ${home?'game-home-theme':''} ${path==='/welcome'?'welcome-theme':''}`}>
    <div className="device-statusbar" aria-hidden="true"><span>{new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit',hour12:false}).format(now)}</span><span className="device-island"/><span className="device-signals">▮▮▮ <svg width="17" height="13" viewBox="0 0 18 14" fill="none"><path d="M1 4c5-4 11-4 16 0M4 7c3-2 7-2 10 0m-7 3c1-1 3-1 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="13" r="1" fill="currentColor"/></svg><span className="battery"/></span></div>
    {!travelViewing&&<AppBar standard={path!=='/welcome'} className={tabs||path==='/welcome'||publicChallenge?'app-root-bar':''}>{tabs||path==='/welcome'||publicChallenge?<>{tabs&&<button className="header-profile-shortcut" aria-label="Profile" onClick={()=>go('/profile')}><Avatar id={profile.avatar}/></button>}{!tabs&&<span className="header-spacer" aria-hidden="true"/>}<div className="header-brand"><BrandMark/></div></>:<>{path==='/travel-setup'&&saved.profile?<button className="travel-cancel" onClick={cancelTravel}>Cancel</button>:<button className="icon-button back" aria-label="Go back" onClick={back}><Icon name="back"/></button>}<span className="header-title">{title}</span></>}{path.startsWith('/launch/invite/')?<button className="receiver-preview-link" onClick={()=>go(`/launch/receiver/${path.split('/')[3]}`)}>Receiver</button>:path.startsWith('/launch/receiver/')?<button className="icon-button" aria-label="Close receiver preview" onClick={()=>go(`/launch/invite/${path.split('/')[3]}`,true)}><Icon name="close"/></button>:isPlay?<button className="icon-button" aria-label="Close game" onClick={()=>go('/home',true)}><Icon name="close"/></button>:/^\/(match|friend)\//.test(path)?<button className="icon-button" aria-label="More options" onClick={()=>go(`/options/${peerId}`)}><Icon name="more"/></button>:tabs?<div className="header-root-actions">{profile.ageBand!=='10-12'&&(launchMode?<button className="icon-button" aria-label="Notifications" onClick={()=>navigate('/updates',{state:{from:path}})}><Icon name="bell"/>{(cityMeetupNotice(saved.cityMeetup,now)?.unread||((globalMode||circleMode)&&palUpdates(saved,now).some(n=>!n.read)))&&<i className="meetup-notice-dot" aria-hidden="true"/>}</button>:<UpdatesBell state={saved} now={now} onOpen={()=>navigate('/updates',{state:{from:path}})}/>)}</div>:<span className="header-spacer"/>}</AppBar>}
    <div ref={main} className={`app-main ${home?'daily-home-main':''}`}><section key={path} className={`screen ${home?'home-screen':''} ${path==='/schedule'?'schedule-screen':''} ${path==='/categories'?'category-screen':''}`} aria-label={path==='/schedule'?'Play schedule':title||'Kymzi'} data-page={isPlay?'play':path.split('/')[1]}>
      {publicChallenge&&<ChallengeRoute state={saved} token={path.split('/')[2]==='result'?path.split('/')[3]??'':path.split('/')[2]??''} result={path.split('/')[2]==='result'} profile={saved.profile} ownInviteIds={saved.launch?.invites.map(i=>i.id)??[]} onStart={startPassport} onCollect={savePostcard}/>}
      {home&&launchMode&&!globalMode&&!circleMode&&!ownPlaceCheckIns(saved).length&&!saved.profile?.travel?.memories?.length&&!saved.profile?.travel?.wishFulfillments?.length&&<LaunchHome travel={<>{travelHeader}<VisitedPhotoFeed state={saved}/><WishMilestones state={saved}/></>} state={saved} now={now} onCheckIn={()=>openCityCheckIn()} onResetPreview={()=>{try{launchChange(resetPalUnlock);}catch(e){setToast((e as Error).message);}}} onPlay={start} onInvite={()=>void inviteFriend()} onGuide={id=>go(`/guide/${id}`)} onTasks={()=>go('/tasks')} onPostcards={()=>go('/launch/postcards')} onEdit={editProfile}/>}
      {(path==='/passport'||path==='/favorites'||path==='/world')&&<PlacesHub value={path==='/world'?'world':path==='/favorites'?'saved':'unlocked'} onChange={value=>go(value==='world'?'/world':value==='saved'?'/favorites':'/passport',true)}>{path==='/world'?<WorldLibrary initialQuery={citySearches.current[path+':'+travelSection]} onSuggestCity={suggestCity}/>:path==='/favorites'?<PlaceFeed header={<SavedGuidePlaces/>} favorites state={saved} now={now} onCheckIn={()=>go('/home')} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace}/>:<UnlockedPlaces state={saved} onPal={id=>go(`/pal/${id}`)} onCity={id=>go(`/country/${id}`)} onPhotos={openPhotos} onPlay={start} onWorld={()=>go('/world',true)}/>}</PlacesHub>}
      {path==='/pals'&&palsLocked&&<PalsUnlock state={saved} onFriend={()=>go('/launch/postcards')} onInvite={()=>void inviteFriend()}><RoamieWorlds state={saved}/></PalsUnlock>}
      {path==='/pals'&&!palsLocked&&<PalsInbox travel={<RoamieWorlds state={saved}/>} state={saved} onOpen={startPalChat} onPlay={start}/>}
      {path.startsWith('/guide/')&&<LaunchGuide key={peerId} state={saved} onCheckIn={()=>openCityCheckIn(peerId as CountryId)} id={peerId as CountryId} onSave={()=>{try{launchChange(s=>toggleGuide(s,peerId as CountryId));}catch(e){setToast((e as Error).message);}}} onPlace={id=>{try{launchChange(s=>toggleGuidePlace(s,id));}catch(e){setToast((e as Error).message);}}}/>}
      {path==='/city-check-in'&&<CityMeetupFlow profile={profile} session={saved.cityMeetup} now={now} initialCity={countryById(new URLSearchParams(location.search).get('city'))?.id} onChange={next=>{launchChange(s=>({...s,cityMeetup:next}));}} onExit={()=>go('/passport')}/>}
      {path==='/launch/unlock'&&<LaunchUnlock allowSimulation={palFindingProgress(saved).canPlay} state={saved} now={now} autoPreview={new URLSearchParams(location.search).get('demo')==='1'} onSimulate={()=>{launchChange(s=>simulatePalUnlock(s));}} onResetPreview={()=>{launchChange(resetPalUnlock);go('/home',true);}} onPrepare={prepareInvite} onInvite={()=>void inviteFriend()} onPlay={start} onExplore={()=>go('/passport')} onCollect={savePostcard}/>}
      {path==='/launch/ready'&&<LaunchReady state={saved} onInvite={()=>void inviteFriend()} onGuide={()=>go('/passport')}/>}
      {path.startsWith('/launch/receiver/')&&saved.launch?.invites.find(i=>i.id===path.split('/')[3])&&<DayCardReceiver key={path.split('/')[3]} state={saved} invite={saved.launch.invites.find(i=>i.id===path.split('/')[3])!} onComplete={reply=>{launchChange(s=>collectPostcard(s,reply));}} onReturn={()=>navigate(palFindingProgress(saved).unlocked?'/home':'/profile',{replace:true,state:{from:'/home'}})}/>}
      {path.startsWith('/launch/invite/')&&saved.launch?.invites.find(i=>i.id===path.split('/')[3])&&<LaunchInvite state={saved} invite={saved.launch.invites.find(i=>i.id===path.split('/')[3])!} onBack={()=>go('/home')}/>}
      {path==='/tasks'&&launchMode&&<MapShareTask state={saved} now={now} onShare={()=>shootCity()} onOpen={openPlace} onLeaderboard={()=>go('/crew')}/> }
      {(path==='/launch/moments'||path==='/photos')&&launchMode&&<PlaceFeed ownOnly state={saved} now={now} onCheckIn={()=>shootCity()} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace}/> }
      {path==='/launch/postcards'&&<LaunchPostcards state={saved} onPlay={()=>void inviteFriend()} onOpen={reply=>go(`/challenge/result/${challengeToken(reply)}`)}/>}
      {path==='/profile'&&launchMode&&<LaunchProfile onTravel={()=>editTravel('visited')} travel={<><TravelFootprints state={saved} onEdit={()=>editTravel('visited')}/>{travelHeader}</>} onInvite={()=>void inviteFriend()} onFeed={()=>go('/home')} onClear={clearLocalData} onCircle={()=>go('/launch/unlock')} state={saved} now={now} onPal={id=>go(`/pal/${id}`)} onEdit={editProfile} onTasks={()=>go('/tasks')} onCards={()=>go('/launch/postcards')} onPhotos={()=>go('/launch/moments')} onAbout={()=>go('/about')} onSchedule={()=>openSchedule()}/>}
      {path==='/updates'&&launchMode&&<LaunchUpdates state={saved} onPalUpdate={openUpdate} onCheckIn={()=>openCityCheckIn()} onInvite={()=>void inviteFriend()} onTasks={()=>go('/tasks')} onCards={()=>go('/launch/postcards')}/>}
      {path.startsWith('/journal/')&&<PlaceDetail onShare={profile.ageBand==='10-12'?undefined:place=>{void shareGem(place).then(result=>{if(result==='copied')setToast('Gem link copied');}).catch(error=>setToast(error.message));}} onCity={id=>go(`/country/${id}`)} onPlan={planVisit} state={saved} now={now} id={decodeURIComponent(peerId)} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onCheckIn={()=>shootCity()} onPal={id=>go(`/pal/${id}`)}/> }
      {home&&launchMode&&!globalMode&&(circleMode||ownPlaceCheckIns(saved).length>0||((saved.profile?.travel?.memories?.length??0)+(saved.profile?.travel?.wishFulfillments?.length??0))>0)&&<PlaceFeed header={circleMode?<><ReceiverCircle state={saved} onOpen={()=>go('/launch/postcards')} onInvite={()=>void inviteFriend()}/>{travelHeader}</>:<>{travelHeader}<button className="place-primary" onClick={hasDayCard(saved)?()=>void inviteFriend():start}>{hasDayCard(saved)?'Invite your first Roamie':'Build my travel day'}<Icon name="arrow"/></button></>} state={saved} now={now} onCheckIn={()=>shootCity()} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace} onPal={id=>go(`/pal/${id}`)}/>}
      {path==='/launch'&&<p className="launch-note">Opening Explore…</p>}
      {home&&(!launchMode||globalMode)&&profile.ageBand!=='10-12'&&((palSummaries(saved).length||ownPlaceCheckIns(saved).length||((saved.profile?.travel?.memories?.length??0)+(saved.profile?.travel?.wishFulfillments?.length??0)))?<PlaceFeed header={travelHeader} state={saved} now={now} onCheckIn={()=>shootCity()} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace} onPal={id=>go(`/pal/${id}`)} onPlay={start}/>:globalMode?<GlobalHome state={saved} now={now} onPlay={start} onTasks={()=>go('/tasks')} onCheckIn={()=>openCityCheckIn()}/>:<ExploreIntro state={saved} now={now} onPlay={start} onSchedule={()=>openSchedule()}/>)}
      {home&&!launchMode&&profile.ageBand==='10-12'&&<DailyHome community={<><HomePalPreview state={saved} now={now} onOpen={openUpdate}/></>} social={saved.social} profile={profile} blocked={saved.blocked} passport={saved.passport} onPassport={()=>go('/passport')} game={saved.daily} avatar={profile.avatar} now={now} canDiscover={profile.ageBand!=='10-12'} onPlay={start} onSchedule={()=>openSchedule(status.kind==='choose-time')} onShare={()=>go('/share')}/>}
      {((!launchMode&&(path==='/photos'||path.startsWith('/photos/')))||(globalMode&&path.startsWith('/photos/')))&&<PlaceFeed state={saved} now={now} countryId={path.startsWith('/photos/')?peerId as CountryId:undefined} ownOnly={path==='/photos'} onCheckIn={()=>shootCity()} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace} onPal={id=>go(`/pal/${id}`)}/>}
      {home&&!launchMode&&profile.ageBand==='10-12'&&ownPlaceCheckIns(saved).length>0&&<PlaceFeed ownOnly state={saved} now={now} onCheckIn={()=>shootCity()} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} onOpen={openPlace}/> }
      {path.startsWith('/pal-visit/')&&<HomeVisitMeet state={saved} now={now} peerId={peerId} onChange={action=>{launchChange(action);}} onBack={()=>go('/home',true)}/>}
      {path.startsWith('/pal/')&&<PalDetail onSharePlace={()=>go(`/camera?pal=${encodeURIComponent(peerId)}`)} onFavorite={id=>communityChange(s=>togglePlaceFavorite(s,id))} state={saved} now={now} id={peerId} onPlay={()=>replayPal(peerId)} onPhotos={(city,id)=>id?openPlace(id):openPhotos(city)} onCity={id=>go(`/country/${id}`)} onChat={()=>startPalChat(peerId)} onPlan={planVisit} onMeet={()=>go(`/pal-meet/${peerId}`)} onEditProfile={editProfile}/>}
      {path.startsWith('/chat/')&&<PalDM state={saved} id={peerId} onSend={body=>communityChange(s=>sendPalDM(s,peerId,body))} onPal={()=>go(`/pal/${peerId}`)} onMeet={()=>go(`/pal-meet/${peerId}`)}/> }
      {path.startsWith('/pal-meet/')&&palFor(saved,peerId)&&<PalMeeting state={saved} now={now} id={peerId} onCheckIn={spot=>visitChange(f=>checkInAtSpot(f,palFor(f,peerId)!.countryId,spot))} onShare={(spot,when)=>socialChange(f=>{const p=palFor(f,peerId)!;return sharePalMeeting(f,peerId,spot,meetingDateTime(when.split('T')[0],when.split('T')[1],countryById(p.countryId)!.timeZone));})} onRespond={(id,accept)=>socialChange(f=>respondPalMeeting(f,id,accept))}/>}
      {path==='/tasks'&&!launchMode&&<MapShareTask state={saved} now={now} onShare={()=>shootCity()} onOpen={openPlace} onLeaderboard={()=>go('/crew')}/> }
      {path==='/camera'&&<MapsPlaceShare recipient={palFor(saved,new URLSearchParams(location.search).get('pal')??'')?.alias} state={saved} onConfirm={draft=>{const palId=new URLSearchParams(location.search).get('pal');communityChange(s=>palId?publishPlaceToPal(s,draft,palId):publishMapsPlace(s,draft));}} onHome={()=>{const palId=new URLSearchParams(location.search).get('pal');go(palId&&palFor(saved,palId)?`/pal/${palId}`:'/home',true);}}/> }
      {path==='/visits'&&<VisitsHome state={saved} now={now} onPlan={planVisit} onVisit={id=>go(`/visit/${id}`)} onUpdates={()=>go('/updates')} onPlay={start} onMeet={id=>go(`/meetup/${id}`)}/>}
      {path.startsWith('/check-in/')&&<SpotCheckIn state={saved} now={now} id={peerId as CountryId} onCheckIn={spot=>checkInSpot(peerId as CountryId,spot,new URLSearchParams(location.search).get('visit')??undefined)}/>}
      {path.startsWith('/spot/')&&<SpotPeople state={saved} now={now} id={peerId as CountryId} spotId={path.split('/')[3]} onMeet={visitor=>go(`/meet-city/${peerId}/${visitor}`)} onLeave={()=>safeVisit(s=>leaveCityVisit(s,currentCityVisit(s,peerId as CountryId)!.id))} onChange={()=>go(`/check-in/${peerId}`,true)} onCheckIn={()=>go(`/check-in/${peerId}`,true)}/>}
      {path==='/plan-visit'&&<VisitPlanner state={saved} now={now} initialCountry={countryById(new URLSearchParams(location.search).get('city'))?.id} onPost={postVisit}/>}
      {path.startsWith('/board/')&&<CityBoard state={saved} now={now} id={peerId as CountryId} onPlan={planVisit} onVisit={id=>go(`/visit/${id}`)} onMeet={visitor=>go(`/meet-city/${peerId}/${visitor}`)} onUpdates={()=>go('/updates')} onCheckIn={()=>go(`/check-in/${peerId}`)} onSpot={spot=>go(`/spot/${peerId}/${spot}`)}/>}
      {path.startsWith('/visit/')&&<VisitDetails state={saved} now={now} id={peerId} onCheckIn={()=>go(`/check-in/${saved.visits.visits.find(v=>v.id===peerId)!.countryId}?visit=${peerId}`)} onLeave={cancel=>safeVisit(f=>leaveCityVisit(f,peerId,cancel),()=>go('/visits',true))} onBoard={id=>{const v=currentCityVisit(saved,id);go(v?.spotId?`/spot/${id}/${v.spotId}`:`/board/${id}`);}} onEdit={planVisit}/>}
      {path.startsWith('/meet-city/')&&<SpotMeetPlanner state={saved} now={now} countryId={peerId as CountryId} visitorId={path.split('/')[3]} onPost={when=>suggestMeet(peerId as CountryId,path.split('/')[3],'cafe',when)} onCheckIn={()=>go(`/check-in/${peerId}`)}/> }
      {path.startsWith('/meetup/')&&<CityMeetDetails state={saved} now={now} id={peerId} onAccept={()=>safeVisit(f=>acceptCityMeetPreview(f,peerId))} onCancel={()=>safeVisit(f=>cancelCityMeet(f,peerId))} onBoard={id=>go(`/board/${id}`,true)}/>}
      {path==='/updates'&&!launchMode&&<PalUpdatesInbox state={saved} now={now} onRead={()=>communityChange(s=>readPalUpdates(s))} onOpen={openUpdate}/>}
      {path==='/atlas'&&<CountryAtlas state={saved} onCountry={id=>go(`/country/${id}`)}/>}
      {path.startsWith('/country/')&&countryById(peerId)&&<AnonymousCity onPlan={planVisit} state={saved} id={peerId as CountryId} onAttraction={id=>go(`/place/${id}`)} onBoard={id=>go(`/board/${id}`)} onPhotos={openPhotos} onPlay={start}/>}
      {path==='/covers'&&<Navigate to="/passport" replace/>}
      {path==='/city/'+peerId&&<Navigate to={`/country/${COUNTRIES.find(c=>c.cityId===peerId)?.id??'JP'}`} replace/>}
      {SHOW_LEADERBOARD&&path==='/crew'&&<PlaceLeaderboard state={saved} now={now} onPreview={(placeId,palId)=>communityChange(s=>recordReceivedPlaceFav(s,placeId,palId,true))}/>}
      {path==='/categories'&&<><PerfectDayTopics left={remainingDailyPlays(saved.daily,now)} onSelect={startCategory}/></>}
      {path==='/welcome'&&<Welcome onStart={()=>go('/setup')}/>}
      {path==='/avatar'&&<AvatarPicker value={avatar} onDone={id=>{setAvatar(id);go('/setup',true);}}/>}
      {path==='/city-suggestion'&&<CitySuggestionPage initialCity={new URLSearchParams(location.search).get('query')??''} onDone={closeCitySuggestion}/>}
      {travelRoute&&!travelViewing&&<TravelSetup initialSearchQuery={citySearches.current[path+':'+travelSection]} onSuggestCity={suggestCity} initial={travelDraft} onChange={setTravelDraft} onComplete={saved.profile?saveTravel:finishSetup} onBack={back} editing={!!saved.profile} section={travelSection} onSectionChange={changeTravelSection} showBackButton={false} error={profileError} page={travelPage} cityId={travelCity} onOpenCities={openTravelCities} onOpenCity={openTravelCity} onSelectionDone={finishTravelSelection} selectedPlaces={travelPicked} onSelectedPlacesChange={setTravelPicked} onOpenPlace={openTravelPlace}/>}
      {travelViewing&&<TravelSetupPlaceViewer cityId={travelCity} placeId={new URLSearchParams(location.search).get('place')??''} selected={travelPicked} onToggle={toggleTravelPicked} onBack={back} origin={location.state?.attractionOrigin??null}/>}
      {path==='/setup'&&<ProfileSetup profile={{name,avatar,ageBand:band}} editing={!!saved.profile} busy={false} error={profileError} onAvatar={()=>go('/avatar')} onSave={()=>saved.profile?finishSetup():navigate('/travel-setup?section=visited',{state:{travelOnboarding:true}})}/>}
      {isPlay&&<PerfectDayPlay questions={questions} index={index} answer={input} answers={preparing?Object.fromEntries(questions.map((q,i)=>[q.id,saved.launch!.preparation!.answers[i]])):saved.daily.active?.answers??{}} onSelect={changeAnswer} onNext={submit} finalLabel={preparing?'Make my postcard':profile.ageBand==='10-12'?'See my day':'Find my roamie'}/>}
      {path==='/schedule'&&<><div className="schedule-intro"><h1 className="page-heading" tabIndex={-1}>When should{' '}plays open?</h1><p>5 new plays every day, at your time.</p></div><div className="time-picker-stage"><div className="clock-mini" aria-hidden="true"><Icon name="clock" size={25}/></div><label htmlFor="play-time" className="visually-hidden">Daily play time</label><input type="time" id="play-time" className="play-time-input" value={time} onChange={e=>setTime(e.target.value)} required/><p className="small">Your local time</p></div><div className="footer-actions"><Button disabled={!time} onClick={saveTime}>{location.state?.playNext?'Save & play':'Save time'}<Icon name="arrow"/></Button></div></>}
      {path.startsWith('/place/')&&<AnonymousAttraction onNext={id=>go(`/place/${id}`,true)} state={saved} id={peerId} onLearn={()=>safeSocial(f=>learnAttraction(f,peerId))} onCity={()=>go(`/country/${attractionById(peerId)!.countryId}`,true)}/>}
      {path==='/matching'&&<AnonymousReveal onPal={id=>go(`/pal/${id}`,true)} onPhotos={openPhotos} onPlan={planVisit} state={saved} onCountry={id=>go(`/country/${id}`,true)} onAttraction={id=>go(`/place/${id}`)} onBoard={id=>go(`/board/${id}`,true)}/>}
      {path==='/share'&&<><div className="intro"><h1 className="page-heading" tabIndex={-1}>Thoughts that{'\n'}<em>go places.</em></h1></div><div className="share-world-art" aria-hidden="true">{worldPlaces(saved).filter(p=>p.uncovered).slice(0,2).map(p=><PlaceArt key={p.country.id} country={p.country}/>)}{!worldStats(saved).cities&&<Icon name="globe" size={140}/>}</div><div className="footer-actions"><Button onClick={share}>Send the invite <Icon name="share"/></Button><div className="share-secondary"><button className="text-button" onClick={copyLink}>Copy link <Icon name="arrow" size={20}/></button><button className="text-button muted" onClick={download}>Save image <Icon name="download" size={19}/></button></div><p className="small center">Preview · share links work on this device</p></div></>}
      {path==='/profile'&&!launchMode&&<SimpleProfile state={saved} onTravel={()=>editTravel('visited')} onEdit={editProfile} onClear={clearLocalData} travel={saved.profile?.travel?<><TravelFootprints state={saved} onEdit={()=>editTravel('visited')}/>{travelHeader}</>:undefined} items={[
        {label:'My cities',icon:'globe',onClick:()=>go('/passport')},
        {label:'My shared places',icon:'pin',onClick:()=>go('/photos')},
        {label:'Share places',icon:'plus',onClick:()=>go('/tasks')},
        ...(isAdult(profile.ageBand)?[{label:'Visits',icon:'calendar',onClick:()=>go('/visits')}]:[]),
        ...(saved.daily.lastCompletedAt?[{label:'Daily play time',icon:'clock',onClick:()=>openSchedule()}]:[]),
        {label:'Settings',icon:'settings',onClick:()=>go('/settings')},
      ]}/> }
      {path==='/settings'&&<><h1 className="page-heading" tabIndex={-1}>Settings.</h1><Row onClick={()=>go('/share')} icon="share">Invite an explorer</Row><Row onClick={()=>go('/about')} icon="info">About Kymzi</Row><p className="small">Saved on this device.</p></>}
      {path==='/about'&&launchMode&&<LaunchAbout onBack={()=>go('/home')}/>}
      {path==='/about'&&!launchMode&&<><h1 className="page-heading" tabIndex={-1}>A little curiosity.{'\n'}<em>A bigger world.</em></h1><div className="about-facts"><p><Icon name="smile"/>3 answers · 5 plays a day</p><p><Icon name="compass"/>{WORLD_CATALOGUE.cities.toLocaleString('en')} cities · {WORLD_CATALOGUE.places.toLocaleString('en')} places to explore</p><p><Icon name="camera"/>Hidden gems, shared by locals</p><p><Icon name="chat"/>City DMs · Photo after 3 matches</p><p><Icon name="shield"/>Anonymous city connections</p></div><div className="about-notes"><p className="small">City presence and meetups are for adults only. Younger children explore privately; teen roamies stay within their age group.</p><p className="small">Fictional matches and illustrated place previews. Your chosen character is your public identity. Progress saved on this device. Connections stay anonymous. City boards, check-ins, notifications and meetup requests are local previews; no real announcement or invitation is sent.</p></div></>}
    </section></div>
    {tabs&&<NavigationBar path={path} avatar={profile.avatar} privatePhotos={profile.ageBand==='10-12'} unreadCount={pendingPalMessages(saved)} count={profile.ageBand==='10-12'?saved.photos.photos.filter(p=>p.ageBand===profile.ageBand).length:worldStats(saved).friends} onNavigate={to=>go(to,true)}/>}
    {toast&&<div className="toast" role="status"><Icon name="check" size={19}/>{toast}</div>}
  </main></div></CityPlayContext.Provider></PlaceStackContext.Provider>;
}
