import {demoPeers,rankMatches,matchingAnswerCount} from './index.ts';
import {COUNTRIES,countryById,countryByName,type CountryId} from './countries.ts';
import type {DailyGame} from './daily.ts';
import type {AgeBand} from './types.ts';

export function playCountry(game:DailyGame):CountryId{
 const selected=countryById(game.active?game.active.countryId:game.lastCountryId);
 return selected?.id??COUNTRIES[Math.max(0,game.played-(game.active?0:1))%COUNTRIES.length].id;
}
export function encounterPeerIds(band:AgeBand,game:DailyGame,knownPeerIds:string[]=[]):string[]{
 if(band==='10-12')return [];
 const country=countryById(playCountry(game))!,index=COUNTRIES.findIndex(c=>c.id===country.id),peers=demoPeers.filter(p=>p.ageBand===band);
 const primary=peers.filter(p=>p.country===country.name).map(p=>p.id);
 const known=knownPeerIds.filter(id=>peers.some(p=>p.id===id)).slice(-3);
 const extras=[6,13].flatMap(offset=>peers.filter(p=>p.country===COUNTRIES[(index+offset)%COUNTRIES.length].name).slice(0,1).map(p=>p.id));
 return [...new Set([...primary,...known,...extras])];
}
export function rankPlayMatches(answers:Record<string,string>,band:AgeBand,game:DailyGame,blocked:string[]=[],knownPeerIds:string[]=[]){return rankMatches(answers,band,game.active?.ids??game.lastQuestionIds,blocked,encounterPeerIds(band,game,knownPeerIds));}
export function playAnswerCount(answer:string,id:string,band:AgeBand,game:DailyGame,blocked:string[]=[],knownPeerIds:string[]=[]){return matchingAnswerCount(answer,id,band,blocked,encounterPeerIds(band,game,knownPeerIds));}
