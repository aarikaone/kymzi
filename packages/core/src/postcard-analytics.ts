import {postcardHub} from './postcard-hub.ts';
import {readFriendReply,challengeToken,friendScore,type ChallengeCrypto} from './launch.ts';
import {questionById,questionChoices} from './question-library.ts';
import {normalizeAnswer} from './index.ts';
import type {PreviewState} from './preview.ts';
/** Resolve only a returned play on the current owner's bottle postcard. Never publish answer text in links. */
export async function postcardPlayAnswers(state:PreviewState,inviteId:string,replyId:string,crypto:Pick<ChallengeCrypto,'digest'>){
 const hub=postcardHub(state),card=hub.cards.find(c=>c.inviteIds.includes(inviteId)),invite=state.launch?.invites.find(i=>i.id===inviteId),raw=state.launch?.postcards.find(r=>r.id===replyId);
 if(hub.private||!card||!invite||!raw||state.profile?.name!==invite.person.name)throw new Error('This postcard’s results are unavailable.');
 const reply=readFriendReply(raw,new Date(raw.completedAt));if(reply.invite.id!==inviteId||reply.person.name===state.profile.name||challengeToken(reply.invite)!==challengeToken(invite))throw new Error('This play belongs to another postcard.');
 const score=friendScore(reply),rows=await Promise.all(invite.ids.map(async(id,i)=>{const question=questionById(id),options=question?questionChoices(question):[],hashes=await Promise.all(options.map(choice=>crypto.digest('kymzi-friend-v1:'+invite.id+':'+id+':'+normalizeAnswer(choice.label))));return {id,prompt:question?.prompt??'Your travel pick',you:options.find((_,j)=>hashes[j]===invite.hashes[i])?.label??null,them:options.find((_,j)=>hashes[j]===reply.hashes[i])?.label??null,matched:score.matched[i]};}));
 return {replyId,shared:score.shared,matched:score.connects,rows};
}
