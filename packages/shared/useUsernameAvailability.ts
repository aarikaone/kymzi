import {useEffect,useState} from 'react';
import {localUsernameAvailability,normalizeUsername,readUsername,type PreviewState} from '@rymzi/core';
import {useRef} from 'react';
export function useUsernameAvailability(value:string,owner:string,state:PreviewState){
 const [result,setResult]=useState<{value:string;status:'checking'|'available'|'taken'|'invalid'}>({value:'',status:'invalid'}),latest=useRef(state);latest.current=state;const username=normalizeUsername(value),valid=!!readUsername(value);
 useEffect(()=>{if(!valid){setResult({value:username,status:'invalid'});return;}setResult({value:username,status:'checking'});const timer=setTimeout(()=>setResult({value:username,status:localUsernameAvailability(username,owner,latest.current)}),650);return()=>clearTimeout(timer);},[username,owner,valid]);
 const status=valid?(result.value===username?result.status:'checking'):'invalid';
 const message=!username?'3–20 letters, numbers or underscores.':!valid?'Start with a letter. Use 3–20 letters, numbers or underscores.':status==='checking'?'Checking username…':status==='taken'?'That username is taken. Try another.':`@${username} is available`;
 return {status,message,username,available:status==='available'};
}
