import {doc,getDoc,serverTimestamp,setDoc} from 'firebase/firestore/lite';
import {prepareCitySuggestion,citySuggestionIdentity,type CitySuggestionDraft,type CitySuggestionReceipt,type ChallengeCrypto} from '@rymzi/core';
import {kymziDatabase} from './catalogue.ts';
import {withRequestTimeout} from './request-timeout.ts';
/** Only place names are submitted: no profile, visit history or coordinates. */
export async function submitCitySuggestion(raw:CitySuggestionDraft,crypto:Pick<ChallengeCrypto,'digest'>):Promise<CitySuggestionReceipt>{
 const draft=prepareCitySuggestion(raw),key=(await crypto.digest(citySuggestionIdentity(draft))).toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(key))throw Error('Couldn’t prepare this city. Please try again.');
 const reference=doc(kymziDatabase,'citySuggestions',key),receipt=(duplicate:boolean):CitySuggestionReceipt=>({...draft,id:key,status:'pending',duplicate});
 try{
  const existing=await withRequestTimeout(getDoc(reference));if(existing.exists())return receipt(true);
  try{await withRequestTimeout(setDoc(reference,{...draft,key,status:'pending',createdAt:serverTimestamp()}));}
  catch(error){if((error as {code?:string}).code==='permission-denied'&&(await withRequestTimeout(getDoc(reference))).exists())return receipt(true);throw error;}
  return receipt(false);
 }catch{throw Error('We couldn’t send this yet. Check your connection and try again.');}
}
