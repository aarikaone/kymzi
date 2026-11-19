import {readCityMeetup,type CityMeetupState} from './city-meetups.ts';
import {readLaunch,enableLaunch,palFindingProgress,simulatePalUnlock,type LaunchState} from './launch.ts';
import {readProfilePhoto} from './profile-photo.ts';
import {readProfileLocation} from './profile-setup.ts';
import {emptyPalInbox,readPalInbox,type PalInboxState} from './pal-activity.ts';
import {emptyCityPhotos,readCityPhotos,type CityPhotosState} from './photos.ts';
import {emptyCityVisits,readCityVisits,type CityVisitsState} from './visits.ts';
import { AGE_BANDS, AVATARS, rankMatches } from './index.ts';
import { emptyDaily, readDaily, type DailyGame } from './daily.ts';
import {emptyPassport,readPassport,recordJourney,type PassportState} from './passport.ts';
import {emptySocial,readSocial,recordConnections,connections,type SocialState} from './social.ts';
import type { Profile } from './types.ts';
export type PreviewState = { profile: Profile | null; launch?:LaunchState;cityMeetup?:CityMeetupState; answers: Record<string,string>; completed: boolean; daily:DailyGame; passport:PassportState; social:SocialState; visits:CityVisitsState; photos:CityPhotosState; palInbox:PalInboxState; saved: string[]; blocked: string[]; reactions: Record<string,string>; rounds: number; reports: { peerId:string; reason:string; createdAt:string }[] };
export function emptyPreview(now=new Date()): PreviewState { return { profile:null, answers:{}, completed:false, daily:emptyDaily(),passport:emptyPassport(),social:emptySocial(),visits:emptyCityVisits(),photos:emptyCityPhotos(now),palInbox:emptyPalInbox(),saved:[], blocked:[], reactions:{}, rounds:0, reports:[] }; }
export function readPreview(value: unknown,now=new Date()): PreviewState {
  const data = value as Partial<PreviewState> | null;
  if (!data?.profile || !AGE_BANDS.includes(data.profile.ageBand) || !AVATARS.some(a=>a.id===data.profile!.avatar)) return emptyPreview(now);
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter(v=>typeof v==='string') : [];
  const record = (value: unknown): Record<string,string> => value && typeof value==='object' ? Object.fromEntries(Object.entries(value).filter(([,v])=>typeof v==='string')) : {};
  const photo=readProfilePhoto(data.profile.photo,data.profile.ageBand);
  const launch=readLaunch(data.launch,now);
  const result:PreviewState={ ...emptyPreview(now),...(launch?{launch}:{}), passport:readPassport(data.passport),social:readSocial(data.social), visits:readCityVisits(data.visits),photos:readCityPhotos(data.photos,now),palInbox:readPalInbox(data.palInbox), profile:{name:String(data.profile.name||'Player').slice(0,18),avatar:data.profile.avatar,ageBand:data.profile.ageBand,...readProfileLocation(data.profile),...(photo?{photo}:{})}, answers:record(data.answers), completed:data.completed===true, daily:readDaily(data.daily,data.completed===true,now),saved:strings(data.saved), blocked:strings(data.blocked), reactions:record(data.reactions), rounds:Math.max(0,Number(data.rounds)||0), reports:Array.isArray(data.reports)?data.reports:[] };
  if(result.launch&&palFindingProgress(result).unlocked&&!palFindingProgress(result).activated)result.launch=simulatePalUnlock(result,now).launch;
  const meetup=readCityMeetup(data.cityMeetup,result.profile!);if(meetup)result.cityMeetup=meetup;
  if(!Object.hasOwn(data,'passport')&&result.completed)result.passport=recordJourney(result.passport,result.daily,result.profile!.ageBand,rankMatches(result.answers,result.profile!.ageBand,result.daily.lastQuestionIds,result.blocked));
  if(!Object.hasOwn(data,'social')&&result.completed)result.social=recordConnections(result.social,result.daily,result.profile!.ageBand,rankMatches(result.answers,result.profile!.ageBand,result.daily.lastQuestionIds,result.blocked));
  if(result.launch&&!result.launch.globalPlay&&connections(result.social,result.profile!.ageBand,result.blocked).length)result.launch=enableLaunch(result,now).launch;
  return result;
}
