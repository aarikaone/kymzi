import type {PreviewState} from './preview.ts';
export type PostcardGuide={owner:string;seenAt:string};
export function readPostcardGuide(value:unknown,owner?:string):PostcardGuide|undefined{if(!owner||!value||typeof value!=='object')return;const p=value as PostcardGuide;if(p.owner!==owner||typeof p.seenAt!=='string'||!Number.isFinite(Date.parse(p.seenAt)))return;return {owner,seenAt:new Date(p.seenAt).toISOString()};}
export function hasSeenPostcardGuide(state:PreviewState){return !!readPostcardGuide(state.postcardGuide,state.profile?.name);}
export function understandPostcards(state:PreviewState,now=new Date()):PreviewState{if(!state.profile||state.profile.ageBand==='10-12')throw new Error('Your collection stays private.');if(hasSeenPostcardGuide(state))return state;return {...state,postcardGuide:{owner:state.profile.name,seenAt:now.toISOString()}};}
