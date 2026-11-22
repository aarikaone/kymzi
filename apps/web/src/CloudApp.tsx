import {useEffect} from 'react';
import {publicCdnImage,useKymziConnection} from '@rymzi/cloud';
import App from './App';
import {LoadingLogo} from './LoadingLogo';
export function CloudApp(){
 const {status,retry}=useKymziConnection();
 useEffect(()=>{if(status==='ready')document.documentElement.style.setProperty('--kymzi-portrait-url',`url("${publicCdnImage('/portraits/fictional-atlas.webp')}")`);},[status]);
 if(status==='ready')return <App/>;
 return <main className="cloud-start" role="status"><LoadingLogo loading={status==='loading'}/>{status!=='loading'&&<><p>Let’s reconnect.</p><button onClick={retry}>Try again</button></>}</main>;
}
