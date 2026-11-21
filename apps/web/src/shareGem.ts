import {gemShareCard,type PlaceDraft} from '@rymzi/core';
export async function shareGem(place:PlaceDraft):Promise<'shared'|'copied'|'cancelled'>{
 const card=gemShareCard(place);
 try{if(navigator.share){await navigator.share(card);return 'shared';}await navigator.clipboard.writeText(`${card.text}\n${card.url}`);return 'copied';}
 catch(error){if((error as Error).name==='AbortError')return 'cancelled';throw new Error('Couldn’t share this gem. Try again.');}
}
