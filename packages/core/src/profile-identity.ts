import {demoPeers} from './index.ts';
import {readProfilePhoto} from './profile-photo.ts';
import type {Profile} from './types.ts';
import type {PreviewState} from './preview.ts';
export const USERNAME_RULE=/^[a-z][a-z0-9_]{2,19}$/;
export function normalizeUsername(value:unknown){return typeof value==='string'?value.normalize('NFKC').trim().replace(/^@/,'').toLowerCase():'';}
export function readUsername(value:unknown){const username=normalizeUsername(value);return USERNAME_RULE.test(username)?username:undefined;}
export function profileDisplayName(person:{username?:string;name:string}){return readUsername(person.username)?'@'+readUsername(person.username):/^\d+$/.test(person.name)?'#'+person.name:person.name;}
export function peerUsername(person:{username?:string;name:string}){return readUsername(person.username)??normalizeUsername(person.name).replace(/[^a-z0-9_]/g,'').slice(0,20);}
export function readProfileIdentity(value:unknown,band:Profile['ageBand']):Pick<Profile,'username'|'age13Confirmed'|'avatarPhoto'>{
 const p=value as Partial<Profile>|null;if(!p||typeof p!=='object')return {};const username=readUsername(p.username),age13Confirmed=p.age13Confirmed===true&&band!=='10-12',avatarPhoto=age13Confirmed?readProfilePhoto(p.avatarPhoto,band):undefined;
 return {...(username?{username}:{}),...(age13Confirmed?{age13Confirmed:true}:{}),...(avatarPhoto?{avatarPhoto}:{})};
}
export function readUsernameClaims(value:unknown):Record<string,string>{if(!value||typeof value!=='object'||Array.isArray(value))return {};return Object.fromEntries(Object.entries(value).slice(-200).flatMap(([key,owner])=>{const name=readUsername(key);return name&&typeof owner==='string'&&owner.length>0&&owner.length<=80?[[name,owner]]:[];}));}
/** Availability is scoped to the local prototype, not a global account directory. */
export function localUsernameAvailability(value:string,owner:string,state:PreviewState):'invalid'|'taken'|'available'{
 const username=readUsername(value);if(!username)return 'invalid';const claims=readUsernameClaims(state.usernameClaims),claimed=claims[username];if(claimed&&claimed!==owner)return 'taken';
 if(state.profile?.name===owner&&readUsername(state.profile.username)===username)return 'available';
 if(['admin','kymzi','rymzi','support','moderator','official','system'].includes(username)||demoPeers.some(peer=>peerUsername(peer)===username))return 'taken';
 if(state.profile&&state.profile.name!==owner&&readUsername(state.profile.username)===username)return 'taken';
 if([...(state.launch?.invites??[]).map(i=>i.person),...(state.launch?.postcards??[]).map(p=>p.person)].some(p=>p.name!==owner&&readUsername(p.username)===username))return 'taken';return 'available';
}
export function commitProfileIdentity(state:PreviewState,draft:Profile):PreviewState{
 const username=readUsername(draft.username);if(!username)throw new Error('Choose a username with 3–20 letters, numbers or underscores. Start with a letter.');
 if(draft.age13Confirmed!==true||draft.ageBand==='10-12')throw new Error('Confirm that you’re 13 or older to continue.');
 if(localUsernameAvailability(username,draft.name,state)!=='available')throw new Error('That username is taken. Choose another.');
 const usernameClaims=Object.fromEntries(Object.entries(readUsernameClaims(state.usernameClaims)).filter(([,owner])=>owner!==draft.name));usernameClaims[username]=draft.name;
 const identity=readProfileIdentity({...draft,username},draft.ageBand);if(draft.avatarPhoto&&!identity.avatarPhoto)throw new Error('Choose another profile photo.');return {...state,usernameClaims,profile:{...draft,...identity,username,age13Confirmed:true}};
}
