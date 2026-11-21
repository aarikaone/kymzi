import type {ChallengeCrypto} from '@rymzi/core';
export const webChallengeCrypto:ChallengeCrypto={
 nonce:()=>{const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');},
 digest:async value=>{if(!globalThis.crypto?.subtle)throw new Error('Open this page on HTTPS or localhost to create a challenge.');const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');},
};
export async function shareChallenge(url:string,title='Join my Kymzi circle'){
 if(navigator.share){try{await navigator.share({title,text:'Build your kind of day with me on Kymzi.',url});return 'shared';}catch(error){if((error as Error).name==='AbortError')return 'cancelled';throw error;}}
 if(!navigator.clipboard?.writeText)throw new Error('Copy the link below to send it to your friend.');
 await navigator.clipboard.writeText(url);return 'copied';
}
