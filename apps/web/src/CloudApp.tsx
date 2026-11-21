import {useEffect} from 'react';
import {publicCdnImage,useKymziConnection} from '@rymzi/cloud';
import App from './App';
export function CloudApp(){
 const {status,retry}=useKymziConnection();
 useEffect(()=>{if(status==='ready')document.documentElement.style.setProperty('--kymzi-portrait-url',`url("${publicCdnImage('/portraits/fictional-atlas.webp')}")`);},[status]);
 if(status==='ready')return <App/>;
 return <main className="cloud-start" role="status"><span className="cloud-start-mark">k</span>{status==='loading'?<span className="cloud-start-spinner" aria-label="Loading Kymzi"/>:<><p>Let’s reconnect.</p><button onClick={retry}>Try again</button></>}</main>;
}
