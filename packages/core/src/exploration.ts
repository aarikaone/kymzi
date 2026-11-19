import {COUNTRIES,countryById,type CountryId} from './countries.ts';
import {ATTRACTIONS,attractionById,attractionsForCountry} from './attractions.ts';
import {canChat,connections,countryProgress,type SocialState} from './social.ts';
import type {PassportState} from './passport.ts';
import type {AgeBand,DemoPeer} from './types.ts';
type WorldState={social:SocialState;passport:PassportState;profile:{ageBand:AgeBand}|null;blocked:string[]};
export function uncoveredPlace(state:WorldState,id:CountryId){
 const band=state.profile?.ageBand??'16-17',progress=countryProgress(state.social,state.passport,band,id),people=connections(state.social,band,state.blocked).filter(f=>f.countryId===id),attractions=attractionsForCountry(id),learned=attractions.filter(a=>(state.social.exploredAttractionIds??[]).includes(a.id));
 return {country:countryById(id)!,uncovered:progress.count>0,people,attractions,learned};
}
export function worldPlaces(state:WorldState){return COUNTRIES.map(c=>uncoveredPlace(state,c.id));}
export function worldStats(state:WorldState){const places=worldPlaces(state).filter(p=>p.uncovered);return {countries:places.length,cities:places.length,attractions:places.reduce((n,p)=>n+p.learned.length,0),availableAttractions:places.reduce((n,p)=>n+p.attractions.length,0),friends:connections(state.social,state.profile?.ageBand??'16-17',state.blocked).length,totalCities:COUNTRIES.length,totalAttractions:ATTRACTIONS.length};}
export function learnAttraction(state:WorldState,id:string):SocialState{const attraction=attractionById(id);if(!attraction||!uncoveredPlace(state,attraction.countryId).uncovered)throw new Error('A Kymzi match uncovers this city first.');if((state.social.exploredAttractionIds??[]).includes(id))return state.social;return {...state.social,exploredAttractionIds:[...(state.social.exploredAttractionIds??[]),id]};}
export function revealDemoPortrait(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[]):SocialState{if(!canChat(social,peerId,band,blocked))throw new Error('Match twice to reveal a fictional photo.');if((social.revealedPeerIds??[]).includes(peerId))return social;return {...social,revealedPeerIds:[...(social.revealedPeerIds??[]),peerId]};}
export function portraitRevealed(social:SocialState,peerId:string,band:AgeBand,blocked:string[]=[]){return canChat(social,peerId,band,blocked)&&(social.revealedPeerIds??[]).includes(peerId);}
export function portraitFrame(peer:DemoPeer){const row=peer.ageBand==='25-30'?3:Math.max(0,['13-15','16-17','18-20','21-24'].indexOf(peer.ageBand));const column=[...peer.id].reduce((n,c)=>n+c.charCodeAt(0),0)%4;return {row,column,x:column*100/3,y:row*100/3};}
export function attractionChatDraft(state:WorldState,attractionId:string,peerId:string){const a=attractionById(attractionId),friend=connections(state.social,state.profile?.ageBand??'16-17',state.blocked).find(f=>f.peer.id===peerId);if(!a||!friend||friend.countryId!==a.countryId||!canChat(state.social,peerId,state.profile!.ageBand,state.blocked))throw new Error('Choose a twice-matched Kymzi from this city.');return a.question;}
